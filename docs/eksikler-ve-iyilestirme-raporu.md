# Kaplan Turşu E-Ticaret Platformu - Kapsamlı Proje İncelemesi ve Eksikler Raporu

> **Hazırlanma Tarihi:** 29 Ekim 2026  
> **Kapsam:** Mimari, İş Akışları, Veritabanı Şeması, Vitrin/Admin Kullanıcı Deneyimi, Vergi Mevzuatı, SEO ve Güvenlik Analizi

---

## 1. Yönetici Özeti

Bu doküman, **Kaplan Turşu** projesi kapsamında geliştirilen Next.js tabanlı e-ticaret platformunun ve "Kendi Turşunu Yap" modülünün detaylı teknik incelemesini içerir.

Proje genel olarak temiz katmanlı mimariye (Service / Repository / Domain Events / Adapter), güçlü kimlik doğrulama politikalarına (Argon2, timing-attack koruması, hesap kilitlenmesi) ve güvenli dosya/girdi doğrulama mekanizmalarına sahiptir. Ancak sipariş süreçlerinde e-posta tetiklenmesi, katalog listeleme UX'i, tekrar sipariş akışı, gıda KDV mevzuatı ve mobil gezinti gibi alanlarda giderilmesi gereken kritik ve orta öncelikli eksikler tespit edilmiştir.

---

## 2. Kritik Hatalar ve Fonksiyonel Uyuşmazlıklar

### 2.1. Havale/EFT ve Vadeli Siparişlerde Bildirim E-Postalarının Gönderilmemesi
- **İlgili Dosyalar:** 
  - `src/modules/orders/container.ts` (`getCheckoutService` & `getNotificationService`)
  - `src/app/(storefront)/odeme/actions.ts` (`placeOrderAction`)
  - `src/modules/notifications/notification.service.ts` (`onOrderPlaced`)
- **Tespit:**
  Kullanıcı ödeme yöntemi olarak Havale/EFT veya Vadeli Ödeme seçtiğinde, `checkout.service.ts` içerisinde `this.deps.events?.publish("order.placed", ...)` çağrılır. Ancak siparişi oluşturan `placeOrderAction`, `getCheckoutService()` kullanır. `getCheckoutService()`, olay abonelerini (`bus.subscribe`) hafızaya kaydeden `getNotificationService()` fonksiyonunu çağırmaz.
- **Etki:**
  Next.js sunucu işleminde dinleyicisi olmayan bir olaya mesaj yayınlandığı için, havale yapan müşteriye banka hesap ve IBAN bilgilerini içeren sipariş e-postası gitmez; yöneticiye yeni sipariş bildirimi ulaşmaz.
- **Çözüm:**
  `src/modules/orders/container.ts` içerisindeki `getCheckoutService()` metoduna `getNotificationService()` çağrısı eklenmeli, böylece `order.placed` dinleyicileri her zaman hazır tutulmalıdır.

---

