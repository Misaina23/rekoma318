import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import createError from 'http-errors'
import 'express-async-errors'

import authRoutes from './routes/auth.js'
import producteursRoutes from './routes/producteurs.js'
import cmsRoutes from './routes/cms.js'
import miscRoutes from './routes/misc.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
)
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/producteurs', producteursRoutes)
app.use('/api/cms', cmsRoutes)
app.use('/api', miscRoutes)

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
