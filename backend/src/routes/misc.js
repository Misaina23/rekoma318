import express from 'express'
import { postMessage, listMessagesGrouped, updateMessage, deleteMessage, replyMessage, postVisit, notifyAdminLogin } from '../controllers/miscController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/messages', postMessage)
router.get('/messages', requirePermission('manage_messages'), listMessagesGrouped)
router.patch('/messages/:id', requirePermission('manage_messages'), updateMessage)
router.delete('/messages/:id', requirePermission('manage_messages'), deleteMessage)
router.post('/messages/:id/reply', requirePermission('manage_messages'), replyMessage)

router.post('/visits', postVisit)
router.post('/notify-admin-login', notifyAdminLogin)

export default router
