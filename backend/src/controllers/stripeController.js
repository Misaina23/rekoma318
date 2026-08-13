import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })

export async function createStripePaymentIntent(req, res) {
  const { donor, email, phone, amount, description } = req.body || {}
  if (!amount || !email) return res.status(400).json({ success: false, error: 'Montant et email requis' })

  const donation = await prisma.donation.create({
    data: {
      donor: String(donor || 'Anonyme').slice(0, 120),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 40) : null,
      amount: Number(amount) || 0,
      method: 'stripe',
      status: 'pending',
    },
  })

  try {
    const amountInCents = Math.round(Number(amount) || 0)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: email,
      description: description || 'Don à REKOMA',
      metadata: { donationId: donation.id },
    })

    await prisma.donation.update({ where: { id: donation.id }, data: { providerRef: paymentIntent.id } })
    res.json({ success: true, id: donation.id, clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Stripe payment intent error:', err)
    res.status(500).json({ success: false, error: 'Impossible de créer le paiement' })
  }
}

export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return res.status(400).json({ received: false })
  }

  const paymentIntent = event.data.object
  const donationId = paymentIntent.metadata?.donationId
  if (!donationId) return res.json({ received: true })

  if (event.type === 'payment_intent.succeeded') {
    await prisma.donation.update({ where: { id: donationId }, data: { status: 'validated', providerRef: paymentIntent.id } })
  } else if (event.type === 'payment_intent.payment_failed') {
    await prisma.donation.update({ where: { id: donationId }, data: { status: 'refused' } })
  }

  res.json({ received: true })
}
