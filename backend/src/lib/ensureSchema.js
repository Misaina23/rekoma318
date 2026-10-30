import { prisma } from './prisma.js'

let schemaEnsured = false

export async function ensureRelationalSchema() {
  if (schemaEnsured) return
  schemaEnsured = true

  const statements = [
    // Legacy soft-delete & metadata columns
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "email" TEXT',
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "fokontany" TEXT',
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "household_size" INTEGER',
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "notes" TEXT',
    'ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 30',
    'ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "trainer_staff_id" TEXT',
    'ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "responsible_staff_id" TEXT',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "designation" TEXT',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "description" TEXT',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 999',
    'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',

    // Personnel table
    `CREATE TABLE IF NOT EXISTS "personnel" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "matricule" TEXT NOT NULL UNIQUE,
      "prenom" TEXT NOT NULL,
      "nom" TEXT NOT NULL,
      "cin" TEXT UNIQUE,
      "sexe" TEXT NOT NULL DEFAULT 'M',
      "date_naissance" TIMESTAMP(3),
      "telephone" TEXT,
      "email" TEXT,
      "adresse" TEXT,
      "poste" TEXT NOT NULL,
      "departement" TEXT NOT NULL DEFAULT 'Coordination PDIMA',
      "date_embauche" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "statut" TEXT NOT NULL DEFAULT 'active',
      "note_suivi" DOUBLE PRECISION,
      "suivi_professionnel" TEXT,
      "member_id" TEXT UNIQUE REFERENCES "Member"("id") ON DELETE SET NULL,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMPTZ(6)
    )`,
    'CREATE INDEX IF NOT EXISTS "personnel_departement_idx" ON "personnel"("departement")',
    'CREATE INDEX IF NOT EXISTS "personnel_statut_idx" ON "personnel"("statut")',

    // EmploymentContract table
    `CREATE TABLE IF NOT EXISTS "contrat_personnel" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "personnel_id" TEXT NOT NULL REFERENCES "personnel"("id") ON DELETE CASCADE,
      "type_contrat" TEXT NOT NULL DEFAULT 'CDD',
      "date_debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "date_fin" TIMESTAMP(3),
      "salaire_mensuel" INTEGER NOT NULL DEFAULT 0,
      "lieu_affectation" TEXT,
      "statut" TEXT NOT NULL DEFAULT 'active',
      "notes" TEXT,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "contrat_personnel_personnel_id_idx" ON "contrat_personnel"("personnel_id")',
    'CREATE INDEX IF NOT EXISTS "contrat_personnel_statut_idx" ON "contrat_personnel"("statut")',

    // Pivot table Formation <-> Beneficiary (formation_beneficiaire)
    `CREATE TABLE IF NOT EXISTS "formation_beneficiaire" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "formation_id" TEXT NOT NULL REFERENCES "Formation"("id") ON DELETE CASCADE,
      "beneficiaire_id" TEXT NOT NULL REFERENCES "Beneficiary"("id") ON DELETE CASCADE,
      "statut_presence" TEXT NOT NULL DEFAULT 'enrolled',
      "note_evaluation" DOUBLE PRECISION,
      "attestation_delivree" BOOLEAN NOT NULL DEFAULT false,
      "notes" TEXT,
      "date_inscription" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "formation_beneficiaire_unique" UNIQUE ("formation_id", "beneficiaire_id")
    )`,
    'CREATE INDEX IF NOT EXISTS "formation_beneficiaire_formation_id_idx" ON "formation_beneficiaire"("formation_id")',
    'CREATE INDEX IF NOT EXISTS "formation_beneficiaire_beneficiaire_id_idx" ON "formation_beneficiaire"("beneficiaire_id")',

    // Pivot table Activity <-> Beneficiary (activite_beneficiaire)
    `CREATE TABLE IF NOT EXISTS "activite_beneficiaire" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "activite_id" TEXT NOT NULL REFERENCES "Activity"("id") ON DELETE CASCADE,
      "beneficiaire_id" TEXT NOT NULL REFERENCES "Beneficiary"("id") ON DELETE CASCADE,
      "role" TEXT DEFAULT 'participant',
      "present" BOOLEAN NOT NULL DEFAULT true,
      "notes" TEXT,
      "date_participation" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "activite_beneficiaire_unique" UNIQUE ("activite_id", "beneficiaire_id")
    )`,
    'CREATE INDEX IF NOT EXISTS "activite_beneficiaire_activite_id_idx" ON "activite_beneficiaire"("activite_id")',
    'CREATE INDEX IF NOT EXISTS "activite_beneficiaire_beneficiaire_id_idx" ON "activite_beneficiaire"("beneficiaire_id")',

    // Site visits & connections tracking
    `CREATE TABLE IF NOT EXISTS "site_visits" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "day" TEXT NOT NULL,
      "path" TEXT NOT NULL DEFAULT '/',
      "visitor_hash" TEXT,
      "is_admin" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "site_visits_day_idx" ON "site_visits"("day")',
    'CREATE INDEX IF NOT EXISTS "site_visits_path_idx" ON "site_visits"("path")',

    // Migrate any pre-existing Beneficiary.formationId rows into pivot table formation_beneficiaire
    `DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Beneficiary' AND column_name = 'formationId'
      ) THEN
        INSERT INTO "formation_beneficiaire" ("id", "formation_id", "beneficiaire_id", "statut_presence")
        SELECT
          'mig_' || b."id" || '_' || b."formationId",
          b."formationId",
          b."id",
          CASE WHEN b."attendance" IS NOT NULL AND b."attendance" <> '' THEN 'present' ELSE 'enrolled' END
        FROM "Beneficiary" b
        INNER JOIN "Formation" f ON f."id" = b."formationId"
        WHERE b."formationId" IS NOT NULL
        ON CONFLICT ("formation_id", "beneficiaire_id") DO NOTHING;
      END IF;
    END $$`,
  ]

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (e) {
      schemaEnsured = false
      console.warn('[schema] DDL warning:', e.message)
    }
  }
}
