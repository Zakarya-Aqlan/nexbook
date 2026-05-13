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
    <main className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium text-blue-700">Dashboard</p>
        <h1 className="text-3xl font-bold">Welcome to NexBook</h1>
        <p className="max-w-2xl text-slate-600">
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
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Next Upcoming Booking
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {nextUpcomingBooking
                ? getResourceName(nextUpcomingBooking.resourceId)
                : 'No upcoming booking'}
            </h2>
          </div>

          {nextUpcomingBooking ? (
            <dl className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-900">Date</dt>
                <dd>{nextUpcomingBooking.date}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Time</dt>
                <dd>
                  {nextUpcomingBooking.startTime} -{' '}
                  {nextUpcomingBooking.endTime}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Student</dt>
                <dd>{nextUpcomingBooking.studentName}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Purpose</dt>
                <dd>{nextUpcomingBooking.purpose}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              Book a resource to see your next reservation here.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-700">Quick Actions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            What would you like to do?
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              to="/resources"
              className="rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              View Resources
            </Link>
            <Link
              to="/book"
              className="rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Book a Resource
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}
