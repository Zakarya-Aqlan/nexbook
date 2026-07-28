import type { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  statusCode: number
  details?: string[]

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const isAppError = error instanceof AppError
  const statusCode = isAppError ? error.statusCode : 500
  const details = isAppError ? error.details : undefined

  if (!isAppError) {
    console.error('Unhandled server error:', error)
  }

  response.status(statusCode).json({
    error: {
      message: isAppError
        ? error.message
        : 'Something went wrong on the server.',
      ...(details ? { details } : {}),
    },
  })
}
