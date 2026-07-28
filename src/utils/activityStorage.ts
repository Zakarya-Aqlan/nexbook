import { resources } from '../data/resources'
import type { Activity, ActivityType, Booking } from '../types'
import { getCampusDateTimeTimestamp } from './dateUtils'

const ACTIVITY_KEY = 'nexbook-activity'

export type ActivityAction = ActivityType
export type ActivityItem = Activity

function createActivityId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getActivityItems(): ActivityItem[] {
  const savedActivity = localStorage.getItem(ACTIVITY_KEY)

  if (!savedActivity) {
    return []
  }

  try {
    const activityItems: unknown = JSON.parse(savedActivity)

    if (Array.isArray(activityItems)) {
      return activityItems
        .map(normalizeActivityItem)
        .filter((activity): activity is Activity => activity !== null)
    }

    return []
  } catch {
    return []
  }
}

export function saveActivityItems(activityItems: Activity[]) {
  localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify(deduplicateActivities(activityItems)),
  )
}

export function mirrorActivity(activity: Activity) {
  const mirroredActivity: Activity = {
    ...activity,
    source: 'backend',
  }

  saveActivityItems([mirroredActivity, ...getActivityItems()])

  return mirroredActivity
}

export function addActivityItem(type: ActivityAction, booking: Booking) {
  try {
    const activityItems = getActivityItems()
    const id = createActivityId()
    const activityItem: ActivityItem = {
      id,
      type,
      bookingId: booking.id,
      resourceId: booking.resourceId,
      resourceName: getResourceName(booking.resourceId),
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      studentId: booking.studentId,
      createdAt: new Date().toISOString(),
      clientEventKey: `local:${id}`,
      source: 'local',
    }

    saveActivityItems([activityItem, ...activityItems])
  } catch {
    // Activity history should never block booking storage.
  }
}

export function ensureLocalCompletedActivity(booking: Booking) {
  const activityItems = getActivityItems()
  const hasCompletedActivity = activityItems.some(
    (activity) =>
      activity.type === 'completed' && activity.bookingId === booking.id,
  )

  if (hasCompletedActivity) {
    return
  }

  const id = `local-completed-${booking.id}`
  const activity: Activity = {
    id,
    type: 'completed',
    bookingId: booking.id,
    resourceId: booking.resourceId,
    resourceName: getResourceName(booking.resourceId),
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    studentId: booking.studentId,
    createdAt: new Date(
      getCampusDateTimeTimestamp(booking.date, booking.endTime),
    ).toISOString(),
    clientEventKey: `local:${id}`,
    source: 'local',
  }

  saveActivityItems([activity, ...activityItems])
}

function normalizeActivityItem(value: unknown): Activity | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const activity = value as Record<string, unknown>
  const type = getActivityType(activity.type ?? activity.action)
  const resourceId = getString(activity.resourceId)
  const date = getString(activity.date)
  const startTime = getString(activity.startTime)
  const endTime = getString(activity.endTime)
  const createdAt = getString(activity.createdAt)

  if (!type || !resourceId || !date || !startTime || !endTime || !createdAt) {
    return null
  }

  const fallbackIdentity = [
    type,
    resourceId,
    date,
    startTime,
    endTime,
    createdAt,
  ].join(':')
  const id = getString(activity.id) || `legacy-${fallbackIdentity}`
  const source = activity.source === 'backend' ? 'backend' : 'local'
  const clientEventKey =
    getString(activity.clientEventKey) ||
    (source === 'local' ? `local:${id}` : undefined)

  return {
    id,
    type,
    bookingId: getString(activity.bookingId) || `legacy:${id}`,
    resourceId,
    resourceName:
      getString(activity.resourceName) || getResourceName(resourceId),
    date,
    startTime,
    endTime,
    studentId: getString(activity.studentId) || undefined,
    createdAt,
    clientEventKey,
    source,
  }
}

function deduplicateActivities(activities: Activity[]) {
  const seenKeys = new Set<string>()

  return activities
    .filter((activity) => {
      const keys = getActivityIdentityKeys(activity)

      if (keys.some((key) => seenKeys.has(key))) {
        return false
      }

      keys.forEach((key) => seenKeys.add(key))
      return true
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )
}

function getActivityIdentityKeys(activity: Activity) {
  const bookingEventKey =
    activity.type === 'updated'
      ? []
      : [`booking-event:${activity.type}:${activity.bookingId}`]

  return [
    `id:${activity.id}`,
    ...(activity.clientEventKey
      ? [`client:${activity.clientEventKey}`]
      : []),
    ...bookingEventKey,
    [
      'event',
      activity.type,
      activity.bookingId,
      activity.resourceId,
      activity.date,
      activity.startTime,
      activity.endTime,
      activity.createdAt,
    ].join(':'),
  ]
}

function getActivityType(value: unknown): ActivityType | null {
  if (
    value === 'booked' ||
    value === 'updated' ||
    value === 'cancelled' ||
    value === 'completed'
  ) {
    return value
  }

  return null
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function getResourceName(resourceId: string) {
  return (
    resources.find((resource) => resource.id === resourceId)?.name ??
    'Unknown resource'
  )
}
