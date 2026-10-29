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
- ✅ **DIP (Clean Architecture):** `Actor` arayüzü `admin-order.service.ts` dosyasından `@/shared/audit` altına taşındı; B2B, İçerik, İade, Turşu ve Ayarlar gibi bağımsız servislerin admin servisine olan ters bağımlılığı ortadan kaldırıldı.
- ✅ **Clean Code / DRY:** Sepet-ödeme veritabanı sorgu duplikasyonu (`CartRepository` delegasyonu) giderildi.
- ✅ **Clean Code / Error Handling:** Server Action `try/catch` duplikasyonları için `runStorefrontAction` wrapper'ı yazıldı.
- ✅ **Clean Code / Observability:** `discounts.ts` ve bildirim handler'larındaki sessiz başarısızlıklar yapılandırılmış loglarla (`logger.warn`) izlenebilir hale getirildi.
- ✅ **Clean Code / Dead Code:** Canlı sistemde dinleyicisi olmayan hayalet domain olayı `stock.replenished` (ve `ProductAdminService`, `BulkUpdateService`, `ErpSyncService` üzerindeki tetikleyicileri) temizlendi; stok bildirimleri güvenli biçimde worker sweep job'ına bırakıldı.

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

#### Global Statik Konfigürasyona (`siteConfig`) Doğrudan Bağımlılık
- **Dosyalar:**
  - `src/modules/notifications/notification.service.ts`
  - `src/modules/checkout/shipping.ts`
- **Sorun:** Servisler yapılandırma değerlerini constructor argümanı olarak dışarıdan almak yerine, `@/config/site.config` dosyasındaki statik objeyi varsayılan parametre olarak bağlamaktadır. Bu durum izole birim testlerini zorlaştırır ve çalışma anında dinamik konfigürasyonu engeller.
- **Çözüm:** Yapılandırma parametreleri constructor üzerinden saf bağımlılık enjeksiyonu ile geçilmelidir.

---

## 3. Kalan Clean Code ve Mimari Tasarım Eksiklikleri

### 3.1 Olay Aboneliklerinde Zamansal Bağlaşım (Temporal Coupling)
- **Dosyalar:**
  - `src/modules/notifications/container.ts` (veya `orders/container.ts`)
- **Sorun:** Event dinleyicileri (`bus.subscribe("order.paid", ...)`), `getNotificationService()` fonksiyonunun ilk çağrılışı sırasında yan etki (side effect) olarak bağlanmaktadır.
- **Etki:** Eğer bir istek yaşam döngüsünde `getNotificationService()` çağrılmadan önce bir olay fırlatılırsa, dinleyiciler henüz kayıt olmadığı için olay sessizce kaybolur.
- **Çözüm:** Event bus dinleyicileri uygulama başlangıcında (initialization / bootstrap aşamasında) deterministik bir sırayla kaydedilmelidir.

### 3.2 İsimlendirme ve Dil Karışıklığı
- **Sorun:** Kod tabanında Türkçe ve İngilizce iç içe geçmiştir.
  - DB Modelleri: `ProductVariant`, `CartItem`, `Order` (İngilizce)
  - Route ve Klasörler: `kendi-tursunu-yap`, `tursu-malzemeleri`, `bayi-gruplari` (Türkçe)
  - Fonksiyon ve Değişkenler: `bidonWeightGram`, `PickleIngredient`, `CustomizationPricer` (Karma)
- **Çözüm:** Kod seviyesinde standart İngilizce tercih edilmeli; Türkçe yalnızca son kullanıcı arayüzü, i18n çeviri sözlüğü ve yerel mevzuat terimleriyle (örn. VKN) sınırlı tutulmalıdır.

---

## 4. Kalan İşler Öncelik Sıralaması

| Öncelik | Görev | Hedeflenen SOLID/Clean Prensibi | Durum | Tahmini Efor |
| :--- | :--- | :--- | :---: | :--- |
| **P1** | `DevPaymentProvider.signPayload` sızıntısını simülasyon servisine izole etmek | LSP (Liskov Substitution) | ⏳ Bekliyor | Düşük (1 saat) |
| **P2** | `custom-pickle` bağımlılığını genel `ItemCustomizationHandler` arayüzü arkasına almak | OCP / Modülerlik | ⏳ Bekliyor | Orta (3-4 saat) |
| **P2** | Olay aboneliklerindeki zamansal bağlaşımı deterministik bootstrap ile çözmek | Clean Code / Decoupling | ⏳ Bekliyor | Düşük (1-2 saat) |
| **P2** | Global `siteConfig` doğrudan bağımlılıklarını constructor enjeksiyonuna çevirmek | DIP / Testability | ⏳ Bekliyor | Orta (2 saat) |
| **P3** | Kod seviyesindeki Türkçe/İngilizce karmaşasını kademeli standartlaştırmak | Clean Code / Consistency | ⏳ Bekliyor | Sürekli İyileştirme |
