-- Malzeme Stok ve Mevsimsellik Takibi
ALTER TABLE "PickleIngredient" ADD COLUMN "stockKg" DECIMAL;
ALTER TABLE "PickleIngredient" ADD COLUMN "minStockKg" DECIMAL;
ALTER TABLE "PickleIngredient" ADD COLUMN "seasonStartMonth" INTEGER;
ALTER TABLE "PickleIngredient" ADD COLUMN "seasonEndMonth" INTEGER;
