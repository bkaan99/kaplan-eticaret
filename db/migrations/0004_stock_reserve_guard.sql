-- Rezervasyon artarken stok yetersizse (veya varyant pasifse) işlemi geri alır.
-- D1'de interaktif transaction yok; sipariş, ödeme, kalemler ve stok rezervasyonu tek batch'te
-- yazılır ve bu kural hepsini birlikte iptal eder (kısmi rezervasyon / sızıntı kalmaz).
-- Yalnızca `reservedQuantity` ARTARKEN çalışır: yönetici stok düzenlemeleri ve iptaller etkilenmez.
CREATE TRIGGER "ProductVariant_reserve_guard"
BEFORE UPDATE OF "reservedQuantity" ON "ProductVariant"
WHEN NEW."reservedQuantity" > OLD."reservedQuantity"
  AND (NEW."reservedQuantity" > NEW."stockQuantity" OR NEW."isActive" = 0)
BEGIN
  SELECT RAISE(ABORT, 'STOK_YETERSIZ');
END;
