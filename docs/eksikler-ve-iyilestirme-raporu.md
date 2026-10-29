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

### 2.2. "Tüm Ürünler" Bağlantısına Tıklandığında Boş Sayfa Açılması
- **İlgili Dosyalar:**
  - `src/app/(storefront)/ara/page.tsx` (`SearchContent`)
  - `src/components/storefront/site-header.tsx`
  - `src/components/storefront/site-footer.tsx`
  - `src/components/storefront/hero-slider.tsx`
- **Tespit:**
  Üst menü (header), alt menü (footer) ve hero alanlarındaki "Tüm Ürünler" butonları `/ara` adresine yönlendirilmektedir. Fakat `src/app/(storefront)/ara/page.tsx` satır 21'de arama parametresi (`query.search`) boş olduğunda:
  ```tsx
  if (!query.search) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Aramak istediğiniz ürünü yazın.
      </p>
    );
  }
  ```
  kuralı çalışmakta ve katalog listelenmemektedir.
- **Etki:**
  Siteye gelen müşteri "Tüm Ürünler"e tıkladığında hiçbir ürün görememekte, boş bir arama uyarısıyla karşılaşmaktadır.
- **Çözüm:**
  `SearchContent` bileşeni, `query.search` olmadığında da `catalogService.list(query, ...)` çağırarak tüm ürünleri filtreleme paneli ve sayfalama ile birlikte sunmalıdır. Başlık terim varsa *"“[arama]” için X sonuç"*, terim yoksa *"Tüm Ürünler (X ürün)"* olarak dinamikleştirilmelidir.

---

### 2.3. Özel Turşu Siparişlerinde "Tekrar Sipariş Ver" (Reorder) Kırılması
- **İlgili Dosyalar:**
  - `src/modules/orders/reorder.service.ts`
  - `src/modules/cart/cart.service.ts` (`addItem` & `addCustomItem`)
- **Tespit:**
  Müşteri "Kendi Turşunu Yap" ile aldığı bir bidonu sipariş detay sayfasından tekrar sipariş vermek istediğinde, `ReorderService` satırı standart ürün gibi `cart.addItem` ile eklemeye çalışır. `cart.addItem` ise slug değeri `kendi-tursunu-yap` olan ürünleri bilerek engeller (`ValidationError: Bu bidon "Kendi Turşunu Yap" sayfasından malzeme seçilerek oluşturulur`).
- **Etki:**
  Sipariş satırındaki `customization` JSON verisi okunup `cart.addCustomItem` metoduna iletilmediği için müşteri özel turşu siparişini tekrar veremez, satır atlanır.
- **Çözüm:**
  `ReorderService` içerisine satırın `customization` taşıyıp taşımadığı kontrolü eklenmeli; eğer özel turşu ise `cart.addCustomItem` çağrılarak reçete ve malzeme seçimi korunarak sepete aktarılmalıdır.

---

### 2.4. Yönetim Paneli Sipariş Ekranında Özel Turşu Reçetesinin Görünmemesi
- **İlgili Dosyalar:**
  - `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx`
  - `prisma/schema.prisma` (`OrderItem.customization`)
- **Tespit:**
  Müşterinin seçtiği malzemeler, kg başı birim ek ücretler, salamura tercihi (sirkeli/fermente), acılık derecesi ve kavanoz notu veritabanında `OrderItem.customization` alanında JSON olarak mevcuttur. Ancak admin sipariş detayında yalnızca `item.productName` ve metinsel `item.variantName` gösterilmektedir.
- **Etki:**
  İmalat ustası veya paketleme personeli sipariş edilen özel bidonun içine tam olarak hangi sebzelerin konulacağını yapılandırılmış ve net bir kart olarak görememektedir.
- **Çözüm:**
  Admin sipariş ürün listesine, satırda `customization` varsa açılan özel bir "Reçete & Tercihler" rozet/kart bileşeni eklenmelidir.

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

### 3.3. Salamura ve Acılık Seçeneklerinin Kod İçinde Sabit Olması
- **Durum:** `BRINE_OPTIONS` (Sirkeli, Doğal Fermente) ve `SPICE_OPTIONS` (Acısız, Orta, Acılı) TypeScript sabitleri olarak yazılmıştır.
- **Öneri:** Yönetici panelinden yeni salamura tarifleri (ör. *"Kaya Tuzlu - Limonlu"*, *"Elma Sirkeli"*) ve tuz oranları tanımlanabilecek dinamik bir yapıya geçirilmelidir.

---

