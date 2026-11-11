# Performans optimizasyon fırsatları

Vitrin ve yönetim paneli için pratik performans denetimi özeti.  
Öncelik: **yüksek → orta → düşük**. En çok kazanç genelde 1–4 arasındadır.

---

## Yüksek öncelik

### 1. Ürün listesi / arama sorgusu (PLP) — yapıldı

**Nerede:** `src/modules/catalog/catalog.repository.ts` (`searchListingPage`), `src/modules/catalog/catalog.service.ts` (`list` / `searchQuick`), `src/components/storefront/search-actions.ts`

**Yapılan:** Sıralama, fiyat filtresi ve sayfalama SQL’e alındı (`LIMIT`/`OFFSET` + `COUNT`). Navbar canlı araması facet’siz `searchQuick` kullanıyor.

**Etki:** Yüksek

---

### 2. Hero / logo kaynak görselleri — yapıldı

**Nerede:** `public/images/**`, `logo.tsx`, `hero-slider.tsx`

**Yapılan:** Büyük JPEG’ler yeniden boyutlandırılıp sıkıştırıldı; hot-path WebP’ye alındı (`scripts/optimize-public-images.mjs`). Logo ~482KB → ~14KB WebP.

**Etki:** Yüksek

---

### 3. R2 yükleme ve görsel pipeline — yapıldı

**Nerede:** `prepare-image-upload.ts` / `upload-image.ts`, `next.config.ts` (`remotePatterns`), `resizeImageUrl` (kart/PDP)

**Yapılan:** Admin yüklemede istemci tarafı max 2000px WebP; R2 `remotePatterns`; `resizeImageUrl` kart (600) / detay (1200) için bağlandı (CF custom domain + `CF_IMAGE_RESIZING=true` ile aktif).

**Etki:** Yüksek

---

### 4. Vitrin client JS (`motion`) — yapıldı

**Nerede:** storefront layout, product-grid, header-nav, cart-count, mobile-nav, filter drawer

**Yapılan:** `MotionProvider` global layout’tan çıkarıldı; PLP/header/drawer CSS’e alındı. Motion yalnızca PDP (`ProductView`) ve builder’da yükleniyor.

**Etki:** Yüksek

---

## Orta–yüksek öncelik

### 5. Ürün detay (PDP) tek büyük client ada — yapıldı

**Nerede:** `product-view.tsx` (RSC), `product-interactive.tsx` (client), `product-accordions.tsx` (RSC)

**Yapılan:** `h1` / nitelik rozetleri / akordeon sunucuda; galeri + fiyat + seçenek + sepete ekle `ProductInteractive` client adasında. Slot composition ile SEO HTML hydrate edilmiyor.

**Etki:** Orta–yüksek

---

### 6. Header shell API yenilemesi — yapıldı

**Nerede:** `src/components/storefront/storefront-shell.tsx`, `/api/storefront/shell`

**Yapılan:** `pathname` ve `window.focus` refetch kaldırıldı. Yükleme: mount + `refreshStorefrontShell` olayları; sekme görünür olunca en fazla 30 sn’de bir.

**Etki:** Orta–yüksek

---

## Orta öncelik

### 7. Mobil sticky bar ve portal drawer’lar

**Nerede:** `product-purchase-actions.tsx`, sepet/ödeme sticky CTA’lar, `builder-bar.tsx`, `cookie-banner.tsx`, `whatsapp-button.tsx`, `mobile-nav.tsx`, `mobile-filter-drawer.tsx`

**Sorun:** Çok sayıda fixed katman + portal + `AnimatePresence`; mobilde scroll/tap (INP) gecikmesi riski.

**Yön:** Aynı anda görünür sticky sayısını azalt; animasyonları sadeleştir; z-index / paint maliyetini gözden geçir.

**Etki:** Orta

---

### 8. “Kendi Turşunu Yap” client bundle

**Nerede:** `src/app/(storefront)/kendi-tursunu-yap/builder.tsx` ve adım bileşenleri (`bidon`, `fly-to-bidon`, motion)

**Sorun:** Tüm adımlar tek client bundle; dynamic import yok.

**Yön:** Adım bazlı `dynamic()`; görünmeyen adımları lazy yükle.

**Etki:** Orta (bu route için yüksek)

---

### 9. Ürün kartı mikro-adaları

**Nerede:** `src/components/storefront/product-card.tsx` → `QuickAddButton`, `WishlistButton`

**Sorun:** Grid’de kart başına hydrate; wishlist store her kartta `useSyncExternalStore`.

**Yön:** Favori/hızlı eklemeyi tek parent store veya daha az client sınırına topla.

**Etki:** Orta

---

### 10. Kök layout fontları

**Nerede:** `src/app/layout.tsx` — Geist, Geist Mono, Montserrat, Fraunces (`latin-ext`, Fraunces axes)

**Sorun:** Vitrin ve admin aynı kök layout’ta dört font ailesi yüklüyor.

**Yön:** Vitrin / admin font yüklemesini ayır; kullanılmayan subset’leri daralt.

**Etki:** Orta

---

### 11. HTML / katalog önbelleği — yapıldı

**Nerede:** `src/config/cache-policy.ts`, `proxy.ts`, `shared/cache/registry.ts`, `settings/cached.ts`, `modules/admin/action.ts`

**Yapılan:** Anonim HTML `s-maxage=300` + SWR 1 saat; süreç TTL 3 dk (admin’de invalidate); settings cache 5 dk; her admin yazısında `revalidatePath("/", "layout")` (OpenNext incremental).

**Etki:** Orta

---

## Düşük–orta öncelik

### 12. Admin dashboard raporları

**Nerede:** `src/modules/reporting/reporting.repository.ts` (`periodTotals` / `revenueRows`)

**Sorun:** Dönemdeki sipariş satırları çekilip JS’te toplanıyor; hacim artınca admin TTFB büyür.

**Yön:** SQL aggregate (`SUM` / `GROUP BY`); gerekirse önceden hesaplanmış özet.

**Etki:** Düşük–orta

---

## Notlar

- Birçok yerde `sizes` / `priority` kullanımı zaten doğru (`product-card`, hero, gallery).
- Yüksek 1–4 ve madde 5–6 + 11 tamamlandı. Kalan orta: **7–10**, düşük: **12**.
- `resizeImageUrl` r2.dev’de no-op; custom CDN + `CF_IMAGE_RESIZING=true` gerekir. CF `IMAGES` binding zaten `/_next/image` için var.
