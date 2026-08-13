import express from 'express'
import { createStripePaymentIntent, stripeWebhook } from '../controllers/stripeController.js'

const router = express.Router()

router.post('/checkout', createStripePaymentIntent)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

export default router
