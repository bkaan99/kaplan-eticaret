-- Hukuki sayfalardaki sabit "500 TL" ifadesi dinamik yer tutucuya çevrilir.
-- Sayfa gösterilirken Ayarlar'daki güncel ücretsiz kargo eşiğiyle doldurulur.
UPDATE "Page"
SET "content" = REPLACE("content", '500 TL', '{{ucretsiz_kargo_esigi}}')
WHERE "slug" IN (
  'sikca-sorulan-sorular',
  'mesafeli-satis-sozlesmesi',
  'on-bilgilendirme-formu',
  'teslimat-ve-kargo'
);
