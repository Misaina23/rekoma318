import express from 'express'
import { createStripeCheckout, stripeWebhook } from '../controllers/stripeController.js'

const router = express.Router()

router.post('/checkout', createStripeCheckout)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

export default router
