UPDATE "StoreProduct"
SET "imageUrl" = '/ARTICLE/CASQUETTE.jpg'
WHERE "slug" = 'casquette-rekoma'
  AND "imageUrl" IS DISTINCT FROM '/ARTICLE/CASQUETTE.jpg';
