# Clean Code ve SOLID Prensipleri Mimari İnceleme Raporu

> **Tarih:** 2026-10-29  
> **Kapsam:** `src/modules`, `src/integrations`, `src/shared`, `src/app`, `src/components`  
> **Amaç:** E-ticaret platformu ve şablon çekirdeğinin Clean Code ve SOLID tasarım ilkeleri açısından değerlendirilmesi, mimari borçların ve iyileştirme adımlarının belgelenmesi.

---

## 1. Yönetici Özeti

Proje genel olarak TypeScript `strict` modu, Zod ile güçlü tip doğrulama, merkezi hata hiyerarşisi (`AppError`), katmanlı mimari iskeleti (Repository -> Service -> Controller/Action), `decimal.js` ile hassas parasal işlemler ve test altyapısı (Vitest & Playwright) bakımından olgun bir temel üzerine kurulmuştur.

Bununla birlikte, projenin büyümesi ve "Kendi Turşunu Yap" gibi özel iş alanlarının eklenmesiyle birlikte:
- **Katman sorumlulukları birbirine karışmış** (Repository katmanında kredi limiti ve iş kuralı işletilmesi),
- **Bağımlılık yönü tersine dönmüş** (Çekirdek domain servislerinin admin alt servislerine bağımlı olması),
- **Genişletilebilirlik zayıflamış** (Şablon çekirdeğine spesifik ürün kurallarının hardcode edilmesi),
- **Devasa UI bileşenleri ("God Components")** oluşmuştur.

Aşağıda bu bulgular SOLID ve Clean Code başlıkları altında detaylandırılmıştır.

---

## 2. SOLID Prensipleri İncelemesi

### 2.1 S — Single Responsibility Principle (Tek Sorumluluk İlkesi)

> Bir sınıfın, modülün veya fonksiyonun değişmesi için yalnızca tek bir nedeni olmalıdır.

#### 1. Repository Katmanına Sızan İş (Domain) Kuralları — [✅ ÇÖZÜLDÜ]
- **Dosya:** `src/modules/orders/order.repository.ts`
- **Uygulanan Refactoring:** Kredi limiti hesaplama ve kural işletimi veritabanı repository katmanından izole edilerek bağımsız bir Domain Policy'ye dönüştürüldü:
  - `src/modules/b2b/credit-limit.policy.ts`: Bayi kredi limitinin doluluk oranını, kalan limiti ve sipariş talebinin onaylanabilirliğini değerlendiren saf `CreditLimitPolicy` oluşturuldu. Yetersizlik durumunda kurala uygun `ConflictError` fırlatır.
  - `src/modules/b2b/credit-limit.policy.test.ts`: Kredi limit kuralları %100 birim test kapsamına alındı.
  - `PrismaOrderRepository`: Artık sadece veri tabanı toplamını alıp kararı `CreditLimitPolicy.assertAllowed`'a delege etmektedir.

#### 2. "God Service" Problemi (`CheckoutService`) — [✅ ÇÖZÜLDÜ]
- **Dosya:** `src/modules/checkout/checkout.service.ts`
- **Uygulanan Refactoring:** `CheckoutService` monolitik yapısından arındırılarak Tek Sorumluluk İlkesi (SRP) ve Facade tasarım kalıbı doğrultusunda odaklı alt servislere bölünmüştür:
  - `CheckoutValidator` (`checkout-validator.ts`): Misafir izinleri, bayi onay/limitleri, sepet satırlarının ve stok durumlarının doğrulanması, kupon kullanım kuralları.
  - `CheckoutPricingEngine` (`checkout-pricing.ts`): Satır fiyatlandırması, kampanya ve kupon kurallarının uygulanması, kargo hesaplaması ve vergi/toplam özetleri.
  - `PaymentOptionsResolver` (`payment-options-resolver.ts`): Müşteri türü ve kredi limitine göre seçilebilir ödeme yöntemlerinin tespiti.
  - `OrderPlacementService` (`order-placement.ts`): Sipariş veri anlık görüntüsünün oluşturulması, vadeli/bekleyen sipariş kaydı ve olay yayınlama.
  - `CheckoutService` (`checkout.service.ts`): 600 satırlık karmaşık bir servis yerine, bu 4 alt servisi koordine eden ~130 satırlık temiz bir Facade/Orkestratör haline getirilmiştir. Mevcut API ve test sözleşmeleri %100 korunmuştur.

