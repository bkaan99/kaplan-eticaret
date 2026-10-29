# Clean Code ve SOLID Prensipleri Kalan İyileştirmeler Raporu

> **Son Güncelleme:** 2026-10-30  
> **Kapsam:** `src/modules`, `src/integrations`, `src/shared`, `src/app`, `src/components`  
> **Durum:** Çözülen maddeler temizlenmiş olup, yalnızca bekleyen mimari iyileştirmeler listelenmektedir.

---

## 1. Tamamlanan İyileştirmeler Özeti (Arşiv)

Aşağıdaki maddeler başarıyla çözülmüş, refactor edilmiş ve birim testlerle doğrulanmıştır:
- ✅ **SRP (Tek Sorumluluk):** `CreditLimitPolicy` ayrıştırıldı, `CheckoutService` Facade'a bölündü, God Components (formlar/sayfalar) hook ve alt bileşenlere ayrıldı, `NotificationService` handler'lara bölündü.
- ✅ **OCP (Açık/Kapalı):** Ödeme ve iade akışları Strategy Pattern (`PaymentRefundStrategy`, `CheckoutPaymentStrategy`) ile polimorfik hale getirildi.
- ✅ **ISP (Arayüz Ayrımı):** `OrderRepository` fat interface'i 8 amaca yönelik alt arayüze (`OrderLookup`, `OrderQuery`, `OrderCreation`, vb.) bölündü.
- ✅ **DIP (Bağımlılıkların Tersine Çevrilmesi):** `orders/container.ts` monolitik yapısı ayrıştırıldı; `notifications`, `checkout`, `payment` bağımsız container'larına kavuştu.
- ✅ **Clean Code / DRY:** Sepet-ödeme veritabanı sorgu duplikasyonu (`CartRepository` delegasyonu) giderildi.
- ✅ **Clean Code / Error Handling:** Server Action `try/catch` duplikasyonları için `runStorefrontAction` wrapper'ı yazıldı.
- ✅ **Clean Code / Observability:** `discounts.ts` ve bildirim handler'larındaki sessiz başarısızlıklar yapılandırılmış loglarla (`logger.warn`) izlenebilir hale getirildi.

---

## 2. Kalan SOLID Prensipleri İyileştirmeleri

### 2.1 O — Open/Closed Principle (Açık/Kapalı İlkesi)

#### Şablona Özgü Olmayan Ürün Mantığının Çekirdeğe Katı Kodlanması
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

---

### 2.2 L — Liskov Substitution Principle (Liskov Yerine Geçme İlkesi)

#### `DevPaymentProvider` Sızıntısı ve Arayüz Bütünlüğünün Bozulması
- **Dosyalar:**
  - `src/integrations/payment/dev/dev-payment-provider.ts` (Satır 37-43)
  - `src/integrations/payment/container.ts` (veya `orders/container.ts`)
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

### 2.3 D — Dependency Inversion Principle (Bağımlılıkların Tersine Çevrilmesi)

#### 1. Ters Katman Bağımlılığı (`Actor` Arayüzünün Yanlış Yerde Tanımlanması)
- **Dosyalar:**
  - `src/modules/admin/orders/admin-order.service.ts` (Satır 15-18)
  - `src/modules/b2b/dealer.service.ts`
  - `src/modules/content/content.service.ts`
  - `src/modules/returns/return.service.ts`
  - `src/modules/custom-pickle/custom-pickle.service.ts`
  - `src/modules/erp/erp-sync.service.ts`
- **Sorun:** Denetim kaydı (audit) tutabilmek için gerekli olan temel `{ userId: string; ip?: string | null }` şeklindeki `Actor` arayüzü, admin modülünün içindeki `admin-order.service.ts` dosyasında export edilmiştir.
- **Etki:** B2B, İçerik Yönetimi, İade Takibi ve Turşu gibi bağımsız domain servisleri, admin paneli sipariş servisine bağımlı hale gelmiştir. Clean Architecture bağımlılık kuralı (Dependency Rule) açıkça ihlal edilmiştir.
- **Çözüm:** `Actor` tanımı `src/shared/audit` veya `src/shared/auth` klasörüne taşınmalıdır.

#### 2. Global Statik Konfigürasyona (`siteConfig`) Doğrudan Bağımlılık
- **Dosyalar:**
  - `src/modules/notifications/notification.service.ts`
  - `src/modules/checkout/shipping.ts`
- **Sorun:** Servisler yapılandırma değerlerini constructor argümanı olarak dışarıdan almak yerine, `@/config/site.config` dosyasındaki statik objeyi varsayılan parametre olarak bağlamaktadır. Bu durum izole birim testlerini zorlaştırır ve çalışma anında dinamik konfigürasyonu engeller.
- **Çözüm:** Yapılandırma parametreleri constructor üzerinden saf bağımlılık enjeksiyonu ile geçilmelidir.

