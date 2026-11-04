-- Gıda ürün bilgileri: içindekiler, alerjen uyarısı, raf ömrü
ALTER TABLE "Product" ADD COLUMN "ingredients" TEXT;
ALTER TABLE "Product" ADD COLUMN "allergens" TEXT;
ALTER TABLE "Product" ADD COLUMN "shelfLife" TEXT;
