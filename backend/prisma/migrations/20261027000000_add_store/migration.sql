CREATE TABLE "StoreProduct" (
  "id" VARCHAR(200) NOT NULL,
  "slug" VARCHAR(200) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "price" INTEGER NOT NULL,
  "imageUrl" TEXT,
  "sizes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreProduct_slug_key" ON "StoreProduct"("slug");
CREATE INDEX "StoreProduct_published_active_idx" ON "StoreProduct"("published", "active");

CREATE TABLE "StoreOrder" (
  "id" VARCHAR(200) NOT NULL,
  "customerName" VARCHAR(200) NOT NULL,
  "phone" VARCHAR(40) NOT NULL,
  "city" VARCHAR(200) NOT NULL,
  "deliveryType" VARCHAR(20) NOT NULL,
  "address" TEXT,
  "note" TEXT,
  "items" JSONB NOT NULL,
  "total" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreOrder_status_createdAt_idx" ON "StoreOrder"("status", "createdAt");

INSERT INTO "StoreProduct" ("id", "slug", "name", "description", "price", "imageUrl")
VALUES
  ('store-teddy', 'blouson-teddy', 'Blouson Teddy REKOMA', 'Blouson aux couleurs de REKOMA.', 60000, '/ARTICLE/BLOUSON TEDDY 2.jpg'),
  ('store-polo', 'polo-rekoma', 'Polo REKOMA', 'Polo aux couleurs de REKOMA.', 35000, '/ARTICLE/POLO.jpg'),
  ('store-tee', 'tee-shirt-rekoma', 'Tee-shirt REKOMA', 'Tee-shirt classique aux couleurs de REKOMA.', 25000, '/ARTICLE/TEE SHIRT.jpg'),
  ('store-oversize', 'tee-shirt-oversize', 'Tee-shirt oversize REKOMA', 'Coupe oversize aux couleurs de REKOMA.', 45000, '/ARTICLE/TEE SHRT 2.jpg'),
  ('store-doudoune', 'doudoune-rekoma', 'Doudoune sans manche REKOMA', 'Doudoune sans manche aux couleurs de REKOMA.', 45000, '/ARTICLE/DOUDONE SANS MANCHE.jpg'),
  ('store-cap', 'casquette-rekoma', 'Casquette REKOMA', 'Casquette aux couleurs de REKOMA.', 15000, '/ARTICLE/CASQUETTE.jpg'),
  ('store-salova', 'salova-rekoma', 'Salova', 'Tenue traditionnelle malagasy.', 30000, '/ARTICLE/tenu tradutionnel malagasy, SALOVA.jpg'),
  ('store-tank', 'debardeur-rekoma', 'Débardeur REKOMA', 'Débardeur aux couleurs de REKOMA.', 25000, '/ARTICLE/DEBARDEUR.jpg')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Permission" ("id", "key", "label", "category", "createdAt", "updatedAt")
VALUES
  ('perm-manage-products', 'manage_products', 'Gérer les articles', 'store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-manage-orders', 'manage_orders', 'Gérer les commandes', 'store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT 'rp-store-' || role."name" || '-' || permission."key", role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE
  (role."name" IN ('super_admin', 'admin', 'manager') AND permission."key" IN ('manage_products', 'manage_orders'))
  OR (role."name" = 'editor' AND permission."key" = 'manage_products')
  OR (role."name" = 'finance_lead' AND permission."key" = 'manage_orders')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
