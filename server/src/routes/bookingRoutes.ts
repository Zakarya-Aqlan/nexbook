import { Router } from 'express'

import {
  cancelBookingById,
  createBooking,
  getBookings,
  updateBookingById,
} from '../controllers/bookingController'

export const bookingRoutes = Router()

bookingRoutes.get('/', getBookings)
bookingRoutes.post('/', createBooking)
bookingRoutes.put('/:id', updateBookingById)
bookingRoutes.patch('/:id/cancel', cancelBookingById)
