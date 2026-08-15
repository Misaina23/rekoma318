-- Formation extension: add description, dates, location, trainer

ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMPTZ(6);
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMPTZ(6);
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "location" VARCHAR(200);
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "trainer" VARCHAR(200);
