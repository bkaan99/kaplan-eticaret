-- Katalog listeleme, sıralama, öne çıkan/benzer ürün ve aktif varyant sorguları için bileşik indeksler
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx"
  ON "Product"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_status_isFeatured_createdAt_idx"
  ON "Product"("status", "isFeatured", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_status_categoryId_createdAt_idx"
  ON "Product"("status", "categoryId", "createdAt");

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_price_idx"
  ON "ProductVariant"("productId", "isActive", "price");
