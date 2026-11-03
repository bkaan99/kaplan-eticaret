# Kaplan Turşu E-Ticaret Platformu - Kapsamlı Eksikler ve İyileştirme Raporu

> **Son Güncelleme:** 4 Kasım 2026  
> **Kapsam:** Mimari İnceleme, SOLID Prensipleri, Cloudflare Workers & D1 Uyumluluğu, Çalışma Zamanı Hataları (Bug Analysis), Kullanıcı Deneyimi ve Entegrasyonlar  
> **Durum:** Kod tabanı baştan sona taranmış, tamamlanan maddeler doğrulanmış ve tespit edilen güncel hata ile açıklar önceliklendirilmiştir.

---

## 1. Yönetici Özeti ve Mimari Durum Değerlendirmesi

Platform, PostgreSQL/Prisma altyapısından **Cloudflare Workers + OpenNext + D1 (SQLite) + Drizzle ORM + Cloudflare R2 + Cloudflare Queues** mimarisine taşınmıştır. Bu taşınma sırasında yüzeyi daraltmak amacıyla kullanılmayan `stock-alerts` ve `erp` modülleri güvenli bir şekilde ayıklanmıştır.

Bütün kod tabanı (70 test paketi, 473 birim testi ve TypeScript derleyicisi) baştan sona incelenmiş; tamamlanmış özellikler (oranlama/slider, Actor tipi standardizasyonu, `stock.replenished` hayalet olayının temizliği vb.) doğrulanarak rapordan güncellenmiş, henüz çözülmemiş **3 kritik çalışma zamanı hatası (P1)**, **3 mimari/tasarım ihlali (P2)** ve **3 ürün/entegrasyon eksiği (P3)** detaylandırılmıştır.

---

## 2. Kritik Hatalar ve Fonksiyonel Uyuşmazlıklar (P1)

