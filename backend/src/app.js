import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import createError from 'http-errors'
import 'express-async-errors'

import authRoutes from './routes/auth.js'
import producteursRoutes from './routes/producteurs.js'
import cmsRoutes from './routes/cms.js'
import miscRoutes from './routes/misc.js'
import membersRoutes from './routes/members.js'
import beneficiariesRoutes from './routes/beneficiaries.js'
import donationsRoutes from './routes/donations.js'
import verificationRoutes from './routes/verification.js'
import usersRoutes from './routes/users.js'
import mvolaRoutes from './routes/mvola.js'
import stripeRoutes from './routes/stripe.js'
import rolesRoutes from './routes/roles.js'
import storeRoutes from './routes/store.js'

const app = express()

function isAllowedOrigin(origin) {
  if (!origin) return true
  const normalized = origin.replace(/\/+$/, '')
  const configured = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  if (
    normalized === 'http://localhost:3000' ||
    normalized === 'http://127.0.0.1:3000' ||
    configured.includes(normalized) ||
    normalized.endsWith('.vercel.app') ||
    normalized.endsWith('.run.app')
  ) {
    return true
  }
  return false
}

app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) {
        cb(null, true)
      } else {
        cb(new Error('CORS: origin not allowed'))
      }
    },
    credentials: true,
  }),
)
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/producteurs', producteursRoutes)
app.use('/api/cms', cmsRoutes)
app.use('/api', miscRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/beneficiaries', beneficiariesRoutes)
app.use('/api/donations', donationsRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/mvola', mvolaRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/store', storeRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.get('/api/cors-debug', (req, res) => res.json({ origin: req.headers.origin || 'no-origin' }))

// 404
app.use((req, res, next) => next(createError(404)))

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500
  const payload = { success: false, error: err.message || 'Internal Server Error' }
  if (err.details) payload.details = err.details
  if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack
  res.status(status).json(payload)
})

export default app
