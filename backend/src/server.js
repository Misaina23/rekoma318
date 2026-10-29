import 'dotenv/config'
import http from 'http'
import os from 'os'
import app from './app.js'
import { verifySMTP } from './utils/mail.js'
import { prisma } from './lib/prisma.js'

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

async function ensureDatabaseColumns() {
  const statements = [
    'ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "designation" TEXT',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "description" TEXT',
    'ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 999',
    'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
    'ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(6)',
  ]
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (e) {
      console.warn('[boot] Schema check warning:', e.message)
    }
  }
}

async function boot() {
  await ensureDatabaseColumns()

  try {
    const smtp = await verifySMTP()
    if (smtp.success) {
      console.log('[boot] SMTP connection OK')
    } else {
      console.warn('[boot] SMTP connection failed:', smtp.error)
    }
  } catch (e) {
    console.warn('[boot] SMTP check error:', e.message)
  }

  const server = http.createServer(app)
  server.listen(PORT, HOST, () => {
    console.log(`Server listening on:`)
    console.log(`  Local:   http://0.0.0.0:${PORT}`)
    for (const ip of lanAddresses()) {
      console.log(`  Network: http://${ip}:${PORT}`)
    }
  })

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason)
  })

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
    process.exit(1)
  })
}

function lanAddresses() {
  const interfaces = os.networkInterfaces()
  const addresses = []
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address)
      }
    }
  }
  return addresses
}

boot().catch(e => {
  console.error('Boot failed:', e)
  process.exit(1)
})
