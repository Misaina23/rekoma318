import express from 'express'
import { listMembers, listMembersPublic, createMember, updateMember, deleteMember } from '../controllers/memberController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/public', listMembersPublic)
router.get('/', requirePermission('members.view'), listMembers)
router.post('/', requirePermission('members.create'), createMember)
router.put('/:id', requirePermission('members.edit'), updateMember)
router.delete('/:id', requirePermission('members.delete'), deleteMember)

export default router
