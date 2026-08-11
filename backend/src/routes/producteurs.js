import express from 'express'
import { listProducteurs, createProducteur, getProducteur, updateProducteur, deleteProducteur } from '../controllers/producteurController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import validate from '../middleware/validate.js'
import { createProducteurSchema, updateProducteurSchema } from '../validation/producteur.js'

const router = express.Router()

router.get('/', listProducteurs)
router.post('/', requireAuth, validate(createProducteurSchema), createProducteur)
router.get('/:id', getProducteur)
router.put('/:id', requireAuth, validate(updateProducteurSchema), updateProducteur)
router.delete('/:id', requireAuth, deleteProducteur)

export default router
