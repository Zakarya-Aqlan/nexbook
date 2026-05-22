import type { NextFunction, Request, Response } from 'express'

import {
  cancelBooking,
  createBookingWithValidation,
  getAllBookings,
  updateBookingWithValidation,
} from '../services/bookingService'

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
    const booking = await updateBookingWithValidation(
      request.params.id,
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
    const booking = await cancelBooking(request.params.id)

    response.json({ data: booking })
  } catch (error) {
    next(error)
  }
}
