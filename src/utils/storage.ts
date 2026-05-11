import type { Booking } from '../types'

const BOOKINGS_KEY = 'nexbook-bookings'

export function getBookings(): Booking[] {
  const savedBookings = localStorage.getItem(BOOKINGS_KEY)

  if (!savedBookings) {
    return []
  }

  try {
    const bookings = JSON.parse(savedBookings)

    if (Array.isArray(bookings)) {
      return bookings
    }

    return []
  } catch {
    return []
  }
}

export function saveBookings(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
}

export function addBooking(booking: Booking) {
  const bookings = getBookings()
  saveBookings([...bookings, booking])
}

export function updateBooking(updatedBooking: Booking) {
  const bookings = getBookings()
  const updatedBookings = bookings.map((booking) =>
    booking.id === updatedBooking.id ? updatedBooking : booking,
  )

  saveBookings(updatedBookings)
}

export function cancelBooking(bookingId: string) {
  const bookings = getBookings()
  const updatedBookings: Booking[] = bookings.map((booking) =>
    booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking,
  )

  saveBookings(updatedBookings)
}
