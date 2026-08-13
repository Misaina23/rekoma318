import express from 'express'
import { listDonations, createDonation, updateDonation, deleteDonation } from '../controllers/donationController.js'
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', listDonations)
router.post('/', createDonation)
router.put('/:id', requirePermission('manage_donations'), updateDonation)
router.delete('/:id', requirePermission('manage_donations'), deleteDonation)

export default router
