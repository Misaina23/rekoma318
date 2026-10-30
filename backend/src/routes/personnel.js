import express from 'express'
import {
  listPersonnel,
  personnelStats,
  createStaff,
  updateStaff,
  deleteStaff,
  addStaffContract,
} from '../controllers/personnelController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', requirePermission('manage_personnel'), listPersonnel)
router.get('/stats', requirePermission('manage_personnel'), personnelStats)
router.post('/', requirePermission('manage_personnel'), createStaff)
router.put('/:id', requirePermission('manage_personnel'), updateStaff)
router.patch('/:id', requirePermission('manage_personnel'), updateStaff)
router.delete('/:id', requirePermission('manage_personnel'), deleteStaff)
router.post('/:id/contracts', requirePermission('manage_personnel'), addStaffContract)

export default router
