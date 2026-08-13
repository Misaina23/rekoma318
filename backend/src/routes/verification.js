import express from 'express'
import { request2FA, verify2FA, resend2FA, requestEmailVerification, confirmEmailVerification } from '../controllers/verificationController.js'

const router = express.Router()

router.post('/2fa/request', request2FA)
router.post('/2fa/verify', verify2FA)
router.post('/2fa/resend', resend2FA)
router.post('/verify-email/request', requestEmailVerification)
router.post('/verify-email/confirm', confirmEmailVerification)

export default router
