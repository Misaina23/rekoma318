# 📋 PROPOSITIONS DE MODIFICATIONS - schema.prisma & Migration 5

## PHASE 0 - Audit Complet APPROUVÉ ✅

Ce document détaille les modifications recommandées pour le fichier `backend/prisma/schema.prisma` et la migration 5 correspondante.

---

## MODIFICATION 1️⃣ : Ajouter Soft-Delete aux Modèles Sensibles

### Avant (Ligne ~20 - User)
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         String   @default("viewer")
  permissions  Json?
  active       Boolean  @default(true)
  lastLoginAt  DateTime? @db.Timestamptz(6)
  memberId     String?  @unique
  member       Member?  @relation(fields: [memberId], references: [id])
  name         String?
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  refreshTokens RefreshToken[]
  twoFactorTokens TwoFactorToken[]
}
```

### Après (Ajouter soft-delete + préparer RBAC)
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  name         String?
  active       Boolean  @default(true)
  lastLoginAt  DateTime? @db.Timestamptz(6)
  memberId     String?  @unique
  member       Member?  @relation(fields: [memberId], references: [id])
  
  // RBAC (future)
  roles        UserRole[]
  permissions  UserPermission[]
  
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  deletedAt    DateTime? @db.Timestamptz(6)
  
  refreshTokens RefreshToken[]
  twoFactorTokens TwoFactorToken[]
  
  @@index([email])
  @@index([memberId])
}
```

### Actions de Migration SQL
- ❌ REMOVE `role` column
- ❌ REMOVE `permissions` column (replace par UserRole + UserPermission)
- ✅ ADD `deletedAt TIMESTAMPTZ(6) NULL`
- ✅ CREATE INDEX `User_email_idx`
- ✅ CREATE INDEX `User_memberId_idx`

---

## MODIFICATION 2️⃣ : Standardiser Timestamps CMS/Formation

### Avant (Inconsistent)
```prisma
model News {
  id        String   @id @default(cuid())
  date      DateTime @default(now())  // ← TIMESTAMP(3) pas de timezone
  titleFr   String
  // ...
}
```

### Après (Consistent)
```prisma
model News {
  id        String   @id @default(cuid())
  date      DateTime @default(now()) @db.Timestamptz(6)  // ← Avec timezone
  titleFr   String
  // ...
}
```

**Modèles affectés :** News, Document, GalleryEvent, Activity, Formation, Beneficiary.createdAt

**Migration SQL :** Alter column types
```sql
ALTER TABLE "News" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "Document" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
-- etc.
```

---

## MODIFICATION 3️⃣ : Ajouter Soft-Delete à Beneficiary & Producteur

### Beneficiary
```prisma
model Beneficiary {
  id           String     @id @default(cuid())
  name         String
  category     String
  formation    Formation? @relation(fields: [formationId], references: [id])
  formationId  String?
  contact      String?
  
  createdAt    DateTime   @default(now()) @db.Timestamptz(6)  // Updated type
  deletedAt    DateTime?  @db.Timestamptz(6)
  
  @@index([category])
}
```

### Producteur
```prisma
model Producteur {
  id          String   @id @default(cuid())
  nom         String
  description String?
  actif       Boolean  @default(true)
  
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  deletedAt   DateTime? @db.Timestamptz(6)
}
```

---

## MODIFICATION 4️⃣ : Ajouter Indices Manquants

### À ajouter au Member
```prisma
model Member {
  // ... existing ...
  
  @@index([status])
  @@index([displayOrder])
}
```

---

## MODIFICATION 5️⃣ : Ajouter RBAC Tables (N:N Relationships)

### Nouvelles tables à insérer APRÈS User

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String?
  description String?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  
  permissions RolePermission[]
  users       UserRole[]
  
  @@index([name])
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String?
  description String?
  resource    String   // ex: "members", "documents", "donations"
  action      String   // ex: "view", "create", "update", "delete"
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  
  roles       RolePermission[]
  userOverrides UserPermission[]
  
  @@unique([resource, action])
  @@index([resource])
}

model RolePermission {
  roleId       String
  permissionId String
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  
  role        Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission  Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@id([roleId, permissionId])
  @@index([permissionId])
}

model UserRole {
  userId String
  roleId String
  assignedAt DateTime @default(now()) @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@id([userId, roleId])
  @@index([roleId])
}

model UserPermission {
  userId       String
  permissionId String
  granted      Boolean  @default(true)
  assignedAt   DateTime @default(now()) @db.Timestamptz(6)
  
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@id([userId, permissionId])
  @@index([permissionId])
}
```

---

## FICHIER: Migration SQL 5

### `backend/prisma/migrations/20260813090000_audit_fixes_rbac/migration.sql`

```sql
-- ================================
-- PHASE 0 AUDIT FIXES
-- Soft-Delete, Timestamps, Indices, RBAC Foundation
-- ================================

-- ================================
-- 1. Soft-Delete Columns (User, Beneficiary, Producteur)
-- ================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
ALTER TABLE "Producteur" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);

-- ================================
-- 2. Add Missing Indexes (Performance)
-- ================================

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_memberId_idx" ON "User"("memberId");
CREATE INDEX IF NOT EXISTS "Member_status_idx" ON "Member"("status");
CREATE INDEX IF NOT EXISTS "Member_displayOrder_idx" ON "Member"("displayOrder");

