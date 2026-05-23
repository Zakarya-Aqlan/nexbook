export type BookingPayload = {
  studentName: string
  studentId: string
  resourceId: string
  date: string
  startTime: string
  endTime: string
  duration: number
}

type BookingValidationResult =
  | {
      isValid: true
      payload: BookingPayload
      errors: []
    }
  | {
      isValid: false
      payload: null
      errors: string[]
    }

type ResourceHours = {
  openTime: string
  closeTime: string
}

type DateParts = {
  year: number
  month: number
  day: number
}

const allowedDurations = [60, 120, 180]

export function validateBookingInput(input: unknown): BookingValidationResult {
  const errors: string[] = []

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      payload: null,
      errors: ['Request body must be an object.'],
    }
  }

  const data = input as Record<string, unknown>
  const studentName = getRequiredString(data, 'studentName', errors)
  const rawStudentId = getRequiredString(data, 'studentId', errors)
  const resourceId = getRequiredString(data, 'resourceId', errors)
  const date = getRequiredString(data, 'date', errors)
  const startTime = getRequiredString(data, 'startTime', errors)
  const endTime = getRequiredString(data, 'endTime', errors)
  const duration = getRequiredNumber(data, 'duration', errors)
  const studentId = normalizeStudentId(rawStudentId)
  const bookingDate = date ? getDateParts(date) : null

  if (studentName && !/^[A-Za-z ]+$/.test(studentName)) {
    errors.push('Student name can only contain letters and spaces.')
  }

  if (rawStudentId && !studentId) {
    errors.push('Student ID must be TP followed by exactly 6 digits.')
  }

  if (date && !bookingDate) {
    errors.push('Date must be a real calendar date in YYYY-MM-DD format.')
  }

  if (bookingDate && compareDateParts(bookingDate, getTodayDateParts()) < 0) {
    errors.push('Choose today or a future date.')
  }

  if (startTime && !isValidTime(startTime)) {
    errors.push('Start time must use HH:mm format.')
  }

  if (endTime && !isValidTime(endTime)) {
    errors.push('End time must use HH:mm format.')
  }

  if (duration !== null && !allowedDurations.includes(duration)) {
    errors.push('Duration must be 1, 2, or 3 hours.')
  }

  if (
    bookingDate &&
    startTime &&
    isValidTime(startTime) &&
    isToday(bookingDate) &&
    timeToMinutes(startTime) < getCurrentTimeMinutes()
  ) {
    errors.push('Start time cannot be in the past.')
  }

  if (errors.length > 0 || duration === null || !studentId) {
    return {
      isValid: false,
      payload: null,
      errors,
    }
  }

  return {
    isValid: true,
    payload: {
      studentName,
      studentId,
      resourceId,
      date,
      startTime,
      endTime,
      duration,
    },
    errors: [],
  }
}

export function validateBookingAgainstResource(
  payload: BookingPayload,
  resource: ResourceHours,
) {
  const errors: string[] = []
  const bookingRange = getTimeRangeMinutes(payload.startTime, payload.endTime)
  const resourceRange = getTimeRangeMinutes(resource.openTime, resource.closeTime)
  const actualDuration = bookingRange.end - bookingRange.start

  if (bookingRange.end <= bookingRange.start) {
    errors.push('End time must be after start time.')
  }

  if (
    bookingRange.start < resourceRange.start ||
    bookingRange.end > resourceRange.end
  ) {
    errors.push('Time must be within resource hours.')
  }

  if (actualDuration !== payload.duration) {
    errors.push('Duration must match the selected start and end time.')
  }

  return errors
}

export function getTimeRangeMinutes(startTime: string, endTime: string) {
  return {
    start: timeToMinutes(startTime),
    end: timeToMinutes(endTime),
  }
}

function getRequiredString(
  data: Record<string, unknown>,
  key: string,
  errors: string[],
) {
  const value = data[key]

  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${key} is required.`)
    return ''
  }

  return value.trim()
}

function getRequiredNumber(
  data: Record<string, unknown>,
  key: string,
  errors: string[],
) {
  const value = data[key]

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    errors.push(`${key} must be a whole number.`)
    return null
  }

  return value
}

function normalizeStudentId(studentId: string) {
  const trimmedStudentId = studentId.trim().toUpperCase()

  if (/^TP\d{6}$/.test(trimmedStudentId)) {
    return trimmedStudentId
  }

  return ''
}

function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function getDateParts(date: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12) {
    return null
  }

  if (day < 1 || day > getDaysInMonth(year, month)) {
    return null
  }

  return { year, month, day }
}

function getDaysInMonth(year: number, month: number) {
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return daysByMonth[month - 1]
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function getTodayDateParts(): DateParts {
  const today = new Date()

  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  }
}

function compareDateParts(first: DateParts, second: DateParts) {
  if (first.year !== second.year) {
    return first.year - second.year
  }

  if (first.month !== second.month) {
    return first.month - second.month
  }

  return first.day - second.day
}

function isToday(date: DateParts) {
  return compareDateParts(date, getTodayDateParts()) === 0
}

function getCurrentTimeMinutes() {
  const now = new Date()

  return now.getHours() * 60 + now.getMinutes()
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}
