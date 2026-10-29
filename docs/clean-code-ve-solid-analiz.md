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

#### 1. Repository Katmanına Sızan İş (Domain) Kuralları
- **Dosya:** `src/modules/orders/order.repository.ts` (Satır 235-280)
- **Sorun:** Repository'nin tek sorumluluğu veri kalıcılığı (persistence - veritabanı CRUD işlemleri) olmalıdır. Ancak `PrismaOrderRepository.createDeferredOrder` fonksiyonu içerisinde:
  - Bayinin kredi limitinin toplanması ve karşılaştırılması (`used.plus(requested).gt(limit)`),
  - Domain hata mesajı üretilerek fırlatılması (`ConflictError("Kredi limitiniz yetersiz...")`),
  - Stok rezervasyonu yerine doğrudan düşüm kararı verilmesi doğrudan repository içine yazılmıştır.
- **Etki:** Veritabanı sorgu optimizasyonu yapmak isteyen bir geliştirici iş kurallarını bozabilir veya tersine kredi limiti kuralı değiştiğinde repository sınıfı değişmek zorunda kalır.
- **Çözüm:** Kredi limiti doğrulama ve stok düşüm mantığı `CheckoutService` veya özel bir `CreditLimitPolicy` / domain servisi katmanında işletilmeli; repository yalnızca verilen komutu transaction içinde icra etmelidir.

#### 2. "God Service" Problemi (`CheckoutService`)
- **Dosya:** `src/modules/checkout/checkout.service.ts` (600+ satır, 10 bağımlılık)
- **Sorun:** `CheckoutService` tek başına şu sorumlulukların hepsini üstlenmiştir:
  1. Sepet satırlarının yüklenmesi ve geçerlilik doğrulaması,
  2. B2B bayi onay ve minimum sepet tutarı kontrolleri,
  3. Ödeme yöntemi uygunluk değerlendirmesi (`assertPaymentMethod`),
  4. "Kendi turşunu yap" özelleştirme fiyatlandırması (`quoteCustomizations`),
  5. Kupon ve kampanya kurallarının uygulanması (`compute`),
  6. Kargo ücreti hesaplaması,
  7. Sipariş nesnesinin oluşturulması ve kaydedilmesi,
  8. Olay (event) yayınlama.
- **Etki:** Servis aşırı kırılgan hale gelmiş, birim testleri zorlaşmış (`checkout.service.test.ts` 540 satır) ve bakım maliyeti artmıştır.
- **Çözüm:** Sorumluluklar küçük servislere ayrılmalıdır:
  - `CheckoutPricingService`: Fiyat, indirim, kargo ve özelleştirme hesaplamaları.
  - `CheckoutValidationService`: Sepet geçerliliği, stok ve bayi limit doğrulamaları.
  - `OrderPlacementService`: Nihai sipariş oluşturma ve olay tetikleme.

#### 3. Devasa Arayüz Bileşenleri ("God Components")
- **Dosyalar:**
  - `src/app/(admin)/admin/urunler/product-form.tsx` (~800 satır)
  - `src/app/(storefront)/kendi-tursunu-yap/builder.tsx` (~630 satır)
  - `src/components/product/product-view.tsx` (~520 satır)
  - `src/app/(storefront)/odeme/checkout-form.tsx` (~465 satır)
- **Sorun:** Bileşenler form durum yönetimini (state), sunucu eylemlerini (actions), istemci tarafı validasyonları, görsel yükleme mantığını, varyant kombinasyon matrislerini ve görsel sunum kodlarını tek bir dosyada birleştirmektedir.
- **Çözüm:** Durum ve hesaplama mantığı Custom Hook'lara (`useProductForm`, `useVariantMatrix`, `useCustomPickleBuilder`) taşınmalı; görsel kısımlar bağımsız alt bileşenlere ayrıştırılmalıdır.

#### 4. Monolitik Bildirim Sorumluluğu (`NotificationService`)
- **Dosya:** `src/modules/notifications/notification.service.ts` (165 satır)
- **Sorun:** Sipariş bildirimleri, iade kararları, bayi başvuru/onay süreçleri, şifre sıfırlama, e-posta doğrulama ve stok bildirimleri tek bir servis üzerinde toplanmıştır. Servis aynı zamanda `OrderRepository`'ye doğrudan bağımlıdır.
- **Çözüm:** Bildirim servisi genel bir `NotificationDispatcher` olmalı; e-posta şablonları ve domain tetikleyicileri ilgili modüllerin kendi listener/handler'larında tutulmalıdır.

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

#### 1. Şişkin `OrderRepository` ve Mecburi `Pick<...>` Kullanımı (Fat Interface)
- **Dosyalar:**
  - `src/modules/orders/order.repository.ts` (Satır 29-68)
  - `src/modules/admin/orders/admin-order.service.ts` (Satır 40-43)
