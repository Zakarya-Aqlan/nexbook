import type { NextFunction, Request, Response } from 'express'

import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function getResources(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    response.json({ data: resources })
  } catch (error) {
    next(error)
  }
}

export async function getResourceById(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const resourceId = getRouteId(request)
    const resource = await prisma.resource.findUnique({
      where: {
        id: resourceId,
      },
    })

    if (!resource) {
      throw new AppError(404, 'Resource not found')
    }

    response.json({ data: resource })
  } catch (error) {
    next(error)
  }
}

function getRouteId(request: Request) {
  const { id } = request.params

  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'A valid resource id is required.')
  }

  return id
}
