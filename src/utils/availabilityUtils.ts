import type { Booking, Resource } from '../types'
import { getTodayDate } from './dateUtils'

export const minimumBookingDuration = 60

export type SlotUnavailableReason = 'booked' | 'past' | null

export type AvailabilitySlot = {
  start: string
  endLabel: string
  unavailable: boolean
  unavailableReason: SlotUnavailableReason
}

type AvailabilitySlotOptions = {
  resource: Resource
  date: string
  duration: number
  bookings: Booking[]
  excludeBookingId?: string
  now?: Date
}

type ResourceAvailabilityOptions = {
  resource: Resource
  date: string
  duration: number
  bookings: Booking[]
  excludeBookingId?: string
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getCurrentTimeMinutes(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes()
}

export function isTodayDate(date: string) {
  return date === getTodayDate()
}

function hasSlotConflict(
  startMins: number,
  endMins: number,
  bookings: Booking[],
  resourceId: string,
  date: string,
  excludeBookingId: string | undefined,
) {
  return bookings.some((booking) => {
    if (
      booking.id === excludeBookingId ||
      booking.resourceId !== resourceId ||
      booking.date !== date ||
      booking.status === 'cancelled'
    ) {
      return false
    }

    const existingStart = timeToMinutes(booking.startTime)
    const existingEnd = timeToMinutes(booking.endTime)

    return startMins < existingEnd && endMins > existingStart
  })
}

export function getAvailabilitySlots({
  resource,
  date,
  duration,
  bookings,
  excludeBookingId,
  now = new Date(),
}: AvailabilitySlotOptions): AvailabilitySlot[] {
  const open = timeToMinutes(resource.openingTime)
  const close = timeToMinutes(resource.closingTime)
  const currentTime = getCurrentTimeMinutes(now)
  const shouldCheckCurrentTime = date === getTodayDate()
  const slots: AvailabilitySlot[] = []

  for (let m = open; m + duration <= close; m += duration) {
    const isPastSlot = shouldCheckCurrentTime && m < currentTime
    const isBooked = hasSlotConflict(
      m,
      m + duration,
      bookings,
      resource.id,
      date,
      excludeBookingId,
    )
    const unavailableReason: SlotUnavailableReason = isPastSlot
      ? 'past'
      : isBooked
        ? 'booked'
        : null

    slots.push({
      start: minutesToTime(m),
      endLabel: minutesToTime(m + duration),
      unavailable: unavailableReason !== null,
      unavailableReason,
    })
  }

  return slots
}

export function hasAvailableSlotForResource({
  resource,
  date,
  duration,
  bookings,
  excludeBookingId,
}: ResourceAvailabilityOptions) {
  return getAvailabilitySlots({
    resource,
    date,
    duration,
    bookings,
    excludeBookingId,
  }).some((slot) => !slot.unavailable)
}

export function hasAvailableSlotForResourceToday(
  resource: Resource,
  bookings: Booking[],
  duration = minimumBookingDuration,
  excludeBookingId?: string,
) {
  return hasAvailableSlotForResource({
    resource,
    date: getTodayDate(),
    duration,
    bookings,
    excludeBookingId,
  })
}

export function getPastSameDayTimeError(date: string, startTime: string) {
  if (isTodayDate(date) && timeToMinutes(startTime) < getCurrentTimeMinutes()) {
    return 'Booking start time cannot be in the past.'
  }

  return null
}

export function getNoRemainingTodayError(
  resource: Resource,
  date: string,
  bookings: Booking[],
  duration = minimumBookingDuration,
  excludeBookingId?: string,
) {
  if (
    isTodayDate(date) &&
    !hasAvailableSlotForResource({
      resource,
      date,
      duration,
      bookings,
      excludeBookingId,
    })
  ) {
    return 'This resource has no remaining available time today. Please choose another date or resource.'
  }

  return null
}