#### 3. Devasa Arayüz Bileşenleri ("God Components") — [✅ ÇÖZÜLDÜ]
- **Dosyalar:**
  - `src/app/(admin)/admin/urunler/product-form.tsx`
  - `src/app/(storefront)/kendi-tursunu-yap/builder.tsx`
  - `src/components/product/product-view.tsx`
  - `src/app/(storefront)/odeme/checkout-form.tsx`
- **Uygulanan Refactoring:** 500-800 satırlık monolitik bileşenler Tek Sorumluluk İlkesi (SRP) uyarınca durum (state/hook) ve görsel sunum parçalarına bölündü:
  - `product-form.tsx`: Form yönetimi ve validasyon `useProductForm` hook'una; form parçaları `product-basic-info.tsx`, `product-variants-section.tsx`, `product-media-section.tsx`, `product-attributes-section.tsx`, `product-seo-section.tsx` ve `product-form-field.tsx` bileşenlerine ayrıldı.
  - `builder.tsx`: Durum ve sepete ekleme mantığı `useCustomPickleBuilder` hook'una; arayüz adımları `builder-scene.tsx`, `builder-steps.tsx` ve `builder-summary.tsx` bileşenlerine ayrıldı.
  - `product-view.tsx`: Varyant seçimi ve satın alma durumu `useProductView` hook'una; görsel bölümler `product-gallery.tsx`, `product-options.tsx`, `product-purchase-actions.tsx` ve `product-accordions.tsx` bileşenlerine ayrıldı.
  - `checkout-form.tsx`: Adres, ödeme yöntemi seçimi ve sözleşme onay blokları `address-fields.tsx`, `payment-method-selector.tsx` ve `legal-agreements-section.tsx` bileşenlerine ayrıldı.

#### 4. Monolitik Bildirim Sorumluluğu (`NotificationService`) — [✅ ÇÖZÜLDÜ]
- **Dosyalar:**
  - `src/modules/notifications/notification-dispatcher.ts`
  - `src/modules/notifications/handlers/*`
  - `src/modules/notifications/notification.service.ts`
- **Uygulanan Refactoring:**
  - E-posta kuyruklama altyapısı `NotificationDispatcher` arayüzü ve `QueueNotificationDispatcher` ile genel bir dağıtıcıya dönüştürüldü.
  - Domain bildirim mantıkları odaklı handler sınıflarına ayrıldı: `OrderNotificationHandler`, `AccountNotificationHandler`, `DealerNotificationHandler`, `ReturnNotificationHandler` ve `StockAlertNotificationHandler`.
  - `NotificationService` tüm bu alt işleyicileri koordine eden temiz bir Facade olarak yeniden düzenlendi. Unit testleri (`notification-dispatcher.test.ts` ve `handlers.test.ts`) eklendi.

---

### 2.2 O — Open/Closed Principle (Açık/Kapalı İlkesi)

> Yazılım varlıkları geliştirmeye açık, ancak değiştirmeye kapalı olmalıdır.

#### 1. Şablona Özgü Olmayan Ürün Mantığının Çekirdeğe Katı Kodlanması
- **Dosyalar:**
  - `src/modules/cart/cart.service.ts` (Satır 88-93)
  - `src/modules/checkout/checkout.service.ts` (Satır 38-40, 403)
