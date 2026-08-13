import express from 'express'
import { requestMvolaPayment, mvolaStatus, mvolaCallback } from '../controllers/mvolaController.js'

const router = express.Router()

router.post('/request', requestMvolaPayment)
router.post('/status', mvolaStatus)
router.post('/callback', mvolaCallback)

export default router