### 2.2. "Tüm Ürünler" Bağlantısına Tıklandığında Boş Sayfa Açılması - [TAMAMLANDI]
- **İlgili Dosyalar:**
  - `src/app/(storefront)/ara/page.tsx` (`SearchContent`)
  - `src/components/storefront/site-header.tsx`
  - `src/components/storefront/site-footer.tsx`
  - `src/components/storefront/hero-slider.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - `src/app/(storefront)/ara/page.tsx` dosyasındaki aramasız girişi engelleyen `if (!query.search)` kontrolü kaldırıldı.
  - Arama terimi girilmediğinde sayfanın tüm kataloğu (`catalogService.list`) filtre paneli, sıralama ve sayfalama ile birlikte eksiksiz getirmesi sağlandı.
  - Başlık dinamikleştirildi: Arama yapıldığında *"“[arama]” için X sonuç"*, arama yapılmadığında *"Tüm Ürünler (X ürün)"* başlığı ve kategori alt açıklaması gösterildi.
  - Metadata başlığı ve `robots` yönergeleri optimize edildi: Normal arama sonuçları `robots: { index: false, follow: true }` olarak tutulurken, aramasız genel ürün kataloğunun Google tarafından dizine eklenebilmesi (`robots: { index: true, follow: true }`) sağlandı.

---

### 2.3. Özel Turşu Siparişlerinde "Tekrar Sipariş Ver" (Reorder) Fonksiyonu - [TAMAMLANDI]
- **İlgili Dosyalar:**
  - `src/modules/orders/reorder.service.ts`
  - `src/modules/orders/reorder.service.test.ts`
  - `src/modules/orders/order.repository.ts`
  - `src/modules/orders/order.types.ts`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - `order.repository.ts` içerisindeki `toView` fonksiyonuna `customization` alanı dahil edildi.
  - `ReorderService` güncellendi; sipariş satırı incelenerek eğer `customization.kind === "custom-pickle"` ise reçete bilgileri (`ingredientIds`, `brine`, `spice`, `note`) korunarak `cart.addCustomItem` metoduyla sepete aktarılması sağlandı. Kapsamlı birim testi eklendi.

---

### 2.4. Yönetim Paneli Sipariş Ekranında Özel Turşu Reçetesinin Görünmemesi - [TAMAMLANDI]
- **İlgili Dosyalar:**
  - `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx`
  - `src/modules/orders/order.repository.ts`
  - `src/modules/orders/order.types.ts`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - `order.repository.ts` içerisindeki `toView` fonksiyonunda her satır için `customization` verisi çekildi.
  - Admin sipariş detayında, "Kendi Turşunu Yap" ürünü için yeşil rozetli özel bir reçete kartı eklendi; seçilen malzemeler, salamura formülü, acılık derecesi ve müşteri özel üretim notu imalat personeli için net şekilde listelendi.

---

### 2.5. `stock.replenished` Domain Olayının Dinleyicisiz Olması
- **İlgili Dosyalar:**
  - `src/modules/admin/catalog/product-admin.service.ts`
  - `src/modules/admin/import/bulk-update.service.ts`
  - `src/modules/erp/erp-sync.service.ts`
  - `src/worker/jobs/stock-alerts.ts`
- **Tespit:**
  Ürün düzenleme, CSV toplu stok güncelleme ve ERP stok senkronizasyonu servisleri stok arttığında `stock.replenished` olayını yayınlamaktadır. Fakat prodüksiyon kodunda bu olayı dinleyen hiçbir abone (`events.subscribe`) bulunmamaktadır.
- **Etki:**
  Stoğu tükenmiş ürüne "Gelince Haber Ver" kaydı bırakan kullanıcılara stok açıldığı an anlık bildirim gitmez; bildirimler sadece 10 dakikada bir çalışan periyodik süpürme (sweep) işine bağımlı kalır.
- **Çözüm:**
  `stock.replenished` olayı gerçekleştiğinde kuyruğa anlık bildirim işi atacak bir abone container üzerinde bağlanmalıdır.

---

## 3. "Kendi Turşunu Yap" Modülüne Özgü İyileştirmeler

### 3.1. Malzeme Bazında Stok / Tedarik Takibi Bulunmaması
- **Durum:** `PickleIngredient` modelinde yalnızca `isActive: Boolean` alanı vardır. Kilogram bazlı stok (`stockKg`), rezerve miktar veya kritik stok seviyesi bulunmamaktadır.
- **Öneri:** Malzemeler için stok takibi eklenmeli veya en azından panelden "Mevsimi Bitti / Geçici Temin Edilemiyor" durumları için otomatik pasife alma kuralı oluşturulmalıdır.

### 3.2. Malzeme Karışım Oranlarının Belirlenememesi
- **Durum:** Müşteri en fazla 8 malzeme seçebilmektedir ancak bidonun içindeki ağırlık/hacim oranları (örneğin: %60 Kornişon, %30 Havuç, %10 Sarımsak) seçilememektedir.
- **Öneri:** İleri aşamada her malzeme için bir yüzde/kademeli kaydırıcı (slider) veya eşit paylaştırma mekanizması eklenebilir.

### 3.3. Salamura ve Acılık Seçeneklerinin Veritabanında ve Panelde Dinamik Yönetilmesi - [TAMAMLANDI]
- **İlgili Dosyalar:**
  - `src/modules/custom-pickle/custom-pickle.types.ts`
  - `src/modules/custom-pickle/custom-pickle.schema.ts`
  - `src/modules/custom-pickle/custom-pickle.repository.ts`
  - `src/modules/custom-pickle/custom-pickle.service.ts`
  - `src/modules/custom-pickle/custom-pickle.service.test.ts`
  - `src/app/(admin)/admin/tursu-malzemeleri/pickle-options-manager.tsx`
  - `src/app/(admin)/admin/tursu-malzemeleri/ingredient-manager.tsx`
  - `src/app/(admin)/admin/tursu-malzemeleri/actions.ts`
  - `src/app/(storefront)/kendi-tursunu-yap/builder-steps.tsx`
  - `src/app/(storefront)/kendi-tursunu-yap/bidon.tsx`
  - `src/app/(storefront)/kendi-tursunu-yap/builder-scene.tsx`
  - `src/app/(storefront)/kendi-tursunu-yap/builder-summary.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - `PickleBrineOption` (anahtar, etiket, açıklama, bidon sıvı rengi, fermantasyon kabarcığı, aktiflik, sıralama) ve `PickleSpiceOption` (anahtar, etiket, açıklama, biber ikonu adedi, kızarıklık geçirgenliği, aktiflik, sıralama) veri modelleri oluşturuldu.
  - Veritabanında `Setting` modeli üzerinden JSON konfigürasyon (`custom_pickle_options`) altyapısı kuruldu; dinamik kayıt bulunmadığında güvenli varsayılanlara (Sirkeli, Doğal fermente, Elma sirkeli vb.) düşen fallback sağlandı.
  - Yönetim paneli `/admin/tursu-malzemeleri` sayfasına sekmeli yapı entegre edildi:
    - **🧪 Salamura Tarifleri:** Yeni salamura tarifi tanımlama, açıklama girme, bidon sıvı rengini renk paletinden seçme, doğal fermantasyon kabarcığını açıp kapama, sıralama ve anında pasife alma/silme.
    - **🌶️ Acılık Seviyeleri:** Yeni acılık derecesi ekleme, biber sayısı (0-5) ve bidon kızarıklık tonu belirleme, sıralama ve düzenleme.
  - Storefront yapıcı ekranı (`/kendi-tursunu-yap`), SVG bidon animasyonu ve sepet özeti dinamik salamura/acılık verilerini okuyacak şekilde uyarlandı.
  - Kapsamlı servis ve vitest birim testleri yazılarak doğrulandı.

