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
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const statusCode = error instanceof AppError ? error.statusCode : 500
  const details = error instanceof AppError ? error.details : undefined

  response.status(statusCode).json({
    error: {
      message:
        statusCode === 500 ? 'Something went wrong on the server.' : error.message,
      ...(details ? { details } : {}),
    },
  })
}
