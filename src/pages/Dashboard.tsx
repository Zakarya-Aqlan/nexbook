import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import { getActivityItems, type ActivityItem } from '../utils/activityStorage'
import { getTodayDate } from '../utils/dateUtils'
import { getBookings } from '../utils/storage'

const dashboardSubtitles = [
  'Find available spaces in seconds.',
  'Book rooms, labs, and equipment without conflicts.',
  'See clear availability before you reserve.',
  'Pick a resource, choose a slot, and confirm.',
  'Manage active, cancelled, and completed bookings.',
  'Keep campus schedules simple and conflict-free.',
]

const maxRemainingEdits = 2

type DashboardActivity = Omit<ActivityItem, 'action'> & {
  action: ActivityItem['action'] | 'completed'
}

const activityStyles = {
  booked: {
    label: 'Booked',
    dot: 'bg-blue-500',
    badge:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300',
  },
  updated: {
    label: 'Updated',
    dot: 'bg-indigo-500',
    badge:
      'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-300',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-red-500',
    badge:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
}

function getBookingStartDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.startTime}:00`)
}

function getBookingEndDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.endTime}:00`)
}

function getResourceName(resourceId: string) {
  return (
    resources.find((resource) => resource.id === resourceId)?.name ??
    'Unknown resource'
  )
}

function getRemainingEdits(booking: Booking) {
  return booking.remainingEdits ?? maxRemainingEdits
}

function isCompletedBooking(booking: Booking, now: Date) {
  return getBookingEndDate(booking) < now
}

function isEditableFutureBooking(booking: Booking, todayDate: string, now: Date) {
  return (
    booking.status !== 'cancelled' &&
    !isCompletedBooking(booking, now) &&
    booking.date > todayDate &&
    getRemainingEdits(booking) > 0
  )
}

function isActiveDashboardBooking(
  booking: Booking,
  todayDate: string,
  now: Date,
) {
  return (
    booking.status !== 'cancelled' &&
    !isCompletedBooking(booking, now) &&
    !isEditableFutureBooking(booking, todayDate, now)
  )
}

