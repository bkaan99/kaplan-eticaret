# Performans optimizasyon fırsatları

Vitrin ve yönetim paneli için pratik performans denetimi özeti.  
Öncelik: **yüksek → orta → düşük**. En çok kazanç genelde 1–4 arasındadır.

---

## Yüksek öncelik

### 1. Ürün listesi / arama sorgusu (PLP) — yapıldı

**Nerede:** `src/modules/catalog/catalog.repository.ts`, `src/db/schema/catalog.ts`, `db/migrations/0005_catalog_listing_indexes.sql`, `src/modules/catalog/catalog.service.ts` (`list` / `searchQuick`), `src/components/storefront/search-actions.ts`

**Yapılan:** Sıralama, fiyat filtresi ve sayfalama SQL’e alındı (`LIMIT`/`OFFSET` + `COUNT`). Navbar canlı araması facet’siz `searchQuick` kullanıyor. Sonrasında bileşik `Product` / `ProductVariant` indeksleri (`0005_catalog_listing_indexes.sql`), sayfa-1 paralel sayım+ID sorgusu ve fiyat sınırı olmayan sıralamalarda gereksiz varyant `COUNT` join’inin kaldırılması eklendi.

**Etki:** Yüksek

---

### 2. Hero / logo kaynak görselleri — yapıldı

**Nerede:** `public/images/**`, `logo.tsx`, `hero-slider.tsx`

**Yapılan:** Büyük JPEG’ler yeniden boyutlandırılıp sıkıştırıldı; hot-path WebP’ye alındı (`scripts/optimize-public-images.mjs`). Logo ~482KB → ~14KB WebP.

**Etki:** Yüksek

---

### 3. R2 yükleme ve görsel pipeline — yapıldı

**Nerede:** `prepare-image-upload.ts` / `upload-image.ts`, `next.config.ts` (`remotePatterns`), `resizeImageUrl` (kart/PDP)

**Yapılan:** Admin yüklemede istemci tarafı max 2000px WebP; R2 `remotePatterns`; `resizeImageUrl` kart (600) / detay (1200) için bağlandı (`CF_IMAGE_RESIZING === "true"` + custom domain kontrolü ile aktif, `<Image unoptimized={isCdnResizedImageUrl(...)}>` sayesinde `/_next/image` çift proxy önlendi).

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

### 9. Ürün kartı mikro-adaları — yapıldı

**Nerede:** `src/components/storefront/product-grid.tsx`, `src/components/storefront/product-grid-interactions.tsx`, `src/components/storefront/product-card.tsx`

**Yapılan:** Kart başına `QuickAddButton` + `WishlistButton` client adaları kaldırıldı; `ProductCard` tamamen sunucu bileşeni olarak `data-*` düğmelerini basıyor. Tüm grid etkileşimleri (olay delegasyonu ile hızlı ekleme + tek `useSyncExternalStore` favori senkronizasyonu) tek `ProductGridInteractions` istemci sarmalayıcısında toplandı (`WishlistButton` yalnızca PDP içinde kullanılıyor).

**Etki:** Orta

---

### 10. Kök layout fontları — yapıldı

**Nerede:** `src/app/layout.tsx`, `src/app/(storefront)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`, `src/app/globals.css`, `src/components/storefront/mobile-nav.tsx`

**Yapılan:** Dört font ailesi kök layout’tan çıkarıldı. Vitrin (`Montserrat`, `Fraunces`) ve admin (`Geist`, `Geist_Mono`) fontları kendi grup layout’larına ayrıldı; `Fraunces` için kullanılmayan `SOFT`/`opsz` değişken eksenleri ve `Geist_Mono` için `latin-ext` ön yüklemesi kaldırıldı (`Montserrat`, `Fraunces` ve `Geist` için Türkçe glifler nedeniyle `latin-ext` korundu). Vitrin portalları (`MobileNav`) ve mono fallback’ler uyarlandı.

**Etki:** Orta (vitrin ön yüklemesi ~404 KB → `169.9 KB`, admin ~404 KB → `67.3 KB`)

---

### 11. HTML / katalog önbelleği — yapıldı

**Nerede:** `src/config/cache-policy.ts`, `proxy.ts`, `shared/cache/registry.ts`, `settings/cached.ts`, `modules/admin/action.ts`

**Yapılan:** Anonim HTML `s-maxage=300` + SWR 1 saat; süreç TTL 3 dk (admin’de invalidate); settings cache 5 dk; admin yazılarında `revalidatePath("/", "layout")`, sepet/hızlı ekle/tekrar sipariş mutasyonlarında yalnızca `revalidate: ["/sepet"]`.

**Etki:** Orta

**Not (edge bayatlık):** Admin’de ürün/kategori değişince sunucu önbelleği hemen temizlenir. Edge’deki HTML kopyası ise `workers.dev` üzerinde purge edilemediği için en fazla ~5 dk (`s-maxage`) eski kalabilir; süre dolunca SWR ile taze sayfa çekilir. Özel alan adı + Cloudflare Cache Purge API bağlanınca admin yazısında edge de anında düşürülebilir. Katalog seyrek değişen mağaza için bilinçli trade-off (daha yüksek anonim hit, daha az Worker/D1).

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
- Yüksek 1–4 ve madde 5–6, 9–11 tamamlandı. Kalan orta: **7–8**, düşük: **12**.
- `resizeImageUrl` r2.dev’de no-op; custom CDN + `CF_IMAGE_RESIZING=true` gerekir. CF `IMAGES` binding zaten `/_next/image` için var.
- Madde 11: edge HTML bayatlığı ve purge kısıtı için yukarıdaki **Not (edge bayatlık)** maddesine bakın.
