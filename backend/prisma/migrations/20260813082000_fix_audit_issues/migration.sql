-- Drop unused enum
DROP TYPE IF EXISTS "UserRole";

-- Soft delete columns
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6);

-- TwoFactorToken foreign key
ALTER TABLE "TwoFactorToken" DROP CONSTRAINT IF EXISTS "TwoFactorToken_userId_fkey";
ALTER TABLE "TwoFactorToken" ADD CONSTRAINT "TwoFactorToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "TwoFactorToken_userId_idx" ON "TwoFactorToken"("userId");
CREATE INDEX IF NOT EXISTS "TwoFactorToken_code_idx" ON "TwoFactorToken"("code");
CREATE INDEX IF NOT EXISTS "EmailVerification_token_idx" ON "EmailVerification"("token");
CREATE INDEX IF NOT EXISTS "Donation_status_idx" ON "Donation"("status");
CREATE INDEX IF NOT EXISTS "Donation_createdAt_idx" ON "Donation"("createdAt");
CREATE INDEX IF NOT EXISTS "Message_email_idx" ON "Message"("email");
CREATE INDEX IF NOT EXISTS "Beneficiary_category_idx" ON "Beneficiary"("category");

-- Data migration: normalize existing USER roles to viewer
UPDATE "User" SET "role" = 'viewer' WHERE "role" = 'USER';