function formatActivityDate(date: string, todayDate: string) {
  if (date === todayDate) {
    return 'today'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function getActivityMessage(activity: DashboardActivity) {
  const resourceName = getResourceName(activity.resourceId)

  if (activity.action === 'booked') {
    return `Booked ${resourceName}.`
  }

  if (activity.action === 'updated') {
    return `Updated ${resourceName} booking.`
  }

  if (activity.action === 'cancelled') {
    return `Cancelled ${resourceName} booking.`
  }

  return `Completed ${resourceName} booking.`
}

function getActivityTime(activity: DashboardActivity, todayDate: string) {
  const dateLabel = formatActivityDate(activity.date, todayDate)

  return `${dateLabel} · ${activity.startTime} - ${activity.endTime}`
}

function getActivityTimestamp(activity: DashboardActivity) {
  return new Date(activity.createdAt).getTime()
}

export function Dashboard() {
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [todayActiveIndex, setTodayActiveIndex] = useState(0)
  const bookings = getBookings()
  const activityItems = getActivityItems()
  const now = new Date()
  const todayDate = getTodayDate()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSubtitleIndex(
        (currentIndex) => (currentIndex + 1) % dashboardSubtitles.length,
      )
    }, 3500)

    return () => window.clearInterval(timer)
  }, [])

  const activeBookings = bookings.filter((booking) =>
    isActiveDashboardBooking(booking, todayDate, now),
  )

  const upcomingBookings = bookings
    .filter((booking) => isEditableFutureBooking(booking, todayDate, now))
    .sort(
      (firstBooking, secondBooking) =>
        getBookingStartDate(firstBooking).getTime() -
        getBookingStartDate(secondBooking).getTime(),
    )

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === 'cancelled',
  )

  const completedBookings = bookings.filter(
    (booking) =>
      booking.status !== 'cancelled' && isCompletedBooking(booking, now),
  )

  const todayActiveBookings = activeBookings
    .filter((booking) => booking.date === todayDate)
    .sort(
      (firstBooking, secondBooking) =>
        getBookingStartDate(firstBooking).getTime() -
        getBookingStartDate(secondBooking).getTime(),
    )

  const displayedTodayActiveBooking =
    todayActiveBookings.length > 0
      ? todayActiveBookings[todayActiveIndex % todayActiveBookings.length]
      : undefined

  const completedActivityItems: DashboardActivity[] = completedBookings.map(
    (booking) => ({
      id: `completed-${booking.id}`,
      action: 'completed',
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: getBookingEndDate(booking).toISOString(),
    }),
  )

  const recentActivities: DashboardActivity[] = [
    ...activityItems,
    ...completedActivityItems,
  ]
    .sort(
      (firstActivity, secondActivity) =>
        getActivityTimestamp(secondActivity) -
        getActivityTimestamp(firstActivity),
    )
    .slice(0, 5)

  useEffect(() => {
    if (todayActiveBookings.length <= 1) {
      setTodayActiveIndex(0)
      return
    }

    setTodayActiveIndex(
      (currentIndex) => currentIndex % todayActiveBookings.length,
    )

    const timer = window.setInterval(() => {
      setTodayActiveIndex(
        (currentIndex) => (currentIndex + 1) % todayActiveBookings.length,
      )
    }, 3500)

    return () => window.clearInterval(timer)
  }, [todayActiveBookings.length])

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      <section className="relative min-h-[28rem] overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:min-h-[22rem] lg:p-10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(14,165,233,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative grid min-h-[inherit] gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to NexBook
            </h1>
            <div className="mt-4 max-w-2xl">
              <style>{`
                @keyframes dashboard-subtitle-enter {
                  from {
                    opacity: 0;
                    transform: translateY(0.5rem);
                  }

                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes dashboard-snapshot-enter {
                  from {
                    opacity: 0;
                    transform: translateY(0.5rem);
                  }

                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <p className="min-h-[4.5rem] text-base leading-7 text-blue-50/85 sm:min-h-14 sm:text-lg">
                <span
                  key={subtitleIndex}
                  className="block"
                  style={{
                    animation: 'dashboard-subtitle-enter 500ms ease-out both',
                  }}
                >
                  {dashboardSubtitles[subtitleIndex]}
                </span>
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book"
                className="min-h-11 rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-blue-800 shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Book a resource
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                View my bookings
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur transition-colors duration-300 ease-in-out">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Campus snapshot
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">
                  {activeBookings.length}
                </p>
                <p className="mt-1 text-xs font-medium text-blue-50/80">
                  Active bookings
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-sm font-semibold text-blue-50">
                  Active today
                </p>
                {displayedTodayActiveBooking ? (
                  <p
                    key={displayedTodayActiveBooking.id}
                    className="mt-1 text-sm leading-6 text-blue-50/80"
                    style={{
                      animation:
                        'dashboard-snapshot-enter 500ms ease-out both',
                    }}
                  >
                    {getResourceName(displayedTodayActiveBooking.resourceId)} at{' '}
                    {displayedTodayActiveBooking.startTime} -{' '}
                    {displayedTodayActiveBooking.endTime}
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-blue-50/80">
                    No active bookings today.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Your booking overview
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Bookings"
            value={activeBookings.length}
            helperText="Bookings currently in effect"
            accent="blue"
          />
          <StatCard
            label="Upcoming Bookings"
            value={upcomingBookings.length}
            helperText="Future reservations ahead"
            accent="indigo"
          />
          <StatCard
            label="Cancelled Bookings"
            value={cancelledBookings.length}
            helperText="Reservations you cancelled"
            accent="red"
          />
          <StatCard
            label="Completed Bookings"
            value={completedBookings.length}
            helperText="Bookings already finished"
            accent="emerald"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-white/60 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Recent activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Your latest booking updates
          </h2>
        </div>
        {recentActivities.length > 0 ? (
          <div className="mt-5 space-y-3">
            {recentActivities.map((activity) => {
              const styles = activityStyles[activity.action]

              return (
                <article
                  key={`${activity.action}-${activity.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-300 ease-in-out sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {getActivityMessage(activity)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {getActivityTime(activity, todayDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
                  >
                    {styles.label}
                  </span>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 transition-colors duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No activity yet. Create a booking to start your history.
          </p>
        )}
      </section>
    </main>
  )
}
