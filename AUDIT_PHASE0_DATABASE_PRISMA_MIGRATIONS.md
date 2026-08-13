# 🔍 PHASE 0 : AUDIT STRUCTUREL COMPLET
## Database, Prisma Schema & Migrations - REKOMA Application

**Date de l'audit :** 2026-08-13  
**Status du schema.prisma :** ✅ **VALID** (validé via `npx prisma validate`)  
**Status de la base PostgreSQL :** ✅ **SYNCED** (16 modèles introspectés avec succès)  
**Host production :** `dpg-d9pehenlk1mc73dustlg-a.frankfurt-postgres.render.com` (Render.com)  

---

## 📋 SECTION 0.1 : AUDIT DES MIGRATIONS ET DE LA BASE POSTGRESQL

### A. Chaîne Complète des Migrations

| # | Migration ID | Date | Description | Status |
|----|----|----|----|----|
| 1 | `00000000000000_init` | (initiale) | Création des tables User, Producteur, RefreshToken | ✅ Applied |
| 2 | `20260812235649_add_admin_models` | 2026-08-12 23:56:49 | Création de 13 modèles (Message, News, Document, Formation, Member, Donation, Beneficiary, etc.) | ✅ Applied |
| 3 | `20260813082000_fix_audit_issues` | 2026-08-13 08:20:00 | Ajout soft-delete (`deletedAt`) et indexes | ✅ Applied |
| 4 | `20260813083000_add_soft_delete_cms` | 2026-08-13 08:30:00 | Soft-delete CMS (News, Document, GalleryEvent, Activity, Formation) | ✅ Applied |

**Résultat :** Toutes les migrations ont été appliquées avec succès à la base de données PostgreSQL en production.

### B. Validation de la Cohérence Migration ↔ Schema.prisma ↔ Database

| Modèle | Primary Key | Type | Migration Historique | DB Status | Schema Status |
|--------|--------|--------|--------|--------|--------|
| User | `id` (CUID) | ✅ Correct | Init + altered in migration 2 | ✅ Present | ✅ Defined |
| Producteur | `id` (CUID) | ✅ Correct | Init | ✅ Present | ✅ Defined |
| RefreshToken | `id` (CUID) | ✅ Correct | Init + FK fixed in migration 3 | ✅ Present | ✅ Defined |
| Message | `id` (CUID) | ✅ Correct | Migration 2 | ✅ Present | ✅ Defined |
| Reply | `id` (CUID) | ✅ Correct | Migration 2 | ✅ Present | ✅ Defined |
| News | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 4 | ✅ Present | ✅ Defined |
| Document | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 4 | ✅ Present | ✅ Defined |
| GalleryEvent | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 4 | ✅ Present | ✅ Defined |
| GalleryPhoto | `id` (CUID) | ✅ Correct | Migration 2 | ✅ Present | ✅ Defined |
| Activity | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 4 | ✅ Present | ✅ Defined |
| Formation | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 4 | ✅ Present | ✅ Defined |
| Member | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 3 | ✅ Present | ✅ Defined |
| Donation | `id` (CUID) | ✅ Correct | Migration 2 + soft-delete in migration 3 | ✅ Present | ✅ Defined |
| Beneficiary | `id` (CUID) | ✅ Correct | Migration 2 | ✅ Present | ✅ Defined |
| TwoFactorToken | `id` (CUID) | ✅ Correct | Migration 2 + FK fixed in migration 3 | ✅ Present | ✅ Defined |
| EmailVerification | `id` (CUID) | ✅ Correct | Migration 2 | ✅ Present | ✅ Defined |

**Conclusion 0.1 :** ✅ Toutes les migrations sont cohérentes, appliquées et alignées avec le schema.prisma.

---

## 🔗 SECTION 0.2 : AUDIT DES CLÉS PRIMAIRES, ÉTRANGÈRES & CARDINALITÉS