- **Sorun:** Proje Türkiye pazarı için kopyalanabilir genel bir e-ticaret şablonu olarak tasarlanmıştır. Ancak:
  - `cart.service.ts` içinde doğrudan şu kod yer almaktadır:
    ```typescript
    if (stock.productSlug === CUSTOM_PICKLE_PRODUCT_SLUG) {
      throw new ValidationError('Bu bidon "Kendi Turşunu Yap" sayfasından malzeme seçilerek oluşturulur');
    }
    ```
  - `checkout.service.ts` dosyasında turşuya özel `bidonWeightGram` doğrudan import edilerek çağrılmaktadır.
- **Etki:** Yarın bu şablonla giyim, takı veya elektronik satan bir mağaza kurulduğunda ya da yeni bir özelleştirilebilir ürün (hediye kutusu, baskılı kupa vb.) eklendiğinde çekirdek `CartService` ve `CheckoutService` dosyaları değiştirilmek zorundadır.
- **Çözüm:** `ProductCustomizationProvider` veya `ItemCustomizationHandler` adında genel bir arayüz tanımlanmalı; `custom-pickle` modülü bu arayüzü uygulayan bir eklenti (plugin) haline getirilmelidir.

#### 2. Ödeme Yöntemlerinde Sert Kodlanmış (Hardcoded) Dallanmalar
- **Dosyalar:**
  - `src/modules/orders/order.service.ts` (Satır 96-108)
  - `src/modules/checkout/checkout.service.ts` (Satır 230-250)
- **Sorun:** İptal, iade ve sipariş onay süreçlerinde `payment.method === "CARD" ? ... : ...` kontrolleri bulunmaktadır. Havale/EFT ve vadeli ödemelerin her biri için `if/else` blokları yazılmıştır.
- **Çözüm:** Ödeme yöntemleri Strategy Pattern ile yönetilmelidir. Her ödeme yöntemi kendi `PaymentMethodStrategy` sınıfını uygulamalı (örn: `CardPaymentStrategy`, `BankTransferPaymentStrategy`, `DeferredPaymentStrategy`); sipariş oluşturma, rezervasyon süresi ve iade akışını kendisi yönetmelidir.

---

### 2.3 L — Liskov Substitution Principle (Liskov Yerine Geçme İlkesi)

> Alt sınıflar veya arayüzü uygulayan yapılar, arayüzün tüketicisi açısından beklenmedik davranış sergilemeden birbirinin yerine geçebilmelidir.

#### 1. `DevPaymentProvider` Sızıntısı ve Arayüz Bütünlüğünün Bozulması
- **Dosyalar:**
  - `src/integrations/payment/dev/dev-payment-provider.ts` (Satır 37-43)
  - `src/modules/orders/container.ts` (Satır 52-55)
  - `src/app/(storefront)/odeme/actions.ts` (Satır 119-138)
- **Sorun:** `DevPaymentProvider`, `PaymentProvider` arayüzünü uyguladığını beyan eder. Fakat arayüzde bulunmayan `signPayload` metoduna sahiptir. `container.ts` içinde:
  ```typescript
  export function getDevPaymentProvider(): DevPaymentProvider | null {
    const provider = getPaymentProvider();
    return provider instanceof DevPaymentProvider ? provider : null;
  }
  ```
  yazılarak nesne concrete tipine geri dönüştürülmekte ve `odeme/actions.ts` doğrudan bu concrete class'a bağımlı çalışmaktadır.
- **Etki:** Polimorfizm kırılmıştır; ödeme sağlayıcısı arayüz arkasına tam gizlenememiş, test sağlayıcısının özel bir metodu sunucu eylemlerine sızmıştır.
- **Çözüm:** Geliştirme ortamı imza simülasyonu ya bir simülasyon route'una/servisine izole edilmeli ya da genel test arayüzüne dahil edilmelidir.

---

### 2.4 I — Interface Segregation Principle (Arayüz Ayrımı İlkesi)

> İstemciler (çağıran kodlar), kullanmadıkları metotlara bağımlı olmaya zorlanmamalıdır.

