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

### 0. Spike ✅ — Prisma + D1 / better-sqlite3
### 1. Ayıklama ✅
### 2. Para helper’ları ✅ (şema Int harden sonra)
### 3. SQLite baseline ✅ (`migrations-archive` + D1 SQL)
### 4. FOR UPDATE / rate-limit ✅
### 5. Repository `$transaction` → D1 batch 🔴 **sıradaki kritik iş**
### 6. Queue/Cron iskeleti 🟡 (consumer + cron wiring eksik)
### 7. R2 adaptörü 🟡
### 8. OpenNext iskeleti 🟡 (deploy kullanıcı onayı + resource id)

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
