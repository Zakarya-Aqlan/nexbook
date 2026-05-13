import { Link } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import { getBookings } from '../utils/storage'

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

export function Dashboard() {
  const bookings = getBookings()
  const now = new Date()

  const activeBookings = bookings.filter(
    (booking) =>
      booking.status !== 'cancelled' && getBookingEndDate(booking) >= now,
  )

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === 'cancelled',
  )

  const upcomingBookings = activeBookings
    .filter((booking) => getBookingStartDate(booking) > now)
    .sort(
      (firstBooking, secondBooking) =>
        getBookingStartDate(firstBooking).getTime() -
        getBookingStartDate(secondBooking).getTime(),
    )

  const nextUpcomingBooking = upcomingBookings[0]

  return (
    <main className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Dashboard
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          Welcome to NexBook
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
          View campus resources, create bookings, and track your reservations
          from one simple student dashboard.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Resources"
          value={resources.length}
          helperText="Available campus spaces and equipment"
        />
        <StatCard
          label="Active Bookings"
          value={activeBookings.length}
          helperText="Current and upcoming non-cancelled bookings"
        />
        <StatCard
          label="Cancelled Bookings"
          value={cancelledBookings.length}
          helperText="Bookings cancelled by students"
        />
        <StatCard
          label="Upcoming Bookings"
          value={upcomingBookings.length}
          helperText="Bookings scheduled for later"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Next Upcoming Booking
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {nextUpcomingBooking
                ? getResourceName(nextUpcomingBooking.resourceId)
                : 'No upcoming booking'}
            </h2>
          </div>

          {nextUpcomingBooking ? (
            <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-300 sm:grid-cols-2 dark:bg-slate-950 dark:text-slate-400">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Date
                </dt>
                <dd>{nextUpcomingBooking.date}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Time
                </dt>
                <dd>
                  {nextUpcomingBooking.startTime} -{' '}
                  {nextUpcomingBooking.endTime}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Student
                </dt>
                <dd>{nextUpcomingBooking.studentName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Purpose
                </dt>
                <dd>{nextUpcomingBooking.purpose}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
              Book a resource to see your next reservation here.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Quick Actions
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            What would you like to do?
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              to="/resources"
              className="min-h-11 rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition-colors duration-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus:ring-blue-900"
            >
              View Resources
            </Link>
            <Link
              to="/book"
              className="min-h-11 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
            >
              Book a Resource
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}