#### 1. Şişkin `OrderRepository` ve Mecburi `Pick<...>` Kullanımı (Fat Interface) — [✅ ÇÖZÜLDÜ]
- **Dosyalar:**
  - `src/modules/orders/order.repository.ts`
  - `src/modules/admin/orders/admin-order.service.ts`
  - `src/modules/checkout/checkout-validator.ts`
  - `src/modules/checkout/order-placement.ts`
  - `src/modules/checkout/checkout.types.ts`
  - `src/modules/notifications/notification.service.ts`
  - `src/modules/notifications/handlers/order-notification.handler.ts`
  - `src/modules/orders/payment.service.ts`
- **Uygulanan Refactoring:** Monolitik ve 13'ten fazla metot içeren `OrderRepository` Arayüz Ayrımı İlkesi (ISP) uyarınca amaca yönelik bağımsız alt sözleşmelere ayrıldı:
  - `OrderLookupRepository`: Yalnızca `findById` metodu. `NotificationService` ve bildirim handler'ları sadece buna bağlanır.
  - `OrderQueryRepository`: Sipariş okuma ve sorgulama (`findByOrderNumber`, `findByLookupToken`, `listByUser`, `getPaymentForOrder`).
  - `OrderCreationRepository`: Sipariş oluşturma (`createPendingOrder`, `createDeferredOrder`). `OrderPlacementService` yalnızca buna bağlanır.
  - `OrderCommandRepository`: Sipariş yaşam döngüsü komutları (`cancelOrder`).
  - `OrderPaymentRepository`: Tahsilat ve ödeme sonuçlandırma (`applyPaymentResult`, `markDeferredPaid`). `AdminOrderService` çirkin `Pick<OrderRepository, ...>` yerine doğrudan bu arayüze bağlanır.
  - `OrderRefundRepository`: İade kaydı (`recordRefund`).
  - `OrderReservationRepository`: Zaman aşımı rezervasyon temizliği (`releaseExpired`).
  - `CouponUsageRepository`: Kupon kullanım denetimi (`countCouponUses`). `CheckoutValidator` doğrudan bu arayüze bağlanır.
  - `OrderRepository`: Tüm alt arayüzleri genişleten (`extends`) birleşik (composite) arayüz olarak tutuldu; geriye dönük uyumluluk %100 korundu.
  - Testlerdeki yapay nesneler (örneğin `checkout.service.test.ts` içindeki `FakeOrders`) kullanmadığı 10 adet sahte/boş metodu uygulamak zorunda kalmaktan kurtarıldı.

---

### 2.5 D — Dependency Inversion Principle (Bağımlılıkların Tersine Çevrilmesi)

> Yüksek seviyeli modüller, düşük seviyeli modüllere bağımlı olmamalıdır; her ikisi de soyutlamalara bağımlı olmalıdır.

#### 1. Ters Katman Bağımlılığı (`Actor` Arayüzünün Yanlış Yerde Tanımlanması)
- **Dosyalar:**
  - `src/modules/admin/orders/admin-order.service.ts` (Satır 15-18)
  - `src/modules/b2b/dealer.service.ts` (Satır 4)
  - `src/modules/content/content.service.ts` (Satır 4)
  - `src/modules/returns/return.service.ts` (Satır 4)
  - `src/modules/custom-pickle/custom-pickle.service.ts` (Satır 9)
  - `src/modules/erp/erp-sync.service.ts` (Satır 6)
- **Sorun:** Denetim kaydı (audit) tutabilmek için gerekli olan temel `{ userId: string; ip?: string | null }` şeklindeki `Actor` arayüzü, admin modülünün içindeki `admin-order.service.ts` dosyasında export edilmiştir.
- **Etki:** B2B, İçerik Yönetimi, İade Takibi ve Turşu gibi bağımsız domain servisleri, admin paneli sipariş servisine bağımlı hale gelmiştir. Clean Architecture bağımlılık kuralı (Dependency Rule) açıkça ihlal edilmiştir.
- **Çözüm:** `Actor` tanımı `src/shared/audit` veya `src/shared/auth` klasörüne taşınmalıdır.

