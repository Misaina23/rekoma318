import express from 'express'
import {
  postMessage,
  listMessagesGrouped,
  updateMessage,
  deleteMessage,
  replyMessage,
  postVisit,
  getVisits,
  notifyAdminLogin,
  publicStats,
  dashboardStats,
} from '../controllers/miscController.js'
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/messages', postMessage)
router.get('/messages', requirePermission('manage_messages'), listMessagesGrouped)
router.patch('/messages/:id', requirePermission('manage_messages'), updateMessage)
router.delete('/messages/:id', requirePermission('manage_messages'), deleteMessage)
router.post('/messages/:id/reply', requirePermission('manage_messages'), replyMessage)

router.post('/visits', postVisit)
router.get('/visits', getVisits)
router.get('/stats/public', publicStats)
router.get('/stats/dashboard', requireAuth, dashboardStats)
router.post('/notify-admin-login', notifyAdminLogin)

export default router
