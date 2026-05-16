import type { Booking } from '../types'

const ACTIVITY_KEY = 'nexbook-activity'
const maxActivityItems = 25

export type ActivityAction = 'booked' | 'updated' | 'cancelled'

export type ActivityItem = {
  id: string
  action: ActivityAction
  resourceId: string
  date: string
  startTime: string
  endTime: string
  createdAt: string
}

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
    const activityItems = JSON.parse(savedActivity)

    if (Array.isArray(activityItems)) {
      return activityItems
    }

    return []
  } catch {
    return []
  }
}

export function addActivityItem(action: ActivityAction, booking: Booking) {
  try {
    const activityItems = getActivityItems()
    const activityItem: ActivityItem = {
      id: createActivityId(),
      action,
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify([activityItem, ...activityItems].slice(0, maxActivityItems)),
    )
  } catch {
    // Activity history should never block booking storage.
  }
}