---

## 4. Vergi, Fatura ve Yasal Mevzuat Eksikleri

### 4.1. Gıda Ürünlerinde Hatalı KDV Oranı (%20 Default) - [TAMAMLANDI]
- **İlgili Dosyalar:** `prisma/schema.prisma` (`Product.taxRate`), `src/app/(admin)/admin/urunler/product-form.tsx`, `src/modules/admin/import/product-import.service.ts`, `prisma/seed.ts`
- **Durum:** ✅ Tamamlandı.
- **Yasal Durum:** 6502 ve Katma Değer Vergisi Kanunu Cumhurbaşkanlığı Kararı No: 5189 uyarınca; geleneksel ev turşusu, sebze konservesi ve sirke gibi temel gıda maddelerinde KDV oranı **%1**, şalgam/içecek grubu ürünlerde **%10**, kargo taşıma hizmetinde ise genel oran olan **%20**'dir.
- **Yapılan İyileştirme:**
  - `prisma/schema.prisma` dosyasında `Product.taxRate` varsayılan değeri `%20`'den `%1`'e çekildi.
  - Admin ürün ekleme formunda (`product-form.tsx`) varsayılan KDV `%1` olarak güncellendi ve yöneticiler için yasal oranları açıklayan bilgilendirici kılavuz metin eklendi.
  - Toplu ürün içe aktarma servisinde (`product-import.service.ts`) KDV belirtilmediğinde varsayılan oran `1` olarak belirlendi.
  - Demo tohumlama verilerinde (`seed.ts`) temel turşular ve özel turşu için `%1`, şalgam/içecek ürünleri için `%10` KDV oranı atandı. Kargo hizmet KDV'si (%20) ile ürün KDV'si ayrıştırıldı.

### 4.2. Bireysel Faturada TCKN Bilgisi ve Özel Reçete Gösterimi - [TAMAMLANDI]
- **İlgili Dosyalar:**
  - `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx` (`AddressBlock` & Ürün listesi)
  - `src/modules/orders/order.repository.ts`
  - `src/modules/orders/order.types.ts`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - `AddressBlock` bileşeni güncellendi; bireysel fatura kesilen siparişlerde müşterinin beyan ettiği 11 haneli TCKN (`nationalId`) muhasebenin e-arşiv fatura düzenleyebilmesi için sipariş detayında gösterildi.
  - Sipariş detayındaki ürün listesinde "Kendi Turşunu Yap" bidonlarının reçete dökümü (seçilen sebze ve baharatlar, salamura türü, acılık derecesi ve müşteri özel notu) net bir reçete kartı olarak yöneticilere sunuldu.

