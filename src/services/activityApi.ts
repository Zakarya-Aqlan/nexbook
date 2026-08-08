import type { Activity, ActivityType } from '../types'
import {
  getActivityItems,
  saveActivityItems,
} from '../utils/activityStorage'
import { buildApiUrl } from './apiConfig'

type ActivityLoadResult = {
  activities: Activity[]
  isUsingFallback: boolean
}

const maximumImportSize = 200

export function mapApiActivity(value: unknown): Activity | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const activity = value as Record<string, unknown>
  const type = getActivityType(activity.type)

  if (
    typeof activity.id !== 'string' ||
    typeof activity.bookingId !== 'string' ||
    typeof activity.resourceId !== 'string' ||
    typeof activity.resourceName !== 'string' ||
    typeof activity.date !== 'string' ||
    typeof activity.startTime !== 'string' ||
    typeof activity.endTime !== 'string' ||
    typeof activity.createdAt !== 'string' ||
    type === null
  ) {
    return null
  }

  return {
    id: activity.id,
    type,
    bookingId: activity.bookingId,
    resourceId: activity.resourceId,
    resourceName: activity.resourceName,
    date: activity.date,
    startTime: activity.startTime,
    endTime: activity.endTime,
    studentId:
      typeof activity.studentId === 'string' ? activity.studentId : undefined,
    createdAt: activity.createdAt,
    clientEventKey:
      typeof activity.clientEventKey === 'string'
        ? activity.clientEventKey
        : undefined,
    source: 'backend',
  }
}

export async function loadActivities(): Promise<ActivityLoadResult> {
  const cachedActivities = getActivityItems()
  const unsyncedActivities = cachedActivities.filter(
    (activity) => activity.source === 'local',
  )
  let importedActivities: Activity[] = []
  let importFailed = false

  if (unsyncedActivities.length > 0) {
    try {
      for (
        let index = 0;
        index < unsyncedActivities.length;
        index += maximumImportSize
      ) {
        const batch = unsyncedActivities.slice(
          index,
          index + maximumImportSize,
        )
        const response = await fetch(buildApiUrl('/api/activities/import'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch.map(getImportPayload)),
        })

        if (!response.ok) {
          throw new Error('Activity import failed.')
        }

        importedActivities.push(
          ...mapApiActivities(await response.json()),
        )
      }
    } catch {
      importFailed = true
    }
  }

  try {
    const response = await fetch(buildApiUrl('/api/activities'))

    if (!response.ok) {
      throw new Error('Activities request failed.')
    }

    const backendActivities = mapApiActivities(await response.json())
    const activitiesToSave = importFailed
      ? [...backendActivities, ...unsyncedActivities]
      : backendActivities

    saveActivityItems(activitiesToSave)

    return {
      activities: getActivityItems(),
      isUsingFallback: importFailed,
    }
  } catch {
    saveActivityItems([...importedActivities, ...cachedActivities])

    return {
      activities: getActivityItems(),
      isUsingFallback: true,
    }
  }
}

function mapApiActivities(responseBody: unknown) {
  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('data' in responseBody) ||
    !Array.isArray(responseBody.data)
  ) {
    throw new Error('Activities response was not usable.')
  }

  const activities = responseBody.data.map(mapApiActivity)

  if (activities.some((activity) => activity === null)) {
    throw new Error('Activities response included invalid records.')
  }

  return activities.filter(
    (activity): activity is Activity => activity !== null,
  )
}

function getImportPayload(activity: Activity) {
  return {
    type: activity.type,
    bookingId: activity.bookingId,
    resourceId: activity.resourceId,
    resourceName: activity.resourceName,
    date: activity.date,
    startTime: activity.startTime,
    endTime: activity.endTime,
    studentId: activity.studentId,
    createdAt: activity.createdAt,
    clientEventKey: activity.clientEventKey,
  }
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
