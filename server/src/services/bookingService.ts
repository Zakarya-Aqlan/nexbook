import { ActivityType, BookingStatus, PrismaClient } from '@prisma/client'

import { AppError } from '../middleware/errorHandler'
import {
  createBookingActivity,
  getActivityByDedupeKey,
  getActivityDedupeKey,
} from './activityService'
import {
  type BookingPayload,
  getTimeRangeMinutes,
  validateBookingAgainstResource,
  validateBookingInput,
} from '../utils/bookingValidation'
import {
  getCampusBookingLifecycle,
  getCampusDateTimeInstant,
  getCampusDateKey,
} from '../utils/campusTime'

const prisma = new PrismaClient()
const activeBookingStatuses: BookingStatus[] = [
  BookingStatus.upcoming,
  BookingStatus.active,
]

export async function getAllBookings() {
  const bookings = await prisma.booking.findMany({
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

  return Promise.all(bookings.map(normalizeBookingStatus))
}

export async function createBookingWithValidation(input: unknown) {
  const payload = getValidatedBookingPayload(input)
  const resource = await getResourceOrThrow(payload.resourceId)

  validateResourceRules(payload, resource)
  await ensureNoBookingConflict(payload)

  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.create({
      data: {
        ...payload,
        status: getComputedBookingStatus(payload),
        editsRemaining: isTodayDate(payload.date) ? 0 : 2,
      },
    })
    const activity = await createBookingActivity(
      transaction,
      ActivityType.booked,
      booking,
      resource.name,
    )

    return { booking, activity }
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

  validateBookingCanBeEdited(existingBooking)

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

  if (isTodayDate(payload.date)) {
    throw new AppError(400, 'Same-day bookings cannot be edited after submission.')
  }

  validateResourceRules(payload, resource)
  await ensureNoBookingConflict(payload, bookingId)

  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        ...payload,
        status: getComputedBookingStatus(payload),
        editsRemaining: existingBooking.editsRemaining - 1,
      },
    })
    const activity = await createBookingActivity(
      transaction,
      ActivityType.updated,
      booking,
      resource.name,
    )

    return { booking, activity }
  })
}

export async function cancelBooking(bookingId: string) {
  const existingBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      resource: true,
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'Booking not found')
  }

  const currentStatus = getNormalizedBookingStatus(existingBooking)

  if (currentStatus === BookingStatus.completed) {
    throw new AppError(400, 'Completed bookings cannot be cancelled.')
  }

  if (existingBooking.status === BookingStatus.cancelled) {
    const activity = await getActivityByDedupeKey(
      getActivityDedupeKey(ActivityType.cancelled, existingBooking),
    )

    return { booking: existingBooking, activity }
  }

  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: BookingStatus.cancelled,
      },
    })
    const activity = await createBookingActivity(
      transaction,
      ActivityType.cancelled,
      booking,
      existingBooking.resource.name,
    )

    return { booking, activity }
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

function validateBookingCanBeEdited(booking: {
  date: string
  endTime: string
  status: BookingStatus
  editsRemaining: number
}) {
  const currentStatus = getNormalizedBookingStatus(booking)

  if (currentStatus === BookingStatus.cancelled) {
    throw new AppError(400, 'Cancelled bookings cannot be edited.')
  }

  if (currentStatus === BookingStatus.completed) {
    throw new AppError(400, 'Completed bookings cannot be edited.')
  }

  if (currentStatus === BookingStatus.active || isTodayDate(booking.date)) {
    throw new AppError(400, 'Same-day bookings cannot be edited after submission.')
  }

  if (booking.editsRemaining <= 0) {
    throw new AppError(400, 'No edits left for this booking.')
  }
}

async function normalizeBookingStatus<
  T extends {
    id: string
    resourceId: string
    studentId: string
    date: string
    startTime: string
    endTime: string
    status: BookingStatus
    editsRemaining: number
    resource: {
      name: string
    }
  },
>(booking: T) {
  const nextStatus = getNormalizedBookingStatus(booking)

  if (nextStatus === booking.status) {
    if (nextStatus === BookingStatus.completed) {
      await prisma.$transaction((transaction) =>
        createBookingActivity(
          transaction,
          ActivityType.completed,
          booking,
          booking.resource.name,
          getCampusDateTimeInstant(booking.date, booking.endTime),
        ),
      )
    }

    return booking
  }

  if (nextStatus === BookingStatus.completed) {
    await prisma.$transaction(async (transaction) => {
      await transaction.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: nextStatus,
        },
      })
      await createBookingActivity(
        transaction,
        ActivityType.completed,
        booking,
        booking.resource.name,
        getCampusDateTimeInstant(booking.date, booking.endTime),
      )
    })
  } else {
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: nextStatus,
      },
    })
  }

  return {
    ...booking,
    status: nextStatus,
  }
}

function getNormalizedBookingStatus(booking: {
  date: string
  startTime?: string
  endTime: string
  status: BookingStatus
}) {
  if (booking.status === BookingStatus.cancelled) {
    return BookingStatus.cancelled
  }

  return getComputedBookingStatus({
    date: booking.date,
    startTime: booking.startTime ?? booking.endTime,
    endTime: booking.endTime,
  })
}

function getComputedBookingStatus(booking: {
  date: string
  startTime: string
  endTime: string
}) {
  return getCampusBookingLifecycle(booking)
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

function isTodayDate(date: string) {
  return date === getCampusDateKey()
}
