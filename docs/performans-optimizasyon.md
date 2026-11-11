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

### 2. Hero / logo kaynak görselleri

**Nerede:** `public/images/hero/` (ör. `hero-gift-boxes.jpg` ~874KB, `hero-salgam.jpg` ~754KB), kategori/ürün JPEG’leri ~500–825KB; `src/components/storefront/logo.tsx` (`kaplan-badge-logo.jpg` ~482KB, `priority`)

**Sorun:** Kaynak dosyalar ağır. `next/image` ve CF Images yardımcı olsa da LCP’yi kaynak boyutu belirler.

**Yön:** WebP/AVIF üretimi, uygun boyutlar, logo için daha küçük varyant.

**Etki:** Yüksek

---

### 3. R2 yükleme ve görsel pipeline

**Nerede:** `src/app/(admin)/admin/yukle/route.ts`, `src/shared/media/image-url.ts` (`resizeImageUrl`), `next.config.ts` (`images.remotePatterns`)

**Sorun:** Admin yüklemede yeniden boyutlandırma yok (orijinal, max 5MB). `resizeImageUrl` kullanılmıyor. R2 `*.r2.dev` için remote pattern eksik olabilir; PLP/PDP büyük orijinallere dayanabilir.

**Yön:** Yüklemede resize / CF Image Resizing; remotePatterns; kart ve detay için `sizes` + doğru URL’ler.

**Etki:** Yüksek

---

### 4. Vitrin client JS (`motion`)

**Nerede:** `src/app/(storefront)/layout.tsx` (`MotionProvider`), `product-grid.tsx`, `header-nav.tsx`, `cart-count.tsx`, `mobile-nav.tsx`, ürün detay bileşenleri, builder adımları

**Sorun:** `motion/react` birçok yüzeye yayılmış; repoda `next/dynamic` kullanımı yok.

**Yön:** Kritik olmayan animasyonları lazy yükle; motion’ı daha küçük client sınırlarına indir.

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
- Asıl boşluklar: kaynak dosya boyutu, R2 pipeline, PLP sorgu modeli, motion’un geniş client sınırı.
- Önerilen uygulama sırası: **1 → 2 → 3 → 4**, ardından 5–6.