### A. Primary Keys (PK)
**Constat :** Toutes les PK utilisent le type `CUID` (Cryptographically Unique ID), cohérent et non dupliqué.

```
✅ User.id (CUID)
✅ Producteur.id (CUID)
✅ RefreshToken.id (CUID)
✅ Message.id (CUID)
✅ Reply.id (CUID)
✅ News.id (CUID)
✅ Document.id (CUID)
✅ GalleryEvent.id (CUID)
✅ GalleryPhoto.id (CUID)
✅ Activity.id (CUID)
✅ Formation.id (CUID)
✅ Member.id (CUID)
✅ Donation.id (CUID)
✅ Beneficiary.id (CUID)
✅ TwoFactorToken.id (CUID)
✅ EmailVerification.id (CUID)
```

### B. Foreign Keys (FK) & Cardinalités

#### 1:1 Relations (avec UNIQUE constraint)

| Relation | FK Column | References | Cardinalité | ON DELETE | ON UPDATE | Status |
|----------|-----------|-----------|----------|----------|----------|--------|
| User → Member | `User.memberId` | `Member.id` | 1:1 (UNIQUE) | SET NULL | CASCADE | ✅ Correct |
| EmailVerification → email | `email` (UNIQUE) | Pivot (email) | 1:1 | - | - | ✅ Correct |

**Observation :** Contrainte UNIQUE sur `User.memberId` présente et correcte.

#### 1:N Relations

| Relation | FK Column | References | Cardinalité | ON DELETE | ON UPDATE | Status |
|----------|-----------|-----------|----------|----------|----------|--------|
| User ← RefreshToken | `RefreshToken.userId` | `User.id` | 1:N | CASCADE | NoAction | ✅ Correct |
| User ← TwoFactorToken | `TwoFactorToken.userId` | `User.id` | 1:N | CASCADE | CASCADE | ✅ Correct |
| Message ← Reply | `Reply.messageId` | `Message.id` | 1:N | CASCADE | CASCADE | ✅ Correct |
| Formation ← Beneficiary | `Beneficiary.formationId` | `Formation.id` | 1:N | SET NULL | CASCADE | ✅ Correct |
| GalleryEvent ← GalleryPhoto | `GalleryPhoto.eventId` | `GalleryEvent.id` | 1:N | CASCADE | CASCADE | ✅ Correct |

**Observation :** Toutes les FK utilisent des `ON DELETE` et `ON UPDATE` cohérents.

#### N:N Relations (Discussion)
**Constat :** ⚠️ **AUCUNE table de liaison N:N detectée pour RBAC (Roles ↔ Permissions, Users ↔ Roles).**

État actuel :
- `User.role` : Stocké comme simple `String` (ex: `admin`, `editor`)
- `User.permissions` : Stocké comme `JSON` (array ou objet de permissions)
- Pas de table `Role`, `Permission`, `RolePermission`, `UserPermission`

**Risque :** Architecture fragile, permissions difficiles à auditer et gérer à grande échelle.

### C. Synthèse Cardinalités
✅ 1:1 relations : Bien définies avec UNIQUE constraints  
✅ 1:N relations : Toutes les FK présentes avec ON DELETE/UPDATE appropriés  
⚠️ N:N relations : MANQUANTES pour RBAC granulaire

---

## 🗑️ SECTION 0.3 : AUDIT DES POLITIQUES DE SUPPRESSION & STRATÉGIE `ON DELETE`

### A. Analyse par Entité

