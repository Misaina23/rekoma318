import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function apply() {
  const sql = [
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false',
    'ALTER TABLE "TwoFactorToken" ADD COLUMN IF NOT EXISTS "email" VARCHAR(200) NOT NULL DEFAULT \'\'',
    'ALTER TABLE "TwoFactorToken" ADD COLUMN IF NOT EXISTS "sessionId" VARCHAR(200)',
    'ALTER TABLE "TwoFactorToken" ADD COLUMN IF NOT EXISTS "codeHash" VARCHAR(200) NOT NULL DEFAULT \'\'',
    'ALTER TABLE "TwoFactorToken" DROP COLUMN IF EXISTS "code"',
    'CREATE INDEX IF NOT EXISTS "TwoFactorToken_sessionId_idx" ON "TwoFactorToken"("sessionId")',
    'CREATE INDEX IF NOT EXISTS "TwoFactorToken_email_idx" ON "TwoFactorToken"("email")',
    `CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "id" VARCHAR(200) NOT NULL,
      "userId" VARCHAR(200) NOT NULL,
      "email" VARCHAR(200) NOT NULL,
      "tokenHash" VARCHAR(200) NOT NULL,
      "expiresAt" TIMESTAMPTZ(6) NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("id")
    )`,
    'CREATE INDEX IF NOT EXISTS "PasswordReset_tokenHash_idx" ON "PasswordReset"("tokenHash")',
    'CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId")',
    'ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
  ]

  for (const s of sql) {
    try {
      await prisma.$executeRawUnsafe(s)
      console.log('OK:', s.slice(0, 80))
    } catch (e) {
      console.error('ERR:', s.slice(0, 80), e.message)
    }
  }

  await prisma.$disconnect()
}

apply().catch(e => { console.error(e); process.exit(1) })
