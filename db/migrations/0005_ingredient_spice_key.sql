-- Acılı malzemeler: seçilince acılık seviyesi otomatik ayarlanır (PickleSpiceOption.key).
ALTER TABLE "PickleIngredient" ADD COLUMN "spiceKey" TEXT;