| Modèle | Soft Delete | Hard Delete FK Behavior | Sensibilité | Recommandation |
|--------|-----------|-----------|-----------|-----------|
| **User** | ❌ NON | - | 🔴 Critique | ⚠️ AJOUTER soft-delete (`deletedAt`) |
| **Member** | ✅ OUI (`deletedAt`) | - | 🟡 Moyenne | ✅ Correct |
| **Message** | ✅ OUI (`deletedAt`) | CASCADE (Reply) | 🟡 Moyenne | ✅ Correct |
| **Donation** | ✅ OUI (`deletedAt`) | - | 🔴 Critique (Finance) | ✅ Correct |
| **TwoFactorToken** | ❌ NON | CASCADE | 🟡 Moyenne | ✅ Tolérable (token temp) |
| **RefreshToken** | ❌ NON | CASCADE | 🟡 Moyenne | ✅ Tolérable (token temp) |
| **News** | ✅ OUI (`deletedAt`) | - | 🟢 Basse | ✅ Correct |
| **Document** | ✅ OUI (`deletedAt`) | - | 🟢 Basse | ✅ Correct |
| **GalleryEvent** | ✅ OUI (`deletedAt`) | CASCADE (GalleryPhoto) | 🟢 Basse | ✅ Correct |
| **Activity** | ✅ OUI (`deletedAt`) | - | 🟡 Moyenne | ✅ Correct |
| **Formation** | ✅ OUI (`deletedAt`) | SET NULL (Beneficiary) | 🟡 Moyenne | ✅ Correct |
| **Beneficiary** | ❌ NON | - | 🟡 Moyenne | ⚠️ AJOUTER soft-delete |

### B. Synthèse
| Aspect | Status | Détail |
|--------|--------|--------|
| **Soft-Delete Coverage** | ⚠️ 11/16 modèles | Manquent : User, Beneficiary, TwoFactorToken, RefreshToken, Producteur |
| **ON DELETE Cascade** | ✅ Cohérent | Utilisé uniquement pour enfants directs (Reply, GalleryPhoto, RefreshToken, TwoFactorToken) |
| **ON DELETE SET NULL** | ✅ Cohérent | Beneficiary.formationId, User.memberId |
| **Data Loss Risk** | 🔴 ÉLEVÉ | Suppression de User entraînerait perte de données (aucune soft-delete) |

### C. Recommandations Immédiates
1. ✅ **User :** AJOUTER `deletedAt DateTime? @db.Timestamptz(6)` pour audit trail et récupération
2. ✅ **Beneficiary :** AJOUTER `deletedAt DateTime?` (donnée statistique importante)
3. ✅ **Producteur :** AJOUTER `deletedAt DateTime?` (rarement supprimé mais peut être archivé)

---

## 📊 SECTION 0.4 : AUDIT DU MAPPING DES CHAMPS & TYPES

### A. Vérification Types PostgreSQL ↔ Prisma

#### Problèmes Detectés

| Modèle | Champ | Type Prisma | Type DB Migration | Alignment | Problème |
|--------|--------|--------|--------|--------|--------|
| News | `date` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Prisma utilise `@db.Timestamptz(6)` pour User/Donation, mais News utilise TIMESTAMP(3) sans timezone |
| Document | `date` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Même problème : pas de timezone |
| GalleryEvent | `date` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Inconsistant avec les autres modèles |
| Activity | `date` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Inconsistant |
| Formation | `date` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Inconsistant |
| Beneficiary | `createdAt` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Pas de timezone, inconsistant avec User/Message |
| TwoFactorToken | `expiresAt` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Critique pour expiration : besoin de timezone précise |
| EmailVerification | `expiresAt` | DateTime | TIMESTAMP(3) | ❌ **MISMATCH** | Critique pour expiration |
| Message | `email` | String | VARCHAR(200) | ✅ **OK** | Spécification explicite `@db.VarChar(200)` |

### B. Indices Manquants