#### 2. "God Container" (`src/modules/orders/container.ts`) — [✅ ÇÖZÜLDÜ]
- **Dosya:** `src/modules/orders/container.ts`
- **Uygulanan Refactoring:** Sipariş modülünün container'ı diğer alanlardan temizlenerek her alan kendi bağımsız container yapısına kavuşturulmuştur:
  - `src/integrations/payment/container.ts`: `getPaymentProvider` ve `getDevPaymentProvider` buraya taşındı.
  - `src/modules/notifications/container.ts`: `getNotificationService` ve domain olay abonelikleri buraya taşındı.
  - `src/modules/checkout/container.ts`: `getCheckoutService` buraya taşındı.
  - `src/modules/orders/container.ts`: Artık yalnızca sipariş deposu ve servislerine odaklandı (`orderRepository`, `getOrderService`, `getPaymentService`).
  - `account`, `b2b`, `stock-alerts` ve `returns` modüllerinin gereksiz yere `orders/container.ts`'a olan bağımlılıkları kesilip doğrudan ilgili `notifications/container` ve `payment/container` dosyalarına bağlandı. Geriye dönük uyumluluk için `orders/container` üzerinde re-export'lar korundu.

#### 3. Global Statik Konfigürasyona (`siteConfig`) Doğrudan Bağımlılık
- **Dosyalar:**
  - `src/modules/notifications/notification.service.ts` (Satır 37-39)
  - `src/modules/checkout/shipping.ts` (Satır 21)
- **Sorun:** Servisler yapılandırma değerlerini constructor argümanı olarak dışarıdan almak yerine, `@/config/site.config` dosyasındaki statik objeyi varsayılan parametre olarak bağlamaktadır. Bu durum izole birim testlerini zorlaştırır ve çalışma anında dinamik konfigürasyonu engeller.

---

## 3. Clean Code ve Mimari Tasarım Eksiklikleri

### 3.1 Hayalet Olaylar (Ghost Events) ve Süreçler Arası İletişim Uyumsuzluğu
- **Dosyalar:**
  - `src/modules/admin/catalog/product-admin.service.ts` (Satır 148)
  - `src/modules/admin/import/bulk-update.service.ts` (Satır 197)
  - `src/modules/erp/erp-sync.service.ts` (Satır 99)
  - `src/shared/events/event-bus.ts`
- **Sorun:**
  1. Stoğu sıfırdan artan ürünler için `stock.replenished` olayı yayınlanmaktadır. Ancak projenin canlı kodunda bu olayı dinleyen **hiçbir subscriber yoktur** (yalnızca unit testler dinlemektedir). Asıl stok bildirimleri ise worker içinde her 10 dakikada bir çalışan `stock-alerts.sweep` işiyle gönderilmektedir. Bu olay tamamen ölü koddur (dead code).
  2. `InMemoryEventBus` bellek içi çalıştığından, bağımsız bir Node sürecinde koşan `worker` (`src/worker/index.ts`), Next.js sunucu süreçlerinde fırlatılan in-memory olayları teknik olarak dinleyemez.
- **Çözüm:** Asenkron domain olayları `pg-boss` kuyruğu üzerinden dağıtılmalı veya ölü olay yayınları temizlenmelidir.

### 3.2 Olay Aboneliklerinde Zamansal Bağlaşım (Temporal Coupling)
- **Dosya:** `src/modules/orders/container.ts` (Satır 68-80)
- **Sorun:** Event dinleyicileri (`bus.subscribe("order.paid", ...)`), `getNotificationService()` fonksiyonunun ilk çağrılışı sırasında yan etki (side effect) olarak bağlanmaktadır.
- **Etki:** Eğer bir istek yaşam döngüsünde `getNotificationService()` çağrılmadan önce bir olay fırlatılırsa, dinleyiciler henüz kayıt olmadığı için olay sessizce kaybolur.
- **Çözüm:** Event bus dinleyicileri uygulama başlangıcında (initialization / bootstrap aşamasında) deterministik bir sırayla kaydedilmelidir.

