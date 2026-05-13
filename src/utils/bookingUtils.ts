import type { Booking, Resource } from '../types'

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getPastDateError(date: string): string | null {
  const bookingDate = new Date(`${date}T00:00:00`)
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  if (bookingDate < today) {
    return 'Booking date cannot be in the past.'
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
    return 'Booking time must be within the resource opening hours.'
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
    const isActive = booking.status === 'pending' || booking.status === 'approved'
    const existingStart = timeToMinutes(booking.startTime)
    const existingEnd = timeToMinutes(booking.endTime)
    const overlaps = newStart < existingEnd && newEnd > existingStart

    return isSameResource && isSameDate && isActive && overlaps
  })

  if (hasConflict) {
    return 'This resource is already booked during that time.'
  }

  return null
}

export function getDurationError(
  startTime: string,
  endTime: string,
): string | null {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime)

  if (duration < 30) {
    return 'Booking must be at least 30 minutes long.'
  }

  if (duration > 180) {
    return 'Booking cannot be longer than 3 hours.'
  }

  return null
}
