import { Router } from 'express'

import {
  getActivities,
  importActivityHistory,
} from '../controllers/activityController'

export const activityRoutes = Router()

activityRoutes.get('/', getActivities)
activityRoutes.post('/import', importActivityHistory)