### 4.3. Müşteri Sipariş Takibinde Fatura Adresi ve Özel Reçete Gösterimi - [TAMAMLANDI]
- **İlgili Dosya:** `src/app/(storefront)/siparis/[orderNumber]/page.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - Müşteri sipariş sorgulama/takip ekranına hem Teslimat Adresi hem de Fatura Adresi yan yana kartlar olarak yerleştirildi.
  - Fatura kartında Bireysel / Kurumsal fatura türü rozeti, kurumsal müşteriler için Şirket Ünvanı, VKN ve Vergi Dairesi, bireysel müşteriler için TCKN bilgisi net şekilde listelendi.
  - Müşteri ürün listesinde "Kendi Turşunu Yap" ürünü varsa, müşterinin hazırladığı özel reçetenin (malzemeler, salamura formülü, acılık derecesi ve not) sipariş detayında görüntülenmesi sağlandı.

---

## 5. Kullanıcı Deneyimi (UX), Arayüz ve Mobil Eksikleri

### 5.1. Mobilde Açılır Gezinti Menüsü (Hamburger Drawer) Eksikliği - [TAMAMLANDI]
- **İlgili Dosyalar:** `src/components/storefront/mobile-nav.tsx`, `src/components/storefront/site-header.tsx` & `src/components/storefront/icons.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:** `MobileNav` çekmece (drawer) bileşeni geliştirildi. Dar ekranlarda (mobil) logo soluna erişilebilir bir hamburger menü butonu eklendi. Menü açıldığında;
  - Soldan yumuşak bir animasyonla kayan çekmece ve arka plan karartması (backdrop),
  - Öne çıkan *"Kendi Turşunu Yap"* özel üretim bağlantısı,
  - Tüm kategoriler ve *"Tüm Ürünler"* navigasyonu,
  - *"Hesabım"*, *"Sipariş Sorgulama"*, *"Favorilerim"* ve *"Bayi Başvurusu"* hızlı erişimleri,
  - Müşteri desteği telefon/e-posta ve ücretsiz kargo eşiği bilgisi,
  - `Escape` tuşu ile kapanma, rota değiştiğinde otomatik kapanma ve arka plan kaydırma kilidi (scroll-lock) entegre edildi.

