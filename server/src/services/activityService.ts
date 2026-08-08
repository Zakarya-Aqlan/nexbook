import {
  ActivityType,
  BookingStatus,
  Prisma,
} from '@prisma/client'

import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import {
  getCampusBookingLifecycle,
  getCampusDateTimeInstant,
} from '../utils/campusTime'

const maximumImportSize = 200

type ActivityBookingSnapshot = {
  id: string
  resourceId: string
  studentId: string
  date: string
  startTime: string
  endTime: string
  editsRemaining: number
}

type ImportedActivity = {
  type: ActivityType
  bookingId: string
  resourceId: string
  resourceName: string
  date: string
  startTime: string
  endTime: string
  studentId?: string
  createdAt: Date
  clientEventKey: string
}

export function getActivityDedupeKey(
  type: ActivityType,
  booking: Pick<ActivityBookingSnapshot, 'id' | 'editsRemaining'>,
) {
  if (type === ActivityType.updated) {
    return `updated:${booking.id}:${booking.editsRemaining}`
  }

  return `${type}:${booking.id}`
}

export async function createBookingActivity(
  transaction: Prisma.TransactionClient,
  type: ActivityType,
  booking: ActivityBookingSnapshot,
  resourceName: string,
  createdAt = new Date(),
) {
  const dedupeKey = getActivityDedupeKey(type, booking)

  return transaction.activity.upsert({
    where: {
      dedupeKey,
    },
    create: {
      type,
      bookingId: booking.id,
      resourceId: booking.resourceId,
      resourceName,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      studentId: booking.studentId,
      createdAt,
      dedupeKey,
    },
    update: {},
  })
}

export async function getActivityByDedupeKey(dedupeKey: string) {
  return prisma.activity.findUnique({
    where: {
      dedupeKey,
    },
  })
}

export async function ensureCompletedActivities() {
  const bookings = await prisma.booking.findMany({
    where: {
      status: {
        not: BookingStatus.cancelled,
      },
    },
    include: {
      resource: true,
    },
  })
  const completedBookings = bookings.filter(
    (booking) => getCampusBookingLifecycle(booking) === 'completed',
  )

  if (completedBookings.length === 0) {
    return
  }

  await prisma.$transaction(async (transaction) => {
    for (const booking of completedBookings) {
      await createBookingActivity(
        transaction,
        ActivityType.completed,
        booking,
        booking.resource.name,
        getCampusDateTimeInstant(booking.date, booking.endTime),
      )
    }
  })
}

export async function getAllActivities() {
  return prisma.activity.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function importActivities(input: unknown) {
  const activities = validateImportedActivities(input)
  const operations = activities.map((activity) =>
    prisma.activity.upsert({
      where: {
        clientEventKey: activity.clientEventKey,
      },
      create: {
        type: activity.type,
        bookingId: activity.bookingId,
        resourceId: activity.resourceId,
        resourceName: activity.resourceName,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        studentId: activity.studentId ?? null,
        createdAt: activity.createdAt,
        clientEventKey: activity.clientEventKey,
      },
      update: {},
    }),
  )

  return prisma.$transaction(operations)
}

function validateImportedActivities(input: unknown): ImportedActivity[] {
  if (!Array.isArray(input)) {
    throw new AppError(400, 'Activity import body must be an array.')
  }

  if (input.length > maximumImportSize) {
    throw new AppError(
      400,
      `Activity import cannot exceed ${maximumImportSize} entries.`,
    )
  }

  const clientEventKeys = new Set<string>()

  return input.map((value, index) => {
    if (!value || typeof value !== 'object') {
      throw new AppError(400, `Activity ${index + 1} must be an object.`)
    }

    const activity = value as Record<string, unknown>
    const type = getActivityType(activity.type, index)
    const bookingId = getRequiredString(activity, 'bookingId', index)
    const resourceId = getRequiredString(activity, 'resourceId', index)
    const resourceName = getRequiredString(activity, 'resourceName', index)
    const date = getRequiredString(activity, 'date', index)
    const startTime = getRequiredString(activity, 'startTime', index)
    const endTime = getRequiredString(activity, 'endTime', index)
    const createdAtValue = getRequiredString(activity, 'createdAt', index)
    const clientEventKey = getRequiredString(
      activity,
      'clientEventKey',
      index,
    )
    const studentId = getOptionalString(activity.studentId, index)

    if (!isRealDate(date)) {
      throw new AppError(
        400,
        `Activity ${index + 1} date must be a real YYYY-MM-DD date.`,
      )
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      throw new AppError(
        400,
        `Activity ${index + 1} times must use HH:mm format.`,
      )
    }

    const createdAt = new Date(createdAtValue)

    if (Number.isNaN(createdAt.getTime())) {
      throw new AppError(
        400,
        `Activity ${index + 1} createdAt must be a valid timestamp.`,
      )
    }

    if (clientEventKeys.has(clientEventKey)) {
      throw new AppError(400, 'Activity import contains duplicate event keys.')
    }

    clientEventKeys.add(clientEventKey)

    return {
      type,
      bookingId,
      resourceId,
      resourceName,
      date,
      startTime,
      endTime,
      studentId,
      createdAt,
      clientEventKey,
    }
  })
}

function getActivityType(value: unknown, index: number) {
  if (
    value === ActivityType.booked ||
    value === ActivityType.updated ||
    value === ActivityType.cancelled ||
    value === ActivityType.completed
  ) {
    return value
  }

  throw new AppError(400, `Activity ${index + 1} has an invalid type.`)
}

function getRequiredString(
  activity: Record<string, unknown>,
  key: string,
  index: number,
) {
  const value = activity[key]

  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `Activity ${index + 1} ${key} is required.`)
  }

  return value.trim()
}

function getOptionalString(value: unknown, index: number) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new AppError(400, `Activity ${index + 1} studentId must be a string.`)
  }

  return value.trim() || undefined
}

function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

function isRealDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  )
}