---

## 3. Kalan Clean Code ve Mimari Tasarım Eksiklikleri

### 3.1 Hayalet Olaylar (Ghost Events) ve Süreçler Arası İletişim Uyumsuzluğu
- **Dosyalar:**
  - `src/modules/admin/catalog/product-admin.service.ts`
  - `src/modules/admin/import/bulk-update.service.ts`
  - `src/modules/erp/erp-sync.service.ts`
  - `src/shared/events/event-bus.ts`
- **Sorun:**
  1. Stoğu sıfırdan artan ürünler için `stock.replenished` olayı yayınlanmaktadır. Ancak projenin canlı kodunda bu olayı dinleyen **hiçbir subscriber yoktur** (yalnızca unit testler dinlemektedir). Asıl stok bildirimleri ise worker içinde her 10 dakikada bir çalışan `stock-alerts.sweep` işiyle gönderilmektedir. Bu olay tamamen ölü koddur (dead code).
  2. `InMemoryEventBus` bellek içi çalıştığından, bağımsız bir Node sürecinde koşan `worker` (`src/worker/index.ts`), Next.js sunucu süreçlerinde fırlatılan in-memory olayları teknik olarak dinleyemez.
- **Çözüm:** Asenkron domain olayları `pg-boss` kuyruğu üzerinden dağıtılmalı veya ölü olay yayınları temizlenmelidir.

### 3.2 Olay Aboneliklerinde Zamansal Bağlaşım (Temporal Coupling)
- **Dosyalar:**
  - `src/modules/notifications/container.ts` (veya `orders/container.ts`)
- **Sorun:** Event dinleyicileri (`bus.subscribe("order.paid", ...)`), `getNotificationService()` fonksiyonunun ilk çağrılışı sırasında yan etki (side effect) olarak bağlanmaktadır.
- **Etki:** Eğer bir istek yaşam döngüsünde `getNotificationService()` çağrılmadan önce bir olay fırlatılırsa, dinleyiciler henüz kayıt olmadığı için olay sessizce kaybolur.
- **Çözüm:** Event bus dinleyicileri uygulama başlangıcında (initialization / bootstrap aşamasında) deterministik bir sırayla kaydedilmelidir.

### 3.3 İsimlendirme ve Dil Karışıklığı
- **Sorun:** Kod tabanında Türkçe ve İngilizce iç içe geçmiştir.
  - DB Modelleri: `ProductVariant`, `CartItem`, `Order` (İngilizce)
  - Route ve Klasörler: `kendi-tursunu-yap`, `tursu-malzemeleri`, `bayi-gruplari` (Türkçe)
  - Fonksiyon ve Değişkenler: `bidonWeightGram`, `PickleIngredient`, `CustomizationPricer` (Karma)
- **Çözüm:** Kod seviyesinde standart İngilizce tercih edilmeli; Türkçe yalnızca son kullanıcı arayüzü, i18n çeviri sözlüğü ve yerel mevzuat terimleriyle (örn. VKN) sınırlı tutulmalıdır.

---

## 4. Kalan İşler Öncelik Sıralaması

| Öncelik | Görev | Hedeflenen SOLID/Clean Prensibi | Durum | Tahmini Efor |
| :--- | :--- | :--- | :---: | :--- |
| **P1** | `Actor` tipini `src/shared/audit` altına taşımak | DIP / Clean Architecture | ⏳ Bekliyor | Çok Düşük (30 dk) |
| **P1** | `stock.replenished` ölü olayını temizlemek veya worker'a bağlamak | Clean Code / Dead Code | ⏳ Bekliyor | Düşük (1 saat) |
| **P1** | `DevPaymentProvider.signPayload` sızıntısını simülasyon servisine izole etmek | LSP (Liskov Substitution) | ⏳ Bekliyor | Düşük (1 saat) |
| **P2** | `custom-pickle` bağımlılığını genel `ItemCustomizationHandler` arayüzü arkasına almak | OCP / Modülerlik | ⏳ Bekliyor | Orta (3-4 saat) |
| **P2** | Olay aboneliklerindeki zamansal bağlaşımı deterministik bootstrap ile çözmek | Clean Code / Decoupling | ⏳ Bekliyor | Düşük (1-2 saat) |
| **P2** | Global `siteConfig` doğrudan bağımlılıklarını constructor enjeksiyonuna çevirmek | DIP / Testability | ⏳ Bekliyor | Orta (2 saat) |
| **P3** | Kod seviyesindeki Türkçe/İngilizce karmaşasını kademeli standartlaştırmak | Clean Code / Consistency | ⏳ Bekliyor | Sürekli İyileştirme |