### 3.3 Veritabanı Katmanında DRY İhlali (Cart vs. Checkout) — [✅ ÇÖZÜLDÜ]
- **Dosyalar:**
  - `src/modules/cart/cart.repository.ts`
  - `src/modules/checkout/checkout.repository.ts`
  - `src/modules/checkout/checkout.repository.test.ts`
- **Uygulanan Refactoring:** `cartItem` tablosunun doğrudan sorgulanması ve varyant/opsiyon eşlemesi mantığı tek elden `CartRepository` üzerinde toplandı:
  - `CartItemRecord` arayüzü ve `PrismaCartRepository.listItems` fonksiyonu; ürünün KDV oranı (`taxRate`), kategori (`categoryId`) ve hesaplanmış desi (`desi`) bilgilerini içerecek şekilde zenginleştirildi.
  - `PrismaCheckoutRepository.loadCartLines` içerisindeki yinelenen Prisma sorgusu ve kopya opsiyon sıralama/dönüştürme mantığı kaldırıldı; işlem doğrudan `CartRepository.listItems` metoduna delege edildi.
  - Böylece sepet veri bütünlüğü ve sorgu mantığı tek bir repository'de (Single Source of Truth) toplandı, DRY ihlali giderildi. Birim testi (`checkout.repository.test.ts`) yazılarak doğrulandı.

### 3.4 Server Actions'ta Hata Yakalama Tekrarları — [✅ ÇÖZÜLDÜ]
- **Dosyalar:**
  - `src/shared/action.ts` (Yeni oluşturulan merkezi sarmalayıcı)
  - `src/shared/action.test.ts` (Birim testleri)
  - `src/app/(storefront)/sepet/actions.ts`
  - `src/app/(storefront)/hesabim/actions.ts`
  - `src/app/(storefront)/siparis/[orderNumber]/actions.ts`
  - `src/app/(storefront)/siparis/[orderNumber]/return-actions.ts`
  - `src/app/(storefront)/siparis/[orderNumber]/reorder-actions.ts`
  - `src/app/(storefront)/kendi-tursunu-yap/actions.ts`
- **Uygulanan Refactoring:** Tüm vitrin eylemleri için ortak bir `runStorefrontAction` wrapper'ı geliştirildi. Bu wrapper;
  - `AppError` sınıfından türeyen bilinen domain hatalarını yakalayıp kullanıcı dostu mesaj olarak döner.
  - Beklenmeyen sistem hatalarını `reportError` ile loglayıp genel bir hata mesajı ile yanıt verir.
  - Next.js `redirect()` çağrılarını yakalayıp yutmadan yönlendirmenin çalışabilmesi için yeniden fırlatır.
  - Sayfa önbellek yenilemelerini (`revalidate`) tek elden deterministik olarak yürütür.
  - Böylece vitrin action dosyalarındaki yüzlerce satırlık kopya `try/catch/isAppError/reportError` kodları temizlenerek DRY ilkesi sağlandı.

### 3.5 Sessiz Başarısızlıklar (Silent Failures)
- **Dosyalar:**
  - `src/modules/checkout/discounts.ts` (Satır 145-160): Kampanya konfigürasyon JSON'u geçersiz olduğunda `createCampaignRule` sessizce `null` döner. Neden indirimin uygulanmadığına dair log veya uyarı üretilmez.
  - `src/modules/notifications/notification.service.ts` (Satır 44): Sipariş bulunamazsa (`if (!order) return;`) metod sessizce sonlanır. Hatalı ID ile çağrıldığında sistemde iz bırakmaz.

