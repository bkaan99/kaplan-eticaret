# Kaplan Turşu E-Ticaret Platformu - Kalan Eksikler Raporu

> **Son Güncelleme:** 30 Ekim 2026  
> **Kapsam:** Mimari, İş Akışları, Veritabanı Şeması, Vitrin/Admin Kullanıcı Deneyimi, SEO ve Entegrasyon Analizi  
> **Durum:** Tamamlanan maddeler temizlenmiş olup, yalnızca bekleyen iyileştirmeler listelenmektedir.

---

## 1. Yönetici Özeti

Bu doküman, **Kaplan Turşu** e-ticaret platformunda henüz giderilmemiş kritik ve orta öncelikli eksikleri listeler. Tamamlanan maddeler (katalog `/ara` listesi, reorder, reçete gösterimi, dinamik salamura/acılık, KDV, mobil menü, SEO, sahte puan temizliği, iletişim ayarları vb.) arşivden çıkarılmıştır.

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

### 2.2. `stock.replenished` Domain Olayının Dinleyicisiz Olması
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

---

## 4. Kullanıcı Deneyimi (UX) ve Ürün Eksikleri

### 4.1. Müşteri Değerlendirme / Yorum Sistemi (Review Engine) Eksikliği
- **Durum:** Müşterilerin sipariş tamamlandıktan sonra ürüne fotoğraf, yıldız puanı ve yorum bırakabileceği interaktif bir altyapı yoktur. Anasayfadaki yorumlar statik metin olarak kodlanmıştır.
- **Öneri:** `Review` modeli, admin onay mekanizması ve ürün detayında "Müşteri Yorumları" sekmesi geliştirilmelidir.

---

## 5. Entegrasyon İyileştirmeleri

### 5.1. Kargo Entegrasyonu Sınırları
- **Durum:** Kargo takip numarası manuel girilmekte ve link şablonu üretilmektedir.
- **Öneri:** Yurtiçi Kargo, Aras Kargo veya MNG Kargo API'leri ile entegrasyon kurularak kargo fişi oluşturma, barkod basma ve teslim edildi bilgisini webhook ile otomatik çekme altyapısı hazırlanmalıdır.

---

## 6. Önceliklendirilmiş Eylem Planı Tablosu

| Seviye | Konu | İlgili Dosya(lar) | Efor |
| :--- | :--- | :--- | :--- |
| 🔴 **P1 - Acil** | Havale/vadeli sipariş bildirim e-postalarının listener bağlantısı | `src/modules/orders/container.ts` | Düşük |
| 🟠 **P2** | `stock.replenished` için anlık bildirim abonesi | `notifications/`, `worker/jobs/stock-alerts.ts` | Orta |
| 🟢 **P3 - Geliştirme** | Malzeme stok / mevsimsel temin takibi | `custom-pickle/`, Prisma | Orta |
| 🟢 **P3 - Geliştirme** | Malzeme karışım oranları (slider) | `kendi-tursunu-yap/` | Yüksek |
| 🟢 **P3 - Geliştirme** | Müşteri yorum / puanlama sistemi | yeni `Review` modülü | Yüksek |
| 🟢 **P3 - Geliştirme** | Canlı kargo API entegrasyonu (Yurtiçi/Aras/MNG) | `src/integrations/shipping/` | Yüksek |
