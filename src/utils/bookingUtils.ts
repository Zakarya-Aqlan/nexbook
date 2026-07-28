import type { Booking, Resource } from '../types'
import { getCampusBookingLifecycle, getTodayDate } from './dateUtils'

export type BookingGroup = 'Active' | 'Upcoming' | 'Cancelled' | 'Completed'

export function getBookingGroup(
  booking: Booking,
  now: Date = new Date(),
): BookingGroup {
  if (booking.status === 'cancelled') {
    return 'Cancelled'
  }

  const lifecycle = getCampusBookingLifecycle(booking, now)

  if (lifecycle === 'completed') {
    return 'Completed'
  }

  if (lifecycle === 'active') {
    return 'Active'
  }

  return 'Upcoming'
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function isBlockingBookingStatus(status: Booking['status']) {
  return (
    status === 'pending' ||
    status === 'approved' ||
    status === 'upcoming' ||
    status === 'active'
  )
}

export function getPastDateError(date: string): string | null {
  if (date < getTodayDate()) {
    return 'Choose today or a future date.'
  }

  return null
}

export function getTimeRangeError(
  startTime: string,
  endTime: string,
): string | null {
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return 'End time must be after start time.'
  }

  return null
}

export function getOpeningHoursError(
  resource: Resource,
  startTime: string,
  endTime: string,
): string | null {
  const resourceOpens = timeToMinutes(resource.openingTime)
  const resourceCloses = timeToMinutes(resource.closingTime)
  const bookingStarts = timeToMinutes(startTime)
  const bookingEnds = timeToMinutes(endTime)

  if (bookingStarts < resourceOpens || bookingEnds > resourceCloses) {
    return 'Time must be within resource hours.'
  }

  return null
}

export function hasBookingConflict(
  newBooking: Booking,
  existingBookings: Booking[],
): string | null {
  const newStart = timeToMinutes(newBooking.startTime)
  const newEnd = timeToMinutes(newBooking.endTime)

  const hasConflict = existingBookings.some((booking) => {
    const isSameResource = booking.resourceId === newBooking.resourceId
    const isSameDate = booking.date === newBooking.date
    const isActive = isBlockingBookingStatus(booking.status)
    const existingStart = timeToMinutes(booking.startTime)
    const existingEnd = timeToMinutes(booking.endTime)
    const overlaps = newStart < existingEnd && newEnd > existingStart

    return isSameResource && isSameDate && isActive && overlaps
  })

  if (hasConflict) {
    return 'This resource is booked for that time.'
  }

  return null
}

export function getDurationError(
  startTime: string,
  endTime: string,
): string | null {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime)

  if (duration < 60) {
    return 'Booking must be at least 1 hour.'
  }

  if (duration > 180) {
    return 'Booking cannot exceed 3 hours.'
  }

  return null
}
