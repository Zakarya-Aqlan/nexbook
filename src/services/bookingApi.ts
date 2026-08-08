import type { Booking, BookingStatus } from '../types'
import {
  getBookingSource,
  getBookings,
  markBookingSources,
  saveBookings,
} from '../utils/storage'
import { buildApiUrl } from './apiConfig'

export type BookingLoadResult = {
  bookings: Booking[]
  isUsingFallback: boolean
}

export function mapApiBooking(value: unknown): Booking | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const booking = value as Record<string, unknown>
  const status = mapApiStatus(booking.status)

  if (
    typeof booking.id !== 'string' ||
    !booking.id.trim() ||
    typeof booking.resourceId !== 'string' ||
    typeof booking.studentName !== 'string' ||
    typeof booking.studentId !== 'string' ||
    typeof booking.date !== 'string' ||
    typeof booking.startTime !== 'string' ||
    typeof booking.endTime !== 'string' ||
    typeof booking.createdAt !== 'string' ||
    status === null
  ) {
    return null
  }

  return {
    id: booking.id,
    resourceId: booking.resourceId,
    studentName: booking.studentName,
    studentId: booking.studentId,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    purpose: '',
    status,
    createdAt: booking.createdAt,
    remainingEdits:
      typeof booking.editsRemaining === 'number'
        ? booking.editsRemaining
        : undefined,
  }
}

export function mapApiBookings(responseBody: unknown) {
  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('data' in responseBody) ||
    !Array.isArray(responseBody.data)
  ) {
    throw new Error('Bookings response was not usable.')
  }

  const bookings = responseBody.data.map(mapApiBooking)

  if (bookings.some((booking) => booking === null)) {
    throw new Error('Bookings response included invalid records.')
  }

  return bookings.filter((booking): booking is Booking => booking !== null)
}

export async function loadBookings(): Promise<BookingLoadResult> {
  const cachedBookings = getBookings()

  try {
    const response = await fetch(buildApiUrl('/api/bookings'))

    if (!response.ok) {
      throw new Error('Bookings request failed.')
    }

    const backendBookings = mapApiBookings(await response.json())
    const backendBookingIds = new Set(
      backendBookings.map((booking) => booking.id),
    )
    const localOnlyBookings = cachedBookings.filter(
      (booking) =>
        !backendBookingIds.has(booking.id) &&
        getBookingSource(booking.id) === 'local',
    )
    const mergedBookings = [...backendBookings, ...localOnlyBookings]

    markBookingSources(
      backendBookings.map((booking) => booking.id),
      'backend',
    )
    saveBookings(mergedBookings)

    return {
      bookings: mergedBookings,
      isUsingFallback: false,
    }
  } catch {
    return {
      bookings: cachedBookings,
      isUsingFallback: true,
    }
  }
}

function mapApiStatus(status: unknown): BookingStatus | null {
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'upcoming' ||
    status === 'active' ||
    status === 'cancelled' ||
    status === 'completed'
  ) {
    return status
  }

  return null
}
