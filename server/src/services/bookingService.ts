import { BookingStatus, PrismaClient } from '@prisma/client'

import { AppError } from '../middleware/errorHandler'
import {
  type BookingPayload,
  getTimeRangeMinutes,
  validateBookingAgainstResource,
  validateBookingInput,
} from '../utils/bookingValidation'

const prisma = new PrismaClient()
const activeBookingStatuses: BookingStatus[] = [
  BookingStatus.pending,
  BookingStatus.approved,
]

export async function getAllBookings() {
  return prisma.booking.findMany({
    include: {
      resource: true,
    },
    orderBy: [
      {
        date: 'asc',
      },
      {
        startTime: 'asc',
      },
    ],
  })
}

export async function createBookingWithValidation(input: unknown) {
  const payload = getValidatedBookingPayload(input)
  const resource = await getResourceOrThrow(payload.resourceId)

  validateResourceRules(payload, resource)
  await ensureNoBookingConflict(payload)

  return prisma.booking.create({
    data: {
      ...payload,
      status: 'pending',
      editsRemaining: 2,
    },
  })
}

export async function updateBookingWithValidation(
  bookingId: string,
  input: unknown,
) {
  const existingBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'Booking not found')
  }

  const payload = getValidatedBookingPayload({
    studentName: getInputValue(input, 'studentName') ?? existingBooking.studentName,
    studentId: getInputValue(input, 'studentId') ?? existingBooking.studentId,
    resourceId: getInputValue(input, 'resourceId') ?? existingBooking.resourceId,
    date: getInputValue(input, 'date') ?? existingBooking.date,
    startTime: getInputValue(input, 'startTime') ?? existingBooking.startTime,
    endTime: getInputValue(input, 'endTime') ?? existingBooking.endTime,
    duration: getInputValue(input, 'duration') ?? existingBooking.duration,
  })
  const resource = await getResourceOrThrow(payload.resourceId)

  validateResourceRules(payload, resource)
  await ensureNoBookingConflict(payload, bookingId)

  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: payload,
  })
}

export async function cancelBooking(bookingId: string) {
  const existingBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'Booking not found')
  }

  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: 'cancelled',
    },
  })
}

function getValidatedBookingPayload(input: unknown) {
  const validation = validateBookingInput(input)

  if (!validation.isValid) {
    throw new AppError(400, 'Invalid booking data', validation.errors)
  }

  return validation.payload
}

async function getResourceOrThrow(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: {
      id: resourceId,
    },
  })

  if (!resource) {
    throw new AppError(404, 'Resource not found')
  }

  return resource
}

function validateResourceRules(
  payload: BookingPayload,
  resource: { openTime: string; closeTime: string },
) {
  const errors = validateBookingAgainstResource(payload, resource)

  if (errors.length > 0) {
    throw new AppError(400, 'Invalid booking data', errors)
  }
}

async function ensureNoBookingConflict(
  payload: BookingPayload,
  bookingIdToIgnore?: string,
) {
  const bookings = await prisma.booking.findMany({
    where: {
      resourceId: payload.resourceId,
      date: payload.date,
      status: {
        in: activeBookingStatuses,
      },
      ...(bookingIdToIgnore
        ? {
            NOT: {
              id: bookingIdToIgnore,
            },
          }
        : {}),
    },
  })
  const requestedRange = getTimeRangeMinutes(payload.startTime, payload.endTime)
  const hasConflict = bookings.some((booking) => {
    const existingRange = getTimeRangeMinutes(
      booking.startTime,
      booking.endTime,
    )

    return requestedRange.start < existingRange.end &&
      requestedRange.end > existingRange.start
  })

  if (hasConflict) {
    throw new AppError(409, 'This resource is booked for that time.')
  }
}

function getInputValue(input: unknown, key: string) {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  return (input as Record<string, unknown>)[key]
}