- **Sorun:** `OrderRepository` arayüzü 12'den fazla farklı metot barındırmaktadır:
  - Sipariş oluşturma (`createPendingOrder`, `createDeferredOrder`),
  - Sorgulama (`findById`, `findByOrderNumber`, `listByUser`),
  - Kupon kullanımı sayma (`countCouponUses`),
  - Rezervasyon serbest bırakma (`releaseExpired`),
  - İade kaydı (`recordRefund`),
  - Ödeme sonuçlandırma (`applyPaymentResult`).
- Bu arayüzün çok şişkin olması sebebiyle, `AdminOrderService` gibi tüketiciler arayüzü doğrudan almak yerine TypeScript'in `Pick` utility tipini kullanmak zorunda kalmıştır:
  ```typescript
  private readonly payments: Pick<OrderRepository, "applyPaymentResult" | "markDeferredPaid">
  ```
- **Çözüm:** Arayüz amaca yönelik küçük sözleşmelere bölünmelidir:
  - `OrderQueryRepository` (Okuma işlemleri)
  - `OrderCommandRepository` (Oluşturma ve iptal)
  - `OrderPaymentRepository` (Ödeme ve iade durumları)
  - `CouponUsageRepository` (Kupon sayaçları)

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

#### 2. "God Container" (`src/modules/orders/container.ts`)
- **Dosya:** `src/modules/orders/container.ts`
- **Sorun:** Sipariş modülünün container'ı olması gereken dosya; `NotificationService`, `CheckoutService`, `DevPaymentProvider` ve `PaytrProvider` gibi diğer modüllerin servislerini de kurup dışa aktarmaktadır.
- **Etki:** `account`, `b2b`, `stock-alerts` ve `returns` modülleri e-posta gönderebilmek için `orders/container.ts` dosyasına bağımlıdır. Bir kullanıcı şifresini sıfırlarken `orders/container` yüklenmektedir.
- **Çözüm:** Her modülün (`notifications`, `checkout`, `orders`, `payment`) kendi bağımsız container ve composition root yapısı olmalıdır.

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

### 3.3 Veritabanı Katmanında DRY İhlali (Cart vs. Checkout)
- **Dosyalar:**
  - `src/modules/cart/cart.repository.ts` (Satır 100-150)
  - `src/modules/checkout/checkout.repository.ts` (Satır 59-80)
- **Sorun:** `CheckoutRepository.loadCartLines` fonksiyonu, sepet modülünü ve `CartRepository`'yi tamamen atlayarak doğrudan `cartItem` tablosuna sorgu atmaktadır. Sepet satırlarının okunması mantığı iki ayrı repository'de neredeyse aynı sorgularla tekrarlanmıştır.

### 3.4 Server Actions'ta Hata Yakalama Tekrarları
- **Dosyalar:**
  - `src/app/(admin)/admin/urunler/actions.ts`
  - `src/app/(storefront)/odeme/actions.ts`
- **Sorun:** Admin tarafında `runAdminAction` yazılmış olmasına rağmen bazı admin eylemlerinde ve storefront eylemlerinde aynı `try-catch / isAppError / reportError` blokları defalarca elle yazılmıştır. Storefront için standart bir `runStorefrontAction` wrapper'ı eksiktir.

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

| Faz | Görev | Hedeflenen SOLID/Clean Prensibi | Tahmini Efor |
| :--- | :--- | :--- | :--- |
| **Faz 1** | `Actor` tipini `src/shared/audit` altına taşımak | DIP / Clean Architecture | Çok Düşük (30 dk) |
| **Faz 1** | `notifications/container.ts` ve `checkout/container.ts` oluşturup `orders/container.ts`'ı sadeleştirmek | SRP / DIP | Düşük (1-2 saat) |
| **Faz 1** | `stock.replenished` ölü olayını temizlemek veya worker'a bağlamak | Clean Code / Dead Code | Düşük (1 saat) |
| **Faz 2** | `custom-pickle` bağımlılığını genel `ItemCustomizationHandler` arayüzü arkasına almak | OCP / Modülerlik | Orta (3-4 saat) |
| **Faz 2** | `OrderRepository` içindeki kredi limiti mantığını `CheckoutService`'e çekmek | SRP / Separation of Concerns | Orta (2-3 saat) |
| **Faz 2** | `OrderRepository` arayüzünü okuma, yazma ve ödeme olarak segmente etmek | ISP | Orta (3 saat) |
| **Faz 3** | 800 satırlık `product-form.tsx` ve 630 satırlık `builder.tsx` bileşenlerini hook ve alt bileşenlere bölmek | SRP / Clean Code | Yüksek (1 gün) |
| **Faz 3** | Storefront Server Actions için standart `runStorefrontAction` wrapper yazmak | DRY / Error Handling | Düşük (2 saat) |
