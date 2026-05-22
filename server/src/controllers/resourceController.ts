import { PrismaClient } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

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
    const resource = await prisma.resource.findUnique({
      where: {
        id: request.params.id,
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
