import express from 'express'
import { listRoles, createRole, updateRole, deleteRole, listPermissions, listUserPermissions, updateUserPermissions } from '../controllers/roleController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/roles', requirePermission('manage_roles'), listRoles)
router.post('/roles', requirePermission('manage_roles'), createRole)
router.put('/roles/:id', requirePermission('manage_roles'), updateRole)
router.delete('/roles/:id', requirePermission('manage_roles'), deleteRole)
router.get('/permissions', requirePermission('manage_roles'), listPermissions)
router.get('/users/:userId/permissions', requirePermission('manage_roles'), listUserPermissions)
router.put('/users/:userId/permissions', requirePermission('manage_roles'), updateUserPermissions)

export default router
