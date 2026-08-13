import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })

export async function createStripeCheckout(req, res) {
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/don?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/don`,
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: description || 'Don à REKOMA' },
            unit_amount: Math.round(Number(amount) || 0),
          },
          quantity: 1,
        },
      ],
      metadata: { donationId: donation.id },
    })
    await prisma.donation.update({ where: { id: donation.id }, data: { providerRef: session.id } })
    res.json({ success: true, id: donation.id, checkoutUrl: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ success: false, error: 'Impossible de créer la session de paiement' })
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

  const session = event.data.object
  const donationId = session.metadata?.donationId
  if (!donationId) return res.json({ received: true })

  if (event.type === 'checkout.session.completed') {
    await prisma.donation.update({ where: { id: donationId }, data: { status: 'validated', providerRef: session.payment_intent } })
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    await prisma.donation.update({ where: { id: donationId }, data: { status: 'refused' } })
  }

  res.json({ received: true })
}
