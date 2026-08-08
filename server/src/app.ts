import 'dotenv/config'

import cors, { type CorsOptions } from 'cors'
import express from 'express'

import { AppError, errorHandler } from './middleware/errorHandler'
import { activityRoutes } from './routes/activityRoutes'
import { bookingRoutes } from './routes/bookingRoutes'
import { resourceRoutes } from './routes/resourceRoutes'

const app = express()
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)
const corsOptions: CorsOptions =
  allowedOrigins.length === 0
    ? {}
    : {
        origin(origin, callback) {
          const normalizedRequestOrigin = origin
            ? normalizeOrigin(origin)
            : ''

          callback(
            null,
            !origin || allowedOrigins.includes(normalizedRequestOrigin),
          )
        },
      }

app.use(cors(corsOptions))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'nexbook-api',
  })
})

app.use('/api/resources', resourceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/activities', activityRoutes)

app.use((_request, _response, next) => {
  next(new AppError(404, 'Route not found'))
})

app.use(errorHandler)

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '')
}

export default app
