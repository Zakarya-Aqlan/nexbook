import type { NextFunction, Request, Response } from 'express'

import {
  ensureCompletedActivities,
  getAllActivities,
  importActivities,
} from '../services/activityService'

export async function getActivities(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    await ensureCompletedActivities()
    const activities = await getAllActivities()

    response.json({ data: activities })
  } catch (error) {
    next(error)
  }
}

export async function importActivityHistory(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const activities = await importActivities(request.body)

    response.json({ data: activities })
  } catch (error) {
    next(error)
  }
}
