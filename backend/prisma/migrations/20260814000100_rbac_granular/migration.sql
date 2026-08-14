ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" VARCHAR(200);
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE IF NOT EXISTS "Role" (
  "id" VARCHAR(200) NOT NULL,
  "name" VARCHAR(200) NOT NULL UNIQUE,
  "label" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Permission" (
  "id" VARCHAR(200) NOT NULL,
  "key" VARCHAR(200) NOT NULL UNIQUE,
  "label" VARCHAR(200) NOT NULL,
  "category" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" VARCHAR(200) NOT NULL,
  "roleId" VARCHAR(200) NOT NULL,
  "permissionId" VARCHAR(200) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX IF NOT EXISTS "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE IF NOT EXISTS "UserPermission" (
  "id" VARCHAR(200) NOT NULL,
  "userId" VARCHAR(200) NOT NULL,
  "permissionId" VARCHAR(200) NOT NULL,
  "mode" VARCHAR(200) NOT NULL DEFAULT 'add',
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permissionId_mode_key" ON "UserPermission"("userId", "permissionId", "mode");
CREATE INDEX IF NOT EXISTS "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX IF NOT EXISTS "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
