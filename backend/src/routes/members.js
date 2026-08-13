import express from 'express'
import { listMembers, listMembersPublic, createMember, updateMember, deleteMember } from '../controllers/memberController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/public', listMembersPublic)
router.get('/', requirePermission('manage_members'), listMembers)
router.post('/', requirePermission('manage_members'), createMember)
router.put('/:id', requirePermission('manage_members'), updateMember)
router.delete('/:id', requirePermission('manage_members'), deleteMember)

export default router
