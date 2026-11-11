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

### 5. Ürün detay (PDP) tek büyük client ada

**Nerede:** `src/components/product/product-view.tsx` (+ gallery, options, purchase, accordions)

**Sorun:** Galeri + seçenekler + sepete ekle + akordeon tek `"use client"` sınırında; statik başlık/SEO HTML’i de hydrate oluyor.

**Yön:** Sunucu bileşenlerine ayır; yalnızca etkileşimli parçaları client yap.

**Etki:** Orta–yüksek

---

### 6. Header shell API yenilemesi

**Nerede:** `src/components/storefront/site-header.tsx`, `src/components/storefront/storefront-shell.tsx`, `/api/storefront/shell`

**Sorun:** Her `pathname` değişimi ve `window.focus`’ta shell API tekrar çekiliyor (sepet / oturum / wishlist). Sticky header + `backdrop-blur` ek maliyet.

**Yön:** Daha seyrek yenileme, cache, veya event tabanlı güncelleme; gereksiz focus refetch’i kaldır.

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

### 11. HTML / katalog önbelleği

**Nerede:** `next.config.ts` (`cacheComponents`), `src/config/cache-policy.ts`, `src/modules/catalog/cached.ts`, `src/modules/content/cached.ts`, settings `unstable_cache`

**Sorun:** Edge HTML TTL kısa (ör. s-maxage 60); süreç içi TTL; OpenNext’te `revalidateTag` güvenilirliği sınırlı. Anonim hit oranı düşük kalabilir → Worker/D1 tekrarları.

**Yön:** Güvenli tag invalidation stratejisi; anonim sayfalar için daha uzun edge cache (içerik değişince purge).

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
- Yüksek öncelikli 1–4 tamamlandı. Sonraki: **5 → 6**, sonra orta maddeler.
- `resizeImageUrl` r2.dev’de no-op; custom CDN + `CF_IMAGE_RESIZING=true` gerekir. CF `IMAGES` binding zaten `/_next/image` için var.