## 4. Vergi, Fatura ve Yasal Mevzuat Eksikleri

### 4.1. Gıda Ürünlerinde Hatalı KDV Oranı (%20 Default)
- **İlgili Dosyalar:** `prisma/schema.prisma` (`Product.taxRate`), `src/config/site.config.ts`, `src/app/(admin)/admin/urunler/product-form.tsx`
- **Sorun:** Veritabanında ve formlarda KDV varsayılanı `%20` olarak belirlenmiştir.
- **Yasal Durum:** 6502 ve Katma Değer Vergisi Kanunu Cumhurbaşkanlığı Kararı No: 5189 uyarınca; geleneksel ev turşusu, sebze konservesi, şalgam suyu ve sirke gibi temel gıda maddelerinde KDV oranı **%1** (veya içecek niteliğindeki bazı ürünlerde %10)'dir.
- **Çözüm:** Şema ve form varsayılanı gıda ürünleri için `%1` olarak revize edilmeli, kargo KDV'si (%20) ile ürün KDV'si ayrıştırılmalıdır.

### 4.2. Bireysel Faturada TCKN Bilgisinin Panelde Gösterilmemesi
- **İlgili Dosya:** `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx` (`AddressBlock`)
- **Sorun:** Sipariş formunda bireysel fatura için müşterinin girdiği 11 haneli TCKN (`nationalId`), sipariş detayında gösterilmemektedir (yalnızca kurumsal VKN gösterilmektedir).
- **Çözüm:** Muhasebenin e-arşiv fatura kesebilmesi için bireysel faturalarda TCKN alanı sipariş detayına eklenmelidir.

### 4.3. Müşteri Sipariş Takibinde Fatura Adresinin Gösterilmemesi
- **İlgili Dosya:** `src/app/(storefront)/siparis/[orderNumber]/page.tsx`
- **Sorun:** Müşteri sipariş takip ekranında sadece "Teslimat Adresi" görünmektedir. Fatura adresi farklı olan veya kurumsal sipariş veren müşteriler fatura detaylarını teyit edememektedir.

---

## 5. Kullanıcı Deneyimi (UX), Arayüz ve Mobil Eksikleri

### 5.1. Mobilde Açılır Gezinti Menüsü (Hamburger Drawer) Eksikliği
- **İlgili Dosya:** `src/components/storefront/site-header.tsx` & `header-nav.tsx`
- **Sorun:** Küçük ekranlarda (360px - 480px) yalnızca açılır arama çubuğu bulunmaktadır. İkinci satırda sarı *"Kendi Turşunu Yap"* butonu ile kategori etiketleri yatay kaydırma ile yan yana sıkışmaktadır.
- **Çözüm:** Standart bir mobil menü butonu (hamburger ikon) ve ekranın yanından açılan menü çekmecesi (sheet/drawer) eklenerek kategorilere, hesaba, favorilere ve kurumsal sayfalara rahat erişim sağlanmalıdır.

### 5.2. Ürün Kartlarında Sahte Puanlama ve Hacim Algoritması
- **İlgili Dosya:** `src/components/storefront/product-card.tsx` (`getProductRating` & `getProductSizeHint`)
- **Sorun:**
  ```tsx
  function getProductRating(slug: string) {
    const hash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const score = (4.8 + (hash % 3) * 0.1).toFixed(1);
    const count = 28 + (hash % 65);
    return { score, count };
  }
  ```
  Kart üzerindeki yıldız puanları gerçek bir veritabanı kaydından değil, slug karakterlerinin matematiksel karmasından yapay olarak türetilmektedir. Ayrıca ambalaj boyutu bilgisi veritabanındaki gerçek varyant yerine slug'a göre tahmin edilmektedir.
- **Çözüm:** Gerçek ürün yorumlama ve değerlendirme modülü entegre edilene kadar yapay puanlar kaldırılmalı veya şeffaf bir değerlendirme tablosuna bağlanmalıdır.

### 5.3. Müşteri Değerlendirme / Yorum Sistemi (Review Engine) Eksikliği
- **Durum:** Müşterilerin sipariş tamamlandıktan sonra ürüne fotoğraf, yıldız puanı ve yorum bırakabileceği interaktif bir altyapı yoktur. Anasayfadaki yorumlar statik metin olarak kodlanmıştır.
- **Öneri:** `Review` modeli, admin onay mekanizması ve ürün detayında "Müşteri Yorumları" sekmesi geliştirilmelidir.

