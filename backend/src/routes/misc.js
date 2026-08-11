import express from 'express'
import { postMessage, postVisit, notifyAdminLogin, createDonation } from '../controllers/miscController.js'

const router = express.Router()

router.post('/messages', postMessage)
router.post('/visits', postVisit)
router.post('/notify-admin-login', notifyAdminLogin)
router.post('/don/create', createDonation)

export default router
