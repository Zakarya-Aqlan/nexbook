import { Router } from 'express'

import {
  getResourceById,
  getResources,
} from '../controllers/resourceController'

export const resourceRoutes = Router()

resourceRoutes.get('/', getResources)
resourceRoutes.get('/:id', getResourceById)