### 2.1. Havale/EFT ve Vadeli Siparişlerde Bildirim E-Postalarının Gönderilmemesi (Temporal Coupling)
- **Öncelik:** 🔴 P1 - Acil
- **İlgili Dosyalar:**
  - [`src/modules/checkout/container.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/checkout/container.ts#L15-L36)
  - [`src/modules/notifications/container.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/notifications/container.ts#L43-L68)
  - [`src/app/(storefront)/odeme/actions.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/app/(storefront)/odeme/actions.ts#L90-L114)
  - [`src/modules/checkout/order-placement.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/checkout/order-placement.ts#L101)
- **Hata Analizi:**
  Kullanıcı Havale/EFT veya Vadeli Ödeme seçerek sipariş verdiğinde, `placeOrderAction` sunucu eylemi `getCheckoutService().placeOrder(...)` metodunu çağırır. Sipariş oluşturulduktan sonra `strategy.publishPlacedEvent(...)` vasıtasıyla `EventBus` üzerine `order.placed` olayı yayınlanır.
  Ancak `getCheckoutService()`, olay dinleyicilerini (`bus.subscribe`) belleğe bağlayan `getNotificationService()` fonksiyonunu çağırmamaktadır.
- **Etki:**
  Cloudflare Workers / sunucusuz istek yaşam döngüsünde `order.placed` olayı hafızada 0 abonesi olan boş bir otobüse fırlatılır. Sipariş oluşturulur ancak:
  1. Havale/EFT yapan müşteriye banka hesap/IBAN bilgilerini ve sipariş özetini içeren onay e-postası gitmez.
  2. Yöneticiye yeni sipariş bildirimi ulaşmaz.
- **Çözüm:**
  `src/modules/checkout/container.ts` içerisindeki `getCheckoutService()` metodunun başına `getNotificationService();` çağrısı eklenmeli veya olay kayıtları modül yüklenirken/bootstrap aşamasında deterministik olarak bağlanmalıdır.

---

### 2.2. İade Onayında Hatalı Sağlayıcı Çağrısı (Havale ve Vadeli Siparişlerde İade Çökmesi)
- **Öncelik:** 🔴 P1 - Acil
- **İlgili Dosyalar:**
  - [`src/modules/returns/return.service.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/returns/return.service.ts#L110-L148)
  - [`src/modules/returns/container.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/returns/container.ts#L10-L19)
  - [`src/modules/orders/payment-refund-strategy.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/orders/payment-refund-strategy.ts)
- **Hata Analizi:**
  Sipariş iptal sürecinde (`OrderService.cancelByStaff`), ödeme tipine göre iade mantığını ayıran `PaymentRefundStrategyRegistry` (`CardRefundStrategy` PayTR'ı çağırırken, `ManualRefundStrategy` havale/vadeli siparişlerde PayTR çağrısını baypas eder) uygulanmıştır.
  Fakat `ReturnService` bu mekanizmaya dahil edilmemiştir! `ReturnService`, bağımlılık olarak doğrudan ham `refunder: getPaymentProvider()` (PayTR) almaktadır. Yönetici panelinden bir iade talebi onaylandığında (`returnService.approve`), sipariş ister kartla ister havale/vadeli ödenmiş olsun istisnasız `this.deps.refunder.refund({ merchantOid, amount })` çağrılmaktadır.
- **Etki:**
  Banka havalesi veya vadeli ödeme ile verilmiş bir siparişin iadesi yönetici tarafından onaylandığında, PayTR API'sine geçersiz bir sipariş numarası ile iade isteği gider. PayTR hata döndürür ve yönetici arayüzünde işlem çöker; havale ve vadeli siparişlerin iadesi sistem üzerinden onaylanamaz hale gelir.
- **Çözüm:**
  `ReturnService` de tıpkı `OrderService` gibi `PaymentRefundStrategyRegistry` arayüzünü kullanmalı; havale ve vadeli siparişler için otomatik ödeme sağlayıcı çağrısı yapılmadan manuel iade/mahsuplaşma kaydı oluşturulmalıdır.

---

### 2.3. Cloudflare D1 Eşzamanlılık ve Vadeli Sipariş Kredi Limiti Yarış Durumu (Race Condition)
- **Öncelik:** 🔴 P1 - Güvenlik / Finansal Risk
- **İlgili Dosyalar:**
  - [`src/modules/orders/order.repository.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/orders/order.repository.ts#L434-L443)
- **Hata Analizi:**
  Cloudflare D1 (SQLite) üzerinde satır düzeyinde kilitleme (`SELECT ... FOR UPDATE`) ve interaktif transaction bulunmamaktadır. `D1OrderRepository.createDeferredOrder` metodunda önce `outstandingDeferred(userId)` ile bayinin açık borcu okunmakta, ardından `CreditLimitPolicy.assertAllowed` ile limit kontrol edilmekte ve sonra sipariş batch olarak kaydedilmektedir.
- **Etki:**
  Kötü niyetli veya eşzamanlı istek atan bir bayi (örneğin iki ayrı sekmeden aynı anda sipariş onayı gönderildiğinde), her iki istek de borç tutarını henüz sipariş yazılmadan okuduğu için limit kontrolünü geçer. Bayi, tanımlanmış kredi limitinin çok üzerinde vadeli sipariş oluşturabilir.
- **Çözüm:**
  Sipariş ekleme işlemine uygulama katmanında bir idempotency anahtarı veya bayi bazlı tekil kilit (örneğin D1 rate limit benzeri atomik sayaç/token kapısı) eklenmelidir.

---

### 2.4. `DevPaymentProvider.signPayload` LSP İhlali ve Ortam Bağımlılığı
- **Öncelik:** 🟠 P2 - Mimari / Kod Bütünlüğü
- **İlgili Dosyalar:**
  - [`src/integrations/payment/dev/dev-payment-provider.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/integrations/payment/dev/dev-payment-provider.ts#L37-L43)
  - [`src/integrations/payment/container.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/integrations/payment/container.ts#L34-L37)
  - [`src/app/(storefront)/odeme/actions.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/app/(storefront)/odeme/actions.ts#L117-L136)
- **Hata Analizi:**
  `DevPaymentProvider`, `PaymentProvider` arayüzünü uygulamaktadır ancak arayüzde olmayan `signPayload` metodunu barındırır. `container.ts` içerisinde `getDevPaymentProvider()` metodu eklenerek concrete sınıfa type cast yapılmış ve `src/app/(storefront)/odeme/actions.ts` dosyasındaki `devPaymentAction` bu metoda doğrudan bağlanmıştır.
- **Etki:**
  Liskov Substitution Principle (LSP) ihlal edilmiştir. Canlı ortamda veya PayTR anahtarları tanımlı bir ortamda bu action çağrıldığında `getDevPaymentProvider()` geriye `null` döner ve işlem sessizce yutularak kullanıcı yanıtsız bırakılır.
- **Çözüm:**
  Geliştirme ortamı ödeme simülasyonu sunucu eylemlerinden ayrıştırılmalı, yalnızca yerel geliştirme route'u altında izole edilmeli veya ödeme sağlayıcısı arayüzüne genel bir test imzalama metodu taşınmalıdır.

---

## 3. Mimari ve SOLID Prensipleri İyileştirmeleri (P2)

### 3.1. DIP İhlali: Statik Konfigürasyona (`siteConfig`) Doğrudan Bağımlılık
- **İlgili Dosyalar:**
  - [`src/modules/checkout/shipping.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/checkout/shipping.ts#L20-L21)
  - [`src/modules/notifications/container.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/notifications/container.ts#L50)
- **Sorun:**
  `ConfiguredShippingRateCalculator` sınıfı konfigürasyonu constructor üzerinden zorunlu bağımlılık olarak almak yerine, `@/config/site.config` dosyasındaki statik objeyi varsayılan argüman olarak bağlamaktadır (`constructor(private readonly config: ShippingConfig = siteConfig.shipping)`).
- **Etki:**
  Birim testlerinde dinamik kargo tarifeleri test edilirken yan etkilere yol açabilir ve çoklu mağaza/dinamik ayar senaryolarını kısıtlar.
- **Çözüm:**
  Bağımlılıklar container seviyesinde constructor üzerinden saf bağımlılık enjeksiyonu ile geçilmelidir.

---

### 3.2. Terk Edilmiş Sepetlerin Süpürülmemesi (Missing Cart Cleanup Cron)
- **İlgili Dosyalar:**
  - [`src/app/api/cron/`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/app/api/cron/)
  - [`workers/app-worker.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/workers/app-worker.ts#L130-L147)
  - [`src/db/schema.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/db/schema.ts#L453-L480)
- **Sorun:**
  Cron uç noktaları arasında süresi dolan rezervasyonları çözen (`release-expired`), rate limit kayıtlarını temizleyen (`purge-rate-limits`) ve denetim kayıtlarını silen (`purge-audit-log`) işler mevcuttur. Ancak anonim ziyaretçilerin oluşturduğu ve terk ettiği `Cart` ile `CartItem` satırlarını süzen bir temizleme işi yoktur.
- **Etki:**
  Cloudflare D1 SQLite depolama sınırlarında zamanla gereksiz veri birikimi ve indeks şişmesi meydana gelir.
- **Çözüm:**
  30 günden eski ve ilişkili siparişi olmayan sepetleri silen `/api/cron/purge-abandoned-carts` uç noktası ve cron trigger'ı eklenmelidir.

---

## 4. Kullanıcı Deneyimi ve Ürün Backlog'u (P3)

### 4.1. Malzeme Bazında Stok ve Tedarik / Mevsimsellik Takibi
- **İlgili Dosyalar:**
  - [`src/db/schema.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/db/schema.ts#L830) (`pickleIngredient` tablosu)
  - [`src/modules/custom-pickle/custom-pickle.service.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/modules/custom-pickle/custom-pickle.service.ts)
- **Durum:**
  `PickleIngredient` modelinde yalnızca `isActive: Boolean` alanı yer almaktadır. Malzeme bazında kilogram/adet stoku, kritik stok uyarı seviyesi veya mevsimsel uygunluk ayları (`seasonMonths`) bulunmamaktadır.
- **Öneri:**
  Malzemelere kilogram bazlı stok takibi eklenmeli veya en azından admin panelinden "Mevsimi Bitti / Geçici Temin Edilemiyor" durumları için planlı pasife alma desteği verilmelidir.

---

### 4.2. Müşteri Değerlendirme ve Yorum Motoru (Review Engine)
- **İlgili Dosyalar:**
  - [`src/app/(storefront)/page.tsx`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/app/(storefront)/page.tsx#L182) (`CustomerReviews`)
- **Durum:**
  Anasayfadaki kullanıcı yorumları statik olarak kodlanmıştır. Gerçek müşterilerin teslim edilmiş siparişlerinden sonra ürüne puan (1-5 yıldız), fotoğraf ve yorum bırakabileceği interaktif bir altyapı bulunmamaktadır.
- **Öneri:**
  `Review` tablosu, admin panelinde onay/red mekanizması ve ürün detay sayfasında doğrulanmış alıcı (verified buyer) rozetli müşteri değerlendirme sekmesi geliştirilmelidir.

---

### 4.3. Canlı Kargo API Entegrasyonu (Yurtiçi, Aras, MNG)
- **İlgili Dosyalar:**
  - [`src/shared/shipping/carriers.ts`](file:///Users/sdsa/Desktop/kaplan-eticaret/src/shared/shipping/carriers.ts)
- **Durum:**
  Kargo takip numaraları admin tarafından manuel girilmekte ve şablon URL üretilmektedir.
- **Öneri:**
  Kargo şirketlerinin SOAP/REST API'leri entegre edilerek sipariş kargolandığında otomatik barkod/irsaliye fişi basılması ve teslim edildi bilgisinin webhook ile anlık güncellenmesi sağlanmalıdır.

---

## 5. Tamamlanan ve Doğrulanan İyileştirmeler (Doğrulama Kaydı)

Aşağıdaki maddelerin güncel kod tabanında çözüldüğü ve birim testlerle doğrulandığı teyit edilmiştir:

1. ✅ **Malzeme Karışım Oranları (Slider / Paylaştırma):**
   - `custom-pickle.shares.ts` modülü ile %10'luk adımlarla malzeme oranlama, toplamın %100'e dengelenmesi (`equalShares`, `balanceShares`) ve arayüz entegrasyonu (`builder-steps.tsx`, `builder-insights.tsx`) tamamlanmıştır.
2. ✅ **`Actor` Tipinin Standardizasyonu:**
   - Admin modülündeki dairesel bağımlılık çözülmüş, `Actor` arayüzü doğrudan `src/shared/audit/audit-logger.ts` altında merkezileştirilmiştir.
3. ✅ **`stock.replenished` Hayalet Olayının (Ghost Event) Temizlenmesi:**
   - Cloudflare D1 göçüyle birlikte silinen `stock-alerts` modülünün arta kalan ölü kodları tamamen temizlenmiştir.
4. ✅ **UI ve Admin TypeScript Hataları:**
   - `account-nav.tsx` exact rota tipi, `admin-sidebar.tsx` version parametresi ve `textarea.tsx` React 19 `ref` tipi uyumsuzlukları giderilmiştir (`npm run typecheck` 0 hata vermektedir).
5. ✅ **Ödeme ve İade Strateji Deseni (OCP):**
   - `PaymentRefundStrategyRegistry` ve `CheckoutPaymentStrategyRegistry` oluşturulmuş; sipariş iptal ve sipariş oluşturma süreçleri polimorfik hale getirilmiştir.
6. ✅ **Ürün Özelleştirme Stratejisi (OCP / `ItemCustomizationHandler`):**
   - Çekirdek `CartService`, `CheckoutPricing`, `CheckoutValidator` ve `checkout-customizations.ts` dosyalarındaki katı kodlanmış `CUSTOM_PICKLE_PRODUCT_SLUG`, `bidonWeightGram` ve turşu metinleri temizlenmiştir.
   - Genel `ItemCustomizationHandler` sözleşmesi (`src/modules/cart/customization.ts`) tanımlanmış; `CustomPickleService` bu sözleşmeyi uygulayarak çekirdek sepetten ve ödeme servislerinden tamamen soyutlanmıştır.

---

## 6. Önceliklendirilmiş Eylem Planı Tablosu

| Seviye | Konu / Hata | İlgili Dosya(lar) | Tahmini Efor |
| :--- | :--- | :--- | :--- |
| 🔴 **P1 - Acil** | Havale/vadeli sipariş e-postalarının listener bağlantısı | `src/modules/checkout/container.ts` | 15 dk |
| 🔴 **P1 - Acil** | Havale/vadeli sipariş iade onayında PayTR çağrısının engellenmesi | `src/modules/returns/return.service.ts`, `container.ts` | 1-2 saat |
| 🔴 **P1 - Acil** | Vadeli sipariş kredi limiti yarış durumu (race condition) koruması | `src/modules/orders/order.repository.ts` | 2 saat |
| 🟠 **P2** | `DevPaymentProvider.signPayload` sızıntısının izole edilmesi | `src/integrations/payment/`, `odeme/actions.ts` | 1 saat |
| 🟠 **P2** | Terk edilmiş sahipsiz sepetlerin süpürülmesi (cron) | `src/app/api/cron/purge-abandoned-carts/` | 1 saat |
| 🟠 **P2** | Global `siteConfig` doğrudan import bağımlılıklarının temizlenmesi | `src/modules/checkout/shipping.ts` | 1 saat |
| 🟢 **P3** | Malzeme bazında stok ve mevsimsellik takibi | `src/db/schema.ts`, `custom-pickle/` | 3-4 saat |
| 🟢 **P3** | Müşteri değerlendirme ve yorum motoru (Review Engine) | Yeni `Review` tablosu & modülü | 1-2 gün |
| 🟢 **P3** | Canlı kargo API entegrasyonu (Yurtiçi/Aras/MNG) | `src/integrations/shipping/` | 2-3 gün |
