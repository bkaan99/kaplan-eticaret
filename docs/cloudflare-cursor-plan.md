# Cloudflare'e taşıma — uygulama planı (Cursor için)

Dal: `cloudflare-adaptation`. Genel çerçeve `docs/cloudflare-adaptation.md` içinde; bu belge oradaki kararların **kod üzerinde ölçülmüş** halidir ve adım adım yapılacakları verir.

## Kurallar (her adımda)
- `AGENTS.md`: Next bu projede bildiğin Next değil; kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili kılavuzu oku.
- Her adım ayrı commit. Her adım sonunda `npm run typecheck`, `npm test`, `npm run lint` yeşil olmalı.
- Stok uyarısı (`src/modules/stock-alerts`) ve ERP (`src/modules/erp`) taşınmaz, silinir.
- Güvenlik yükseltmesi ve şablon sınırları bu işin dışında.

## Ölçülen durum
- 44 Prisma modeli, 24 `Decimal`, 9 `Json`, 14 `enum` alanı.
- Ham SQL: `order.repository.ts` (2 `$executeRaw` + 1 `FOR UPDATE`), `postgres-rate-limiter.ts`, `api/health/ready/route.ts`.
- Interaktif `$transaction` kullanan 10 repository: staff, bulk-update, price-list, product-admin, content, cart, order, return, address, privacy.
- Node'a bağlı parçalar: `@node-rs/argon2` (`modules/auth/password-hasher.ts`), `pg-boss` (`shared/queue`, `src/worker`), `nodemailer` (`integrations/notification/smtp-mailer.ts`), yerel disk (`shared/storage/local-storage.ts`, `app/uploads`, `admin/yukle`).
- Seçili yığın: Next 16.4.3, Prisma 7.10.0 (`@prisma/adapter-d1` mevcut), `@opennextjs/cloudflare` 1.20.x.

## En büyük risk: D1'de interaktif transaction yok
D1 yalnızca toplu (batch) çalıştırmayı destekler; Prisma `$transaction(async tx => …)` ve Drizzle `db.transaction` D1'de çalışmaz. 10 repository'nin hepsi şu üç yoldan biriyle yeniden yazılacak:
1. Yazma adımları tek `batch([...])` içine alınır (hepsi ya da hiçbiri).
2. Önce okuma, sonra koşullu `UPDATE ... WHERE stok >= ?`, `changes === 0` ise hata.
3. Gerçekten çok adımlı akışlarda (sipariş oluşturma) idempotent adımlar + telafi (örn. rezervasyonu geri bırak).

**Alternatif (karar sende):** D1 yerine mevcut Postgres'i Hyperdrive ile bağlamak. Interaktif transaction, `Decimal`, `FOR UPDATE` ve migration zinciri olduğu gibi kalır; iş haftalardan günlere iner. dormen-wear bu şekilde çalışıyor. `cloudflare-adaptation.md` "yalnız D1" demiş; bu seçimi bilerek yap.

## Adımlar

### 0. Spike (1–2 gün) — karar notu yaz
- Boş bir Worker + D1 ile: (a) Prisma + `@prisma/adapter-d1`, (b) Drizzle + D1 dene.
- Şunları ölç: `batch` ile iki tablo yazma, koşullu `UPDATE` ile stok düşme, `Json` alanı, ilişkili `include` sorgusu, cold start süresi.
- Çıktı: `docs/cloudflare-adaptation.md` içine "ORM kararı" bölümü. Prisma'nın `Decimal`/`Json`/`enum` desteği D1 adapter'da yetersizse Drizzle.

### 1. Ayıklama ✅
- `src/modules/stock-alerts`, `src/modules/erp`, ilgili worker job kayıtları, vitrindeki "stok gelince haber ver" arayüzü, ilgili testler silindi.
- `BackInStockSubscription` şemadan çıkarıldı (`20261101140000_drop_back_in_stock`).