### 5.2. Ürün Kartlarında Sahte Puanlama ve Hacim Algoritması - [TAMAMLANDI]
- **İlgili Dosya:** `src/components/storefront/product-card.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:**
  - Slug karmasından yapay puan ve yorum sayısı üreten `getProductRating` fonksiyonu tamamen kaldırıldı.
  - Slug anahtar kelimelerinden sabit "720 ml Cam Kavanoz" veya "1 L Cam Şişe" tahmin eden kırılgan `getProductSizeHint` fonksiyonu kaldırıldı; yerine varsa gerçek `product.brandName` veya temiz ambalaj etiketi yerleştirildi.
  - Yıldız ve puan alanı, yalnızca üründe doğrulanmış gerçek bir `product.rating` verisi (`count > 0`) olduğunda gösterilecek şekilde yapılandırıldı; yorum bulunmayan ürünlerde dürüst ve şık bir mikro bilgi (`"%100 Doğal fermantasyon"` veya `"Farklı boy seçenekleri"`) gösterilmesi sağlandı.

### 5.3. Müşteri Değerlendirme / Yorum Sistemi (Review Engine) Eksikliği
- **Durum:** Müşterilerin sipariş tamamlandıktan sonra ürüne fotoğraf, yıldız puanı ve yorum bırakabileceği interaktif bir altyapı yoktur. Anasayfadaki yorumlar statik metin olarak kodlanmıştır.
- **Öneri:** `Review` modeli, admin onay mekanizması ve ürün detayında "Müşteri Yorumları" sekmesi geliştirilmelidir.

### 5.4. İletişim Bilgilerinde Dummy Veri Bulunması - [TAMAMLANDI]
- **İlgili Dosyalar:** `src/modules/settings/`, `src/app/(admin)/admin/ayarlar/`, `src/components/storefront/site-header.tsx`, `src/components/storefront/site-footer.tsx`, `src/app/(storefront)/page.tsx`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:** İletişim bilgileri statik koddan/JSON dosyasından kurtarılarak yönetim panelinden dinamik yönetilebilir hale getirildi:
  - Admin paneline `/admin/ayarlar` rotasında "Site & İletişim Ayarları" sayfası eklendi.
  - Telefon numarası, WhatsApp destek hattı, e-posta adresi, fiziksel mağaza/fabrika adresi ve çalışma saatleri alanları form üzerinden anlık önizleme eşliğinde güncellenebilir yapıldı.
  - Güncellenen veriler PostgreSQL `Setting` tablosunda saklanır ve `next/cache` etiketleri (`contact_settings`) ile verimli şekilde önbelleğe alınır.
  - Header mobil menüsü, footer iletişim alanı ve anasayfa Schema.org Organization JSON-LD işaretlemeleri bu dinamik ayarlara bağlandı.

---

## 6. SEO, Meta ve Teknik Altyapı İyileştirmeleri

### 6.1. Root Layout İçerisinde `metadataBase` Tanımsızlığı - [TAMAMLANDI]
- **İlgili Dosya:** `src/app/layout.tsx` (`RootLayout.metadata`)
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:** `metadataBase: new URL(getSiteUrl())` satırı eklenerek sosyal medya OpenGraph paylaşımları ve canonical URL'ler için alan adı kökü tanımlandı.

### 6.2. Sitemap Dosyasında `/kendi-tursunu-yap` ve `/ara` Yapılandırması - [TAMAMLANDI]
- **İlgili Dosyalar:** `src/app/sitemap.ts`, `src/app/robots.ts`
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:** Sitenin öne çıkan `/kendi-tursunu-yap` sayfası sitemap'e doğrudan statik öncelikli rota olarak eklendi, ürün listesinden yönlendirmeli slug filtrelendi. Tüm ürünler kataloğu (`/ara`) sitemap'e dahil edildi; `robots.txt` üzerinde ise arama sorguları hariç tutularak (`/ara?*`) dizine ekleme hijyeni sağlandı.

### 6.3. Playwright E2E Testinde Başlık Metni Uyuşmazlığı - [TAMAMLANDI]
- **İlgili Dosya:** `e2e/storefront.spec.ts` (satır 8)
- **Durum:** ✅ Tamamlandı.
- **Yapılan İyileştirme:** Test kuralı regex formatına (`name: /Kategoriler/i`) çevrildi.

### 6.4. Kargo Entegrasyonu Sınırları
- **Durum:** Kargo takip numarası manuel girilmekte ve link şablonu üretilmektedir.
- **Öneri:** Yurtiçi Kargo, Aras Kargo veya MNG Kargo API'leri ile entegrasyon kurularak kargo fişi oluşturma, barkod basma ve teslim edildi bilgisini webhook ile otomatik çekme altyapısı hazırlanmalıdır.

---

## 7. Önceliklendirilmiş Eylem Planı Tablosu

| Seviye | Konu | İlgili Dosya(lar) | Efor |
| :--- | :--- | :--- | :--- |
| ✅ **Tamamlandı** | `/ara` sayfasının aramasız girişte tüm kataloğu listelemesi | `src/app/(storefront)/ara/page.tsx` | Tamamlandı |
| 🔴 **P1 - Acil** | Havale/vadeli sipariş bildirim e-postalarının listener bağlantısı | `src/modules/orders/container.ts` | Düşük |
| ✅ **Tamamlandı** | Özel turşu siparişlerinde "Tekrar Sipariş Ver" fonksiyonunun düzeltilmesi | `src/modules/orders/reorder.service.ts` | Tamamlandı |
| ✅ **Tamamlandı** | Admin sipariş detayında turşu reçetesi ve TCKN gösterimi | `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx` | Tamamlandı |
| ✅ **Tamamlandı** | Müşteri sipariş takibinde fatura adresi ve özel reçete gösterimi | `src/app/(storefront)/siparis/[orderNumber]/page.tsx` | Tamamlandı |
| ✅ **Tamamlandı** | Salamura ve acılık seçeneklerinin panelde dinamik yönetilmesi | `src/modules/custom-pickle/`, `admin/tursu-malzemeleri/` | Tamamlandı |
| ✅ **Tamamlandı** | Gıda ürünleri için KDV varsayılanının %1 olarak düzenlenmesi | `prisma/schema.prisma`, `product-form.tsx`, `seed.ts` | Tamamlandı |
| ✅ **Tamamlandı** | Mobil cihazlar için açılır hamburger menü bileşeni (`MobileNav`) | `src/components/storefront/mobile-nav.tsx` | Tamamlandı |
| ✅ **Tamamlandı** | Sitemap ve `metadataBase` SEO yapılandırmaları | `src/app/sitemap.ts`, `src/app/layout.tsx` | Tamamlandı |
| ✅ **Tamamlandı** | Ürün kartlarındaki sahte puanların temizlenmesi ve gerçekçi etiketleme | `src/components/storefront/product-card.tsx` | Tamamlandı |
| ✅ **Tamamlandı** | Site & iletişim bilgilerinin admin panelinden dinamik yönetimi | `src/modules/settings/`, `admin/ayarlar/` | Tamamlandı |
| 🟢 **P3 - Geliştirme** | Canlı kargo API entegrasyonu (Yurtiçi/Aras/MNG) | `src/integrations/shipping/` | Yüksek |