| Modèle | Champ | Index | Priorité | Utilisation |
|--------|--------|--------|--------|--------|
| User | `email` | ❌ MISSING | 🔴 CRITIQUE | Recherche rapide lors login, inscription |
| User | `memberId` | ❌ MISSING | 🟡 ÉLEVÉE | Join User ↔ Member |
| Message | `email` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Regroupement messages par email (PIVOT) |
| Member | `status` | ❌ MISSING | 🟡 ÉLEVÉE | Filtrage members actifs (Gouvernance) |
| Member | `displayOrder` | ❌ MISSING | 🟡 ÉLEVÉE | Tri des membres pour affichage |
| Donation | `status` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Filtrage dons pending/completed |
| Donation | `createdAt` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Tri chronologique |
| TwoFactorToken | `userId` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Lookup tokens pour user |
| TwoFactorToken | `code` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Validation code OTP |
| EmailVerification | `token` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Vérification email unique + rapide |
| Beneficiary | `category` | ✅ Présent (migration 3) | 🟡 ÉLEVÉE | Filtrage par catégorie |

### C. Contraintes NOT NULL & Optionnelles

**Champs optionnels (NULL accepté) :**

| Modèle | Champ | Nullable | Justification | Recommandation |
|--------|--------|--------|--------|--------|
| User | `name` | ✅ NULL | Nom facultatif | ✅ OK |
| User | `lastLoginAt` | ✅ NULL | N'a jamais connecté | ✅ OK |
| User | `memberId` | ✅ NULL | User standalone possible | ⚠️ À définir (voir PHASE 2) |
| User | `permissions` | ✅ NULL | Pas d'override | ✅ OK |
| Member | `role` | ✅ NULL | Pas toujours défini | ⚠️ À standardiser |
| Member | `designation` | ✅ NULL | Facultatif | ✅ OK |
| Member | `description` | ✅ NULL | Facultatif | ✅ OK |
| Member | `address` | ✅ NULL | Facultatif | ✅ OK |
| Member | `phone` | ✅ NULL | Facultatif | ✅ OK |
| Member | `email` | ✅ NULL | Facultatif | ⚠️ À standardiser (recommandé @unique si fourni) |
| Member | `photo` | ✅ NULL | Facultatif | ✅ OK |
| Formation | `session` | ✅ NULL | Session optionnelle | ✅ OK |
| Beneficiary | `contact` | ✅ NULL | Contact facultatif | ✅ OK |
| Beneficiary | `formationId` | ✅ NULL | Bénéficiaire non lié | ✅ OK |

### D. Synthèse Mapping & Types

| Aspect | Status | Impact |
|--------|--------|--------|
| **Alignement Types** | ⚠️ PARTIEL | 5 modèles CMS/Formations utilisent TIMESTAMP(3) au lieu de TIMESTAMPTZ(6) |
| **Indices Performance** | 🟡 PARTIEL | 4 indices manquants sur colonnes critiques (User.email, User.memberId, etc.) |
| **Constraints** | ✅ OK | NOT NULL et UNIQUE bien placés ; soft-delete coverage 69% |
| **Cohérence Champs** | ✅ BON | Nommage cohérent (designation ≠ role ≠ function) |

---

## 🎯 RÉSUMÉ AUDIT PHASE 0 & RECOMMANDATIONS

### ✅ Points Forts
1. **Schéma syntaxiquement valide** : `npx prisma validate` réussi
2. **Migrations cohérentes** : 4 migrations appliquées sans erreur
3. **PK & FK bien structurées** : Cardinalités 1:1, 1:N correctes
4. **Soft-delete partiellement implémenté** : 11/16 modèles
5. **Indices critiques partiellement présents** : Migrations 3 ajoutent indexes pour auth & payments
6. **ON DELETE cohérent** : CASCADE et SET NULL utilisés judicieusement

### ⚠️ Problèmes & Recommandations Critiques

