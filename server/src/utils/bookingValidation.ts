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

  if (studentName && !/^[A-Za-z ]+$/.test(studentName)) {
    errors.push('Student name can only contain letters and spaces.')
  }

  if (rawStudentId && !studentId) {
    errors.push('Student ID must be TP followed by exactly 6 digits.')
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must use YYYY-MM-DD format.')
  }

  if (startTime && !isValidTime(startTime)) {
    errors.push('Start time must use HH:mm format.')
  }

  if (endTime && !isValidTime(endTime)) {
    errors.push('End time must use HH:mm format.')
  }

  if (duration !== null && (duration < 60 || duration > 180)) {
    errors.push('Duration must be between 60 and 180 minutes.')
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

  if (/^\d{6}$/.test(trimmedStudentId)) {
    return `TP${trimmedStudentId}`
  }

  return ''
}

function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}
