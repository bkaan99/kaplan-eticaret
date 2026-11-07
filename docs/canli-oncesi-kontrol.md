# Canlıya çıkış öncesi kontrol listesi

Durum: ✅ hazır · ⏳ senin işin (hesap/anahtar) · 🔧 canlıdan hemen önce yapılacak

## Güvenlik — kodda hazır olanlar
- ✅ Admin sayfaları oturumsuz girişe yönlendirilir; admin işlemleri yetki kontrolünden geçer (`runAdminAction`, `requirePermission`).
- ✅ Güvenlik başlıkları: CSP, HSTS, X-Frame-Options DENY (`src/config/security-headers.ts`).
- ✅ Hız sınırı: giriş, yükleme, sipariş vb. (`src/shared/rate-limit`).
- ✅ Turnstile bot doğrulaması (anahtarlar Cloudflare'de tanımlı).
- ✅ Cron uçları `CRON_SECRET` ile, sabit zamanlı karşılaştırmayla korunur.
- ✅ Görsel yükleme: yetki + hız sınırı + sunucuda içerik doğrulama + rastgele dosya adı.
- ✅ Stok rezervasyonu atomik (aşırı satış engeli, migration 0004).
- ✅ Ödeme: bildirim imzası doğrulanır; sahte ödeme canlı modda kabul edilmez; mod değişimi denetim kaydında.
- ✅ Kişiye özel sayfalar edge önbelleğine girmez (`src/proxy.ts`).
- ✅ Sırlar git dışında (`.dev.vars`, admin giriş dosyaları ignore'da).
- ✅ Bağımlılık: zod 4.6.7'ye yükseltildi.
- ℹ️ `npm audit` kalanları: `next-auth` → `nodemailer` (yalnızca yerel SMTP yolu; Workers'ta Resend kullanılır, mesaj içeriğini kullanıcı belirlemez, kabul edildi) ve `@opennextjs/cloudflare` altındaki derleme-zamanı paketleri (çalışma zamanına girmez).

## Canlıdan önce yapılacaklar
| # | İş | Kim |
|---|----|-----|
| 1 | Migration 0004'ü uzak D1'e uygula: `npm run db:migrate-remote` | 🔧 onayınla |
| 2 | Bu dalı PR'la birleştir, korumalı deploy (`guard-deploy`) ile yayınla | 🔧 onayınla |
| 3 | `RESEND_API_KEY` secret + gönderim alan adı doğrulaması (SPF/DKIM) | ⏳ |
| 4 | PayTR mağaza bilgileri: `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` (Cloudflare secret) | ⏳ |
| 5 | PayTR panelinde bildirim URL'si: `https://<alan-adı>/api/payments/paytr/callback` | ⏳ |
| 6 | Alan adı bağla; `APP_URL`, `MAIL_FROM`, `UPLOADS_PUBLIC_BASE_URL` güncelle; Turnstile site alan adlarına ekle | ⏳ |
| 7 | Alan adı çalışınca `workers_dev: false` yap (workers.dev adresi kapanır) | 🔧 |
| 8 | R2 için kendi alan adı (r2.dev sınırlıdır, üretimde önerilmez) | ⏳ |
| 9 | Admin şifresini güçlü yap, gereksiz personel/test hesaplarını sil | 🔧 |
| 10 | Panelden `Ödeme Ayarları` → PayTR test → deneme ödemesi → Canlı | 🔧 |
| 11 | Test siparişlerini ve test verisini temizle; ürün/fiyat/stok son kontrol | 🔧 |
| 12 | KVKK/mesafeli satış/iade metinleri ve firma bilgileri (vergi no, adres) gözden geçir | ⏳ |
| 13 | D1 yedeği: canlıdan önce `wrangler d1 export`; Time Travel açık | 🔧 |
| 14 | Cloudflare'de WAF/Bot Fight ve alan adı için "Always HTTPS" aç | ⏳ |
