export const CAMPUS_TIME_ZONE = 'Asia/Kuala_Lumpur'

export type CampusDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export type CampusBookingLifecycle = 'upcoming' | 'active' | 'completed'

type CampusBookingTime = {
  date: string
  startTime: string
  endTime: string
}

const campusDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPUS_TIME_ZONE,
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function getNumericPart(
  parts: Intl.DateTimeFormatPart[],
  type: 'year' | 'month' | 'day' | 'hour' | 'minute',
) {
  const value = parts.find((part) => part.type === type)?.value
  const numericValue = Number(value)

  if (!Number.isInteger(numericValue)) {
    throw new Error(`Unable to read campus ${type}.`)
  }

  return numericValue
}

export function getCampusDateTimeParts(
  now: Date = new Date(),
): CampusDateTimeParts {
  const parts = campusDateTimeFormatter.formatToParts(now)

  return {
    year: getNumericPart(parts, 'year'),
    month: getNumericPart(parts, 'month'),
    day: getNumericPart(parts, 'day'),
    hour: getNumericPart(parts, 'hour'),
    minute: getNumericPart(parts, 'minute'),
  }
}

export function getCampusDateKey(now: Date = new Date()) {
  const { year, month, day } = getCampusDateTimeParts(now)

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

export function getCampusMinuteOfDay(now: Date = new Date()) {
  const { hour, minute } = getCampusDateTimeParts(now)

  return hour * 60 + minute
}

export function timeStringToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

export function getCampusBookingLifecycle(
  booking: CampusBookingTime,
  now: Date = new Date(),
): CampusBookingLifecycle {
  const campusDate = getCampusDateKey(now)

  if (booking.date < campusDate) {
    return 'completed'
  }

  if (booking.date > campusDate) {
    return 'upcoming'
  }

  const currentMinute = getCampusMinuteOfDay(now)
  const startMinute = timeStringToMinutes(booking.startTime)
  const endMinute = timeStringToMinutes(booking.endTime)

  if (currentMinute < startMinute) {
    return 'upcoming'
  }

  if (currentMinute >= endMinute) {
    return 'completed'
  }

  return 'active'
}