| # | Problème | Sévérité | Recommandation |
|----|---------|----------|--------|
| **P1** | **RBAC manquant** : Pas de tables Role, Permission, RolePermission | 🔴 CRITIQUE | **Migration 5** : Créer 4 tables + relations N:N |
| **P2** | **User sans soft-delete** | 🔴 CRITIQUE | **Migration 5** : AJOUTER `User.deletedAt` |
| **P3** | **Timestamp incohérent** : CMS/Formation utilisent TIMESTAMP(3) | 🟡 ÉLEVÉE | **Migration 5** : Standardiser à TIMESTAMPTZ(6) |
| **P4** | **Indices manquants** : User.email, User.memberId, Member.status | 🟡 ÉLEVÉE | **Migration 5** : AJOUTER 3 indices |
| **P5** | **Beneficiary sans soft-delete** | 🟡 ÉLEVÉE | **Migration 5** : AJOUTER `deletedAt` |
| **P6** | **Producteur sans soft-delete** | 🟡 MOYENNE | **Migration 5** : AJOUTER `deletedAt` |
| **P7** | **Member.email pas @unique** | 🟡 MOYENNE | **Considérer** pour future validation email unique |
| **P8** | **User.memberId nullable** | 🟡 MOYENNE | **PHASE 2** : Définir politique (stricte ou flexible) |

---

## 📝 PLAN D'ACTION : MIGRATION 5 À CRÉER

### Fichier : `backend/prisma/migrations/20260813090000_audit_fixes_rbac/migration.sql`

**Actions à effectuer (dans cet ordre) :**

1. **Soft-Delete User & Beneficiary & Producteur**
   ```sql
   ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
   ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
   ALTER TABLE "Producteur" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
   ```

2. **Indices Manquants**
   ```sql
   CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
   CREATE INDEX IF NOT EXISTS "User_memberId_idx" ON "User"("memberId");
   CREATE INDEX IF NOT EXISTS "Member_status_idx" ON "Member"("status");
   CREATE INDEX IF NOT EXISTS "Member_displayOrder_idx" ON "Member"("displayOrder");
   ```

3. **Standardiser Timestamps CMS/Formation** (TIMESTAMP(3) → TIMESTAMPTZ(6))
   ```sql
   ALTER TABLE "News" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
   ALTER TABLE "Document" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
   ALTER TABLE "GalleryEvent" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
   ALTER TABLE "Activity" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
   ALTER TABLE "Formation" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6);
   ALTER TABLE "Beneficiary" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6);
   ```

4. **Créer tables RBAC** (Role, Permission, RolePermission, UserPermission)
   ```sql
   -- Voir détail SECTION 0.5 ci-dessous
   ```

---

## 🛡️ SECTION 0.5 : ARCHITECTURE RBAC PROPOSÉE

### Modèles Prisma à Ajouter

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
  createdAt    DateTime @default(now())
  
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
  @@unique([userId, permissionId])
  @@index([permissionId])
}
```

### Modifications User

```prisma
model User {
  // ... existing fields ...
  
  // REMOVE: role String @default("viewer")
  // REMOVE: permissions Json?
  
  // ADD:
  deletedAt   DateTime?  @db.Timestamptz(6)  // Soft-delete
  roles       UserRole[]
  permissions UserPermission[]
}
```

---

## 📌 CONCLUSION PHASE 0

**Status Global :** ✅ **ACCEPTABLE avec corrections urgentes**

| Niveau | Status | Action |
|--------|--------|--------|
| **Migrations** | ✅ OK | Aucune correction rétroactive ; créer migration 5 |
| **Schéma Syntaxe** | ✅ OK | Pas de changement |
| **Clés & Relations** | ✅ OK | Ajouter tables RBAC (migration 5) |
| **Soft-Delete** | ⚠️ PARTIEL | Ajouter User, Beneficiary, Producteur (migration 5) |
| **Types & Indices** | ⚠️ PARTIEL | Standardiser timestamps + ajouter 4 indices (migration 5) |
| **Permissions** | 🔴 MANQUANT | Créer RBAC granulaire (migration 5 + refactor backend) |

**Prochaine étape :** Valider ce diagnostic, approuver les modifications Migration 5, puis procéder au refactoring des contrôleurs API (PHASE 1+).

