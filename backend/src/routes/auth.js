import express from 'express'
import { login, refreshToken, logout, me, register, forgotPassword } from '../controllers/authController.js'
import validate from '../middleware/validate.js'
import { loginSchema, registerSchema, forgotPasswordSchema } from '../validation/auth.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.get('/me', me)

export default router
