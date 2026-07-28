import type { Booking } from '../types'
import { addActivityItem } from './activityStorage'

const BOOKINGS_KEY = 'nexbook-bookings'
const BOOKING_SOURCES_KEY = 'nexbook-booking-sources'

export type BookingSource = 'backend' | 'local'

type BookingSourceRegistry = Record<string, BookingSource>

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

function getBookingSources(): BookingSourceRegistry {
  const savedSources = localStorage.getItem(BOOKING_SOURCES_KEY)

  if (!savedSources) {
    return {}
  }

  try {
    const parsedSources: unknown = JSON.parse(savedSources)

    if (!parsedSources || typeof parsedSources !== 'object') {
      return {}
    }

    return Object.entries(parsedSources).reduce<BookingSourceRegistry>(
      (sources, [bookingId, source]) => {
        if (source === 'backend' || source === 'local') {
          sources[bookingId] = source
        }

        return sources
      },
      {},
    )
  } catch {
    return {}
  }
}

function saveBookingSources(sources: BookingSourceRegistry) {
  localStorage.setItem(BOOKING_SOURCES_KEY, JSON.stringify(sources))
}

export function markBookingSource(
  bookingId: string,
  source: BookingSource,
) {
  const sources = getBookingSources()

  saveBookingSources({
    ...sources,
    [bookingId]: source,
  })
}

export function markBookingSources(
  bookingIds: string[],
  source: BookingSource,
) {
  const sources = getBookingSources()

  bookingIds.forEach((bookingId) => {
    sources[bookingId] = source
  })

  saveBookingSources(sources)
}

export function getBookingSource(bookingId: string): BookingSource {
  const source = getBookingSources()[bookingId]

  if (source) {
    return source
  }

  return bookingId.startsWith('booking-') ? 'local' : 'backend'
}

function upsertBooking(bookingToSave: Booking) {
  const bookings = getBookings()
  const hasExistingBooking = bookings.some(
    (booking) => booking.id === bookingToSave.id,
  )
  const updatedBookings = hasExistingBooking
    ? bookings.map((booking) =>
        booking.id === bookingToSave.id ? bookingToSave : booking,
      )
    : [...bookings, bookingToSave]

  saveBookings(updatedBookings)
}

export function mirrorBooking(booking: Booking) {
  upsertBooking(booking)

  return booking
}

export function addBooking(booking: Booking) {
  const bookings = getBookings()
  saveBookings([...bookings, booking])
  addActivityItem('booked', booking)
}

export function updateBooking(updatedBooking: Booking) {
  upsertBooking(updatedBooking)
  addActivityItem('updated', updatedBooking)
}

export function cancelBooking(bookingId: string) {
  const bookings = getBookings()
  const cancelledBooking = bookings.find((booking) => booking.id === bookingId)

  if (!cancelledBooking) {
    return null
  }

  const bookingToSave: Booking = {
    ...cancelledBooking,
    status: 'cancelled',
  }

  upsertBooking(bookingToSave)
  addActivityItem('cancelled', bookingToSave)

  return bookingToSave
}

export function mirrorCancelledBooking(cancelledBooking: Booking) {
  const bookingToSave: Booking = {
    ...cancelledBooking,
    status: 'cancelled',
  }

  upsertBooking(bookingToSave)
  addActivityItem('cancelled', bookingToSave)

  return bookingToSave
}
