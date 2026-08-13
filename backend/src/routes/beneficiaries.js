import express from 'express'
import { listBeneficiaries, beneficiaryStats, createBeneficiary, updateBeneficiary, deleteBeneficiary } from '../controllers/beneficiaryController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/stats', requirePermission('manage_beneficiaries'), beneficiaryStats)
router.get('/', requirePermission('manage_beneficiaries'), listBeneficiaries)
router.post('/', requirePermission('manage_beneficiaries'), createBeneficiary)
router.put('/:id', requirePermission('manage_beneficiaries'), updateBeneficiary)
router.delete('/:id', requirePermission('manage_beneficiaries'), deleteBeneficiary)

export default router
