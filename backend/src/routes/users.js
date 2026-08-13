import express from 'express'
import {
  listUsers,
  listMembersForUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from '../controllers/userController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', requirePermission('manage_roles'), listUsers)
router.get('/members', requirePermission('manage_roles'), listMembersForUser)
router.post('/', requirePermission('manage_roles'), createUser)
router.put('/:id', requirePermission('manage_roles'), updateUser)
router.post('/:id/reset-password', requirePermission('manage_roles'), resetPassword)
router.delete('/:id', requirePermission('manage_roles'), deleteUser)

export default router