### 5.4. İletişim Bilgilerinde Dummy Veri Bulunması
- **İlgili Dosya:** `src/config/project.json`
- **Sorun:** Telefon numarası `"+90 000 000 00 00"` olarak tanımlıdır. Footer'daki doğrudan arama butonu bu geçersiz numarayı aramaktadır. Canlıya çıkış öncesi güncellenmelidir.

---

## 6. SEO, Meta ve Teknik Altyapı İyileştirmeleri

### 6.1. Root Layout İçerisinde `metadataBase` Tanımsızlığı
- **İlgili Dosya:** `src/app/layout.tsx` (`RootLayout.metadata`)
- **Sorun:** `metadataBase` tanımlı olmadığında Next.js derleme sırasında ve çalışma zamanında OpenGraph görselleri ile canonical URL'ler için `localhost:3000` uyarısı vermektedir.
- **Çözüm:** `metadataBase: new URL(getSiteUrl())` satırı eklenmelidir.

### 6.2. Sitemap Dosyasında `/kendi-tursunu-yap` Eksikliği
- **İlgili Dosya:** `src/app/sitemap.ts`
- **Sorun:** Sitenin en ayırt edici sayfası olan `/kendi-tursunu-yap` statik rota olarak sitemap'e dahil edilmemiştir. Bunun yerine ürün tablosundaki slug üzerinden eklenen `/urun/kendi-tursunu-yap` adresi yer almakta, o da 307 redirect vermektedir.
- **Çözüm:** `sitemap.ts` içine doğrudan `/kendi-tursunu-yap` eklenmeli, ürün listesinden bu slug filtrelenmelidir.

### 6.3. Playwright E2E Testinde Başlık Metni Uyuşmazlığı
- **İlgili Dosya:** `e2e/storefront.spec.ts` (satır 9)
- **Sorun:** Test kodu `page.getByRole("heading", { name: "Kategoriler" })` aramaktadır; fakat anasayfadaki başlık yakın zamanda *"Kategorileri Keşfedin"* olarak değiştirilmiştir. Exact-match kuralı sebebiyle E2E testi bu adımda hata verebilmektedir.
- **Çözüm:** Test kuralı regex formatına (`name: /Kategoriler/i`) çevrilmelidir.

### 6.4. Kargo Entegrasyonu Sınırları
- **Durum:** Kargo takip numarası manuel girilmekte ve link şablonu üretilmektedir.
- **Öneri:** Yurtiçi Kargo, Aras Kargo veya MNG Kargo API'leri ile entegrasyon kurularak kargo fişi oluşturma, barkod basma ve teslim edildi bilgisini webhook ile otomatik çekme altyapısı hazırlanmalıdır.

---

## 7. Önceliklendirilmiş Eylem Planı Tablosu

| Seviye | Konu | İlgili Dosya(lar) | Efor |
| :--- | :--- | :--- | :--- |
| 🔴 **P1 - Acil** | `/ara` sayfasının aramasız girişte tüm kataloğu listelemesi | `src/app/(storefront)/ara/page.tsx` | Düşük |
| 🔴 **P1 - Acil** | Havale/vadeli sipariş bildirim e-postalarının listener bağlantısı | `src/modules/orders/container.ts` | Düşük |
| 🔴 **P1 - Acil** | Özel turşu siparişlerinde "Tekrar Sipariş Ver" fonksiyonunun düzeltilmesi | `src/modules/orders/reorder.service.ts` | Orta |
| 🟡 **P2 - Önemli** | Admin sipariş detayında turşu reçetesi ve TCKN gösterimi | `src/app/(admin)/admin/siparisler/[orderNumber]/page.tsx` | Düşük |
| 🟡 **P2 - Önemli** | Gıda ürünleri için KDV varsayılanının %1 olarak düzenlenmesi | `prisma/schema.prisma`, `site.config.ts` | Orta |
| 🟡 **P2 - Önemli** | Mobil cihazlar için açılır hamburger menü bileşeni | `src/components/storefront/site-header.tsx` | Orta |
| 🟢 **P3 - Geliştirme** | Sitemap ve `metadataBase` SEO yapılandırmaları | `src/app/sitemap.ts`, `src/app/layout.tsx` | Düşük |
| 🟢 **P3 - Geliştirme** | Ürün kartlarındaki sahte puanların temizlenmesi ve gerçek yorum altyapısı | `src/components/storefront/product-card.tsx` | Yüksek |
| 🟢 **P3 - Geliştirme** | Canlı kargo API entegrasyonu (Yurtiçi/Aras/MNG) | `src/integrations/shipping/` | Yüksek |
