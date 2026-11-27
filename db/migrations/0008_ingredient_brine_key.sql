-- Renk veren malzemeler: seçilince salamura (su rengi) otomatik ayarlanır (PickleBrineOption.key).
ALTER TABLE "PickleIngredient" ADD COLUMN "brineKey" TEXT;