-- ================================
-- 3. Standardize Timestamps (TIMESTAMP(3) → TIMESTAMPTZ(6))
-- ================================

ALTER TABLE "News" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "Document" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "GalleryEvent" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "Activity" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "Formation" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
ALTER TABLE "Beneficiary" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6);

-- ================================
-- 4. RBAC Tables (Roles, Permissions, Relationships)
-- ================================

-- Create Role table
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    "label" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Role_name_idx" ON "Role"("name");

-- Create Permission table
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    "label" TEXT,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Permission_resource_action_key" UNIQUE ("resource", "action")
);

CREATE INDEX IF NOT EXISTS "Permission_resource_idx" ON "Permission"("resource");

-- Create RolePermission junction table
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- Create UserRole junction table
CREATE TABLE IF NOT EXISTS "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserRole_roleId_idx" ON "UserRole"("roleId");

-- Create UserPermission table (individual overrides)
CREATE TABLE IF NOT EXISTS "UserPermission" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId", "permissionId"),
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- ================================
-- 5. Seed Initial Roles (Optional but Recommended)
-- ================================

INSERT INTO "Role" (id, name, label, description) 
VALUES 
    (gen_random_uuid()::text, 'super_admin', 'Super Administrateur', 'Accès complet à tous les modules'),
    (gen_random_uuid()::text, 'admin', 'Administrateur', 'Gestion complète sauf rôles'),
    (gen_random_uuid()::text, 'manager', 'Gestionnaire', 'Gestion modulaire sauf utilisateurs'),
    (gen_random_uuid()::text, 'editor', 'Éditeur', 'Gestion CMS (News, Documents, Galerie)'),
    (gen_random_uuid()::text, 'formation_lead', 'Responsable Formation', 'Gestion formations et bénéficiaires'),
    (gen_random_uuid()::text, 'finance_lead', 'Responsable Finance', 'Gestion dons et finances'),
    (gen_random_uuid()::text, 'communication_lead', 'Responsable Communication', 'Gestion News, Messages, Galerie'),
    (gen_random_uuid()::text, 'viewer', 'Observateur', 'Consultation en lecture seule')
ON CONFLICT DO NOTHING;
```

---

## 📋 RÉSUMÉ MODIFICATIONS

| # | Type | Modification | Impact | Status |
|----|----|----|----|----|
| 1 | Schema | Remove `User.role`, `User.permissions` (migrate to RBAC) | 🔴 Breaking | Nécessite migration data User |
| 2 | Schema | Add `User.deletedAt`, `Beneficiary.deletedAt`, `Producteur.deletedAt` | 🟢 Safe | Additive |
| 3 | Schema | Add `User.roles`, `User.permissions` (RBAC relations) | 🟢 Safe | Additive |
| 4 | Schema | Standardize timestamps (TIMESTAMP(3) → TIMESTAMPTZ(6)) | 🟡 Data-safe | Type conversion |
| 5 | Schema | Add indices (User.email, User.memberId, Member.status, Member.displayOrder) | 🟢 Safe | Performance |
| 6 | Schema | Add Role, Permission, RolePermission, UserRole, UserPermission tables | 🟢 Safe | Additive |
| 7 | Migration | Execute SQL migration 5 | ⏳ Pending | À générer avec `prisma migrate dev` |

---

## 🔄 PROCHAINES ÉTAPES

### Étape 1 : Validation Audit ✅ (VOUS ÊTES ICI)
- [ ] Vérifier rapport audit complet : `AUDIT_PHASE0_DATABASE_PRISMA_MIGRATIONS.md`
- [ ] Approuver / Suggérer modifications

### Étape 2 : Appliquer Schema Changes
```bash
cd backend
# 1. Update schema.prisma avec les 5 modifications ci-dessus
# 2. Générer migration
npx prisma migrate dev --name audit_fixes_rbac
# 3. Vérifier la migration SQL générée
# 4. Pousser à la prod
npx prisma migrate deploy
```

### Étape 3 : Data Migration (User.role → UserRole)
- Migration de données : rattacher les rôles existants (admin, editor, viewer) aux nouvelles tables Role/UserRole
- Script: `backend/prisma/data-migrations/migrate_user_roles.ts`

### Étape 4 : Refactor Backend API (PHASE 1+)
- Middlewares de permissions utilisant les nouvelles tables RBAC
- Controllers utilisant `resolvePermissions(user)` depuis RBAC

### Étape 5 : Refactor Frontend (Admin → Permissions)
- Interface attribution rôles/permissions
- Masquage UI basé sur RBAC

---

## ❓ QUESTIONS POUR VALIDATION

1. **RBAC Data Migration :** Faut-il migrer les rôles actuels (admin/editor/viewer) vers les nouvelles tables Role/UserRole, ou repartir d'une ardoise blanche ?
   - Option A : Migration conserve rôles existants (backward compatible)
   - Option B : Ardoise blanche (recommandé pour clarté)

2. **User.memberId :** Faut-il rendre strictement obligatoire (NOT NULL) que tous les dashboards users aient un Member lié ? Ou garder flexible ?
   - Option A : Flexible (nullable) → Permet standalone API users
   - Option B : Strict (NOT NULL) → Liaison 1:1 User ↔ Member

3. **Permissions Granulaires :** Approuver les 11 capabilities proposés (view_dashboard, manage_members, manage_activities, etc.) ou adapter ?

