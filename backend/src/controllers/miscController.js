import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(process.cwd(), 'backend', 'data')
const messagesFile = path.join(dataDir, 'messages.json')
const visitsFile = path.join(dataDir, 'visits.json')

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) }

export function postMessage(req, res) {
  const { name, email, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ success: false, error: 'Invalid payload' })
  ensureDir()
  const items = fs.existsSync(messagesFile) ? JSON.parse(fs.readFileSync(messagesFile, 'utf8')) : []
  items.push({ id: String(Date.now()), name, email, message, createdAt: new Date().toISOString() })
  fs.writeFileSync(messagesFile, JSON.stringify(items, null, 2))
  res.json({ success: true })
}

export function postVisit(req, res) {
  ensureDir()
  let data = { count: 0 }
  if (fs.existsSync(visitsFile)) data = JSON.parse(fs.readFileSync(visitsFile, 'utf8'))
  data.count = (data.count || 0) + 1
  fs.writeFileSync(visitsFile, JSON.stringify(data, null, 2))
  res.json({ success: true, count: data.count })
}

export function notifyAdminLogin(req, res) {
  // simple log for now
  console.log('Admin login notify:', req.body)
  res.json({ success: true })
}

export function createDonation(req, res) {
  try {
    const { donor, email, phone, amount, method } = req.body || {}
    if (!donor || !email || !amount || !['stripe', 'mvola'].includes(method)) return res.status(400).json({ success: false, error: 'Invalid donation payload' })
    ensureDir()
    const donationsFile = path.join(dataDir, 'donations.json')
    const list = fs.existsSync(donationsFile) ? JSON.parse(fs.readFileSync(donationsFile, 'utf8')) : []
    const donation = { id: String(Date.now()), donor, email, phone, amount: Number(amount), method, status: 'pending', createdAt: new Date().toISOString() }
    list.unshift(donation)
    fs.writeFileSync(donationsFile, JSON.stringify(list, null, 2))

    // For MVola: return an instruction (frontend should follow flow)
    if (method === 'mvola') {
      // Real integration would create a payment request with MVola API and return details
      return res.json({ success: true, id: donation.id, next: { provider: 'mvola', instruction: 'Dial *#123# and confirm payment with code 1234 (demo)' } })
    }

    // For Stripe: create a checkout session (server-side). Here we stub.
    if (method === 'stripe') {
      // In production: use Stripe SDK to create a session and return session.url
      return res.json({ success: true, id: donation.id, next: { provider: 'stripe', url: process.env.STRIPE_DONATION_URL ?? 'https://example.com/stripe-checkout' } })
    }

    return res.json({ success: true, id: donation.id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}
