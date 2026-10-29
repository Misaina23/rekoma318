import express from 'express'
import {
  createOrder,
  createProduct,
  deleteProduct,
  listOrders,
  listProducts,
  listProductsForAdmin,
  updateOrder,
  updateProduct,
} from '../controllers/storeController.js'
import { requirePermission } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/rateLimiter.js'

const router = express.Router()

router.get('/products', listProducts)
router.get('/products/manage', requirePermission('manage_products'), listProductsForAdmin)
router.post('/products', requirePermission('manage_products'), createProduct)
router.patch('/products/:id', requirePermission('manage_products'), updateProduct)
router.delete('/products/:id', requirePermission('manage_products'), deleteProduct)
router.post('/orders', (req, res, next) => {
  const phone = String(req.body?.phone || '').replace(/\D/g, '')
  const limit = rateLimit(phone ? `store-order:${phone}` : `store-order-ip:${req.ip}`)
  if (!limit.allowed) return res.status(429).json({ success: false, error: 'Trop de demandes. Réessayez dans une minute.' })
  return next()
}, createOrder)
router.get('/orders', requirePermission('manage_orders'), listOrders)
router.patch('/orders/:id', requirePermission('manage_orders'), updateOrder)

export default router
