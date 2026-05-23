import type { NextFunction, Request, Response } from 'express'

import {
  cancelBooking,
  createBookingWithValidation,
  getAllBookings,
  updateBookingWithValidation,
} from '../services/bookingService'
import { AppError } from '../middleware/errorHandler'

export async function getBookings(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const bookings = await getAllBookings()

    response.json({ data: bookings })
  } catch (error) {
    next(error)
  }
}

export async function createBooking(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const booking = await createBookingWithValidation(request.body)

    response.status(201).json({ data: booking })
  } catch (error) {
    next(error)
  }
}

export async function updateBookingById(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const bookingId = getRouteId(request)
    const booking = await updateBookingWithValidation(
      bookingId,
      request.body,
    )

    response.json({ data: booking })
  } catch (error) {
    next(error)
  }
}

export async function cancelBookingById(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const bookingId = getRouteId(request)
    const booking = await cancelBooking(bookingId)

    response.json({ data: booking })
  } catch (error) {
    next(error)
  }
}

function getRouteId(request: Request) {
  const { id } = request.params

  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'A valid booking id is required.')
  }

  return id
}