### 3.6 İsimlendirme ve Dil Karışıklığı
- **Sorun:** Kod tabanında Türkçe ve İngilizce iç içe geçmiştir.
  - DB Modelleri: `ProductVariant`, `CartItem`, `Order` (İngilizce)
  - Route ve Klasörler: `kendi-tursunu-yap`, `tursu-malzemeleri`, `bayi-gruplari` (Türkçe)
  - Fonksiyon ve Değişkenler: `bidonWeightGram`, `PickleIngredient`, `CustomizationPricer` (Karma)
- **Çözüm:** Kod seviyesinde standart İngilizce tercih edilmeli; Türkçe yalnızca son kullanıcı arayüzü, i18n çeviri sözlüğü ve yerel mevzuat terimleriyle (örn. VKN) sınırlı tutulmalıdır.

---

## 4. Öncelikli İyileştirme Yol Haritası

```
[Faz 1: Hızlı Düzeltmeler] ──────────► [Faz 2: Modülerlik & OCP] ──────────► [Faz 3: UI Parçalama]
• Actor tipini audit'e taşı          • Customization Strategy          • product-form.tsx parçala
• orders/container'ı ayrıştır        • Payment Method Strategy         • builder.tsx parçala
• Hayalet event'leri temizle         • OrderRepository'yi böl          • Storefront action wrapper
```

| Faz | Görev | Hedeflenen SOLID/Clean Prensibi | Durum | Tahmini Efor |
| :--- | :--- | :--- | :---: | :--- |
| **Faz 1** | `Actor` tipini `src/shared/audit` altına taşımak | DIP / Clean Architecture | ⏳ Bekliyor | Çok Düşük (30 dk) |
| **Faz 1** | `notifications/container.ts`, `checkout/container.ts` ve `payment/container.ts` oluşturup `orders/container.ts`'ı sadeleştirmek | SRP / DIP | ✅ **Tamamlandı** | Düşük (1-2 saat) |
| **Faz 1** | `NotificationService` monolitik yapısını `NotificationDispatcher` ve domain handler'lara bölmek | SRP / Facade | ✅ **Tamamlandı** | Düşük (1-2 saat) |
| **Faz 1** | `stock.replenished` ölü olayını temizlemek veya worker'a bağlamak | Clean Code / Dead Code | ⏳ Bekliyor | Düşük (1 saat) |
| **Faz 1** | Sepet ve ödeme sorgularındaki veritabanı DRY ihlalini gidermek (`CartRepository` delegasyonu) | DRY / Single Source of Truth | ✅ **Tamamlandı** | Düşük (1 saat) |
| **Faz 2** | `CheckoutService` "God Service" refactoring'i (Validator, Pricing, PaymentOptions, OrderPlacement) | SRP / Facade | ✅ **Tamamlandı** | Orta (3-4 saat) |
| **Faz 2** | `custom-pickle` bağımlılığını genel `ItemCustomizationHandler` arayüzü arkasına almak | OCP / Modülerlik | ⏳ Bekliyor | Orta (3-4 saat) |
| **Faz 2** | `OrderRepository` içindeki kredi limiti mantığını policy katmanına çekmek (`CreditLimitPolicy`) | SRP / Separation of Concerns | ✅ **Tamamlandı** | Orta (2-3 saat) |
| **Faz 2** | `OrderRepository` arayüzünü okuma, yazma ve ödeme olarak segmente etmek | ISP | ✅ **Tamamlandı** | Orta (3 saat) |
| **Faz 3** | Devasa bileşenleri (`product-form.tsx`, `builder.tsx`, `product-view.tsx`, `checkout-form.tsx`) hook ve alt bileşenlere bölmek | SRP / Clean Code | ✅ **Tamamlandı** | Yüksek (1 gün) |
| **Faz 3** | Storefront Server Actions için standart `runStorefrontAction` wrapper yazmak | DRY / Error Handling | ✅ **Tamamlandı** | Düşük (2 saat) |
