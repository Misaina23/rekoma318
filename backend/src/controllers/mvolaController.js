import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

const MVOLA_BASE = process.env.MVOLA_BASE_URL || 'https://api.mvola.mg'
const MVOLA_API_KEY = process.env.MVOLA_API_KEY || ''
const MVOLA_API_SECRET = process.env.MVOLA_API_SECRET || ''
const MVOLA_MERCHANT_ID = process.env.MVOLA_MERCHANT_ID || ''
const MVOLA_MERCHANT_PIN = process.env.MVOLA_MERCHANT_PIN || ''
const MVOLA_DEFAULT_RECEIVER = process.env.MVOLA_DEFAULT_RECEIVER || '+261345332429'

function basicAuth() {
  return Buffer.from(`${MVOLA_API_KEY}:${MVOLA_API_SECRET}`).toString('base64')
}

async function mvolaRequest(path, method, body) {
  const res = await fetch(`${MVOLA_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth()}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } } catch { return { status: res.status, data: text } }
}

export async function requestMvolaPayment(req, res) {
  const { donor, email, phone, amount, reference, description } = req.body || {}
  if (!amount || !phone) return res.status(400).json({ success: false, error: 'Montant et téléphone requis' })

  const donation = await prisma.donation.create({
    data: {
      donor: String(donor || 'Anonyme').slice(0, 120),
      email: String(email || '').slice(0, 200),
      phone: String(phone).slice(0, 40),
      amount: Number(amount) || 0,
      method: 'mvola',
      status: 'pending',
      providerRef: reference || crypto.randomUUID(),
    },
  })

  const ref = donation.providerRef
  const payload = {
    amount: Number(amount),
    currency: 'MGA',
    description: description || 'Don REKOMA',
    from: { partyIdType: 'MSISDN', partyId: String(phone).replace(/\D/g, '') },
    to: { partyIdType: 'MSISDN', partyId: MVOLA_DEFAULT_RECEIVER.replace(/\D/g, '') },
    transactionReference: ref,
    requestDate: new Date().toISOString(),
  }

  try {
    const result = await mvolaRequest('/mvpg-cons/consumer/v1.0/transfer/amount', 'POST', payload)
    if (result.status >= 400) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: 'refused', providerRef: ref } })
      return res.status(400).json({ success: false, error: 'MVola a rejeté la demande', details: result.data })
    }
    await prisma.donation.update({ where: { id: donation.id }, data: { status: 'pending', providerRef: ref } })
    res.json({ success: true, id: donation.id, reference: ref, next: { provider: 'mvola', instruction: 'Saisissez le code sur votre téléphone pour confirmer le paiement.' } })
  } catch (err) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: 'pending', providerRef: ref } })
    res.json({ success: true, id: donation.id, reference: ref, next: { provider: 'mvola', instruction: 'Initiation envoyée. Confirmez sur votre téléphone.' } })
  }
}

export async function mvolaStatus(req, res) {
  const { reference } = req.body || {}
  if (!reference) return res.status(400).json({ success: false, error: 'Référence requise' })
  const donation = await prisma.donation.findFirst({ where: { providerRef: reference } })
  if (!donation) return res.status(404).json({ success: false, error: 'Don introuvable' })
  res.json({ success: true, status: donation.status, donation })
}

export async function mvolaCallback(req, res) {
  const { reference, status, transactionId } = req.body || {}
  if (!reference) return res.status(400).json({ success: false })
  const donation = await prisma.donation.findFirst({ where: { providerRef: reference } })
  if (!donation) return res.status(404).json({ success: false })
  const newStatus = status === 'SUCCESSFUL' ? 'validated' : status === 'FAILED' ? 'refused' : 'pending'
  await prisma.donation.update({ where: { id: donation.id }, data: { status: newStatus, providerRef: transactionId || reference } })
  res.json({ success: true })
}