### 2. Para modeli (kuruş)
- `src/shared/money.ts`: `toMinor`, `fromMinor`, yüzde ölçeği (baz 10_000), `desiMilli`.
- Şemada `Decimal` alanları `Int` (minor) olur; checkout, kargo, kupon, B2B kredi, raporlama ve gösterim buradan geçer. Birim testleri önce yazılır.

### 3. D1 şeması ve seed
- Yeni baseline migration (`wrangler d1 migrations`), eski Postgres zinciri `prisma/migrations-archive/` altına.
- `enum` → `TEXT` + CHECK, `Json` → `TEXT` (okurken parse). Seed (turşu kataloğu, roller, admin, özel turşu malzemeleri) D1'e yüklenir.
- Admin parolası `admin-giris.local.txt` içinde; çıktıya veya commit'e yazma.

### 4. Eşzamanlılık
- `order.repository.ts` içindeki 3 ham SQL: stok düşme ve kredi limiti koşullu `UPDATE` olarak yeniden yazılır; `FOR UPDATE` kalkar.
- Test: "son 1 stok, 2 eşzamanlı checkout" → biri başarılı, biri stok hatası.

### 5. Repository katmanı
- 10 `$transaction` kullanımı yukarıdaki üç yoldan biriyle yeniden yazılır (en riskli: order, cart, return).
- `postgres-rate-limiter.ts` → D1 (veya Workers Rate Limiting binding). Health: `SELECT 1` D1 üzerinden.
- Integration testleri yerel D1'e (`wrangler d1 --local` ya da miniflare) taşınır.

### 6. Queue ve Cron
- `pg-boss` kalkar. `JobQueue` arayüzü korunur, `CloudflareJobQueue` yazılır.
- `email.send` → Queue (producer: uygulama, consumer: Worker). Süresi dolan sipariş temizliği ve bakım (rate-limit/audit purge) → Cron Trigger.
- `npm run worker` ve `src/worker` silinir.

### 7. R2
- `FileStorage` için `R2FileStorage`; `app/uploads/[...path]` ve `admin/yukle` R2'den okur/yazar. Görsel URL'leri `/uploads/...` yolunu korur (mevcut kayıtlar bozulmasın).

### 8. Uygulamayı Workers'a al
- **OpenNext** (`@opennextjs/cloudflare`) kullan: dormen-wear ve masamqr'da çalışan düzen bu (R2 incremental cache, `defineCloudflareConfig`, `wrangler.jsonc`, `nodejs_compat`). vinext yalnızca OpenNext tıkanırsa.
- `@node-rs/argon2` → Workers uyumlu hash. Mevcut kullanıcı hash'leri bozulmasın: giriş sırasında eski hash doğrulanır, yeni hash'e yükseltilir.
- E-posta: SMTP Workers'ta kısıtlı. Queue consumer içinden Cloudflare Email Sending ya da bir transactional API kullan; sağlayıcıyı go-live öncesi netleştir.
- Auth.js oturumu, PayTR callback (test modu), server action'lar smoke test.

### 9. Staging, CI, canlı
- CI: D1 migrate → unit → integration → e2e. `docker-compose.yml` Postgres bağımlılığı kalkar.
- Staging: ayrı D1 ve R2, `workers_dev:false`, `preview_urls:false`, gözlem (observability) açık.
- Canlıya çıkış (domain, PayTR canlı, gerçek e-posta, yedek) ayrı checklist; **deploy'dan önce kullanıcıya sor**.

## Bitti sayılır
- [ ] Vitrin: kategori, ürün, sepet, "Kendi Turşunu Yap"
- [ ] Checkout + test ödeme, stok yarış testi geçiyor
- [ ] Admin: ürün, sipariş, turşu malzemeleri
- [ ] Görseller R2'den
- [ ] Sipariş e-postası Queue'dan gidiyor, süresi dolan sipariş Cron ile temizleniyor
- [ ] Stok uyarısı ve ERP yok
- [ ] HTTPS staging linki var
