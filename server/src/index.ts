import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { AppError, errorHandler } from './middleware/errorHandler'
import { activityRoutes } from './routes/activityRoutes'
import { bookingRoutes } from './routes/bookingRoutes'
import { resourceRoutes } from './routes/resourceRoutes'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors())
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

app.listen(port, () => {
  console.log(`NexBook API is running on http://localhost:${port}`)
})
