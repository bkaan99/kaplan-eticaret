# Cloudflare uyarlama — durum kontrolü

Tarih: 2026-11-01 · Dal: `cloudflare-adaptation`

## Cloudflare hesabında oluşturulan kaynaklar

| Kaynak | Ad | ID / not |
|--------|-----|----------|
| D1 | `kaplan-eticaret` | `e0697813-ccc2-4594-b6db-b45953a0d85f` (WEUR) |
| R2 | `kaplan-eticaret-uploads` | uploads binding |
| R2 | `kaplan-eticaret-next-cache` | OpenNext incremental cache |
| Queue | `kaplan-eticaret-jobs` | `416cf41706ba4cc6968f82c16f01c4f4` |
| D1 şema | baseline import | **43 tablo** uygulandı (MCP import) |

`wrangler.jsonc` içindeki `database_id` gerçek ID ile güncellendi.

## Kodda tamamlananlar

- [x] Stok uyarısı + ERP kaldırıldı
- [x] SQLite/D1 diyalekti + baseline migration
- [x] Interaktif `$transaction` kaldırıldı
- [x] FOR UPDATE kaldırıldı / koşullu stok
- [x] R2 + Queue adaptörleri
- [x] OpenNext iskeleti + custom worker (queue + scheduled)
- [x] Cron HTTP uçları (`/api/cron/*`)
- [x] Workers uyumlu argon2id hasher
- [x] Para helper’ları (`toMinor` vb.)

## Hâlâ eksik / go-live öncesi

| Madde | Öncelik | Not |
|-------|---------|-----|
| `npm run deploy` | — | **Tamam:** https://kaplan-eticaret.bilgekagangurgen.workers.dev |
| Worker secrets | Orta | AUTH/CRON set; APP_URL vars ile çakışma uyarısı kontrol |
| D1 seed (katalog + admin) | — | **Tamam:** `npm run db:seed-remote -- --admin …` |
| E-posta adapter (Queue consumer) | Yüksek | Kod hazır (Resend); `wrangler secret put RESEND_API_KEY` + doğrulanmış from domain |
| Integration testler SQLite | Orta | Hâlâ eski Postgres URL varsayımı |
| Para şema Int harden | Düşük | Helper var; kolonlar Decimal emülasyonu |
| `pg-boss` paketi / ölü dosya temizliği | Düşük | Kullanılmıyor |
| CI D1 migrate | Orta | GitHub Actions güncellemesi |
| Müşteri staging URL + Access | Orta | URL açık; Access için Zero Trust henüz hesapta enable değil (dashboard) |
| Turnstile (captcha) | — | **Açık:** widget + `TURNSTILE_*` secrets/vars |
| Observability traces | — | **Açık:** `wrangler.jsonc` traces.enabled |
| Rate-limit IP | — | `cf-connecting-ip` öncelikli |

## Yerel çalıştırma

```bash
# .env
DATABASE_URL=file:./dev.db
npx prisma migrate deploy
npm run db:seed
npm run create-admin -- admin@example.com 'GüçlüParola123!'
npm run dev
```

## Deploy (onay sonrası)

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put CRON_SECRET
npx wrangler secret put APP_URL
# ... diğer env
npm run deploy
```
