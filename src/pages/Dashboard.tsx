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
  const resourceTypeCount = new Set(resources.map((resource) => resource.type))
    .size

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:p-10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(14,165,233,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to NexBook
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/85 sm:text-lg">
              View campus resources, create bookings, and track your
              reservations from one simple student dashboard.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book"
                className="min-h-11 rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-blue-800 shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Book a Resource
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                View My Bookings
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur transition-colors duration-300 ease-in-out">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Campus Snapshot
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-3xl font-bold">{resources.length}</p>
                <p className="mt-1 text-xs font-medium text-blue-50/80">
                  resources
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-3xl font-bold">{activeBookings.length}</p>
                <p className="mt-1 text-xs font-medium text-blue-50/80">
                  active
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-white/10 p-4">
                <p className="text-sm font-semibold text-blue-50">
                  Next step
                </p>
                <p className="mt-1 text-sm leading-6 text-blue-50/80">
                  {nextUpcomingBooking
                    ? `${getResourceName(nextUpcomingBooking.resourceId)} is next on your schedule.`
                    : 'Book a space to start building your campus schedule.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Overview
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Your campus booking workspace
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Resources"
            value={resources.length}
            helperText="Available campus spaces and equipment"
            marker="R"
            accent="blue"
          />
          <StatCard
            label="Active Bookings"
            value={activeBookings.length}
            helperText="Current and upcoming non-cancelled bookings"
            marker="A"
            accent="emerald"
          />
          <StatCard
            label="Cancelled Bookings"
            value={cancelledBookings.length}
            helperText="Bookings cancelled by students"
            marker="C"
            accent="amber"
          />
          <StatCard
            label="Upcoming Bookings"
            value={upcomingBookings.length}
            helperText="Bookings scheduled for later"
            marker="U"
            accent="indigo"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-white/60 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
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
            <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-300 ease-in-out sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
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
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No upcoming booking yet
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Book a resource to see your next reservation here.
              </p>
            </div>
          )}
        </article>

        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-white/60 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Quick Actions
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Move your booking forward
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/resources"
                className="min-h-11 rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus:ring-blue-900"
              >
                View Resources
              </Link>
              <Link
                to="/book"
                className="min-h-11 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
              >
                Book a Resource
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors duration-300 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
              >
                Manage Bookings
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm ring-1 ring-white/60 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30 dark:ring-slate-800">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Booking Health
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Availability summary
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Resource categories
                </span>
                <span className="font-semibold text-slate-950 dark:text-white">
                  {resourceTypeCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Upcoming reservations
                </span>
                <span className="font-semibold text-slate-950 dark:text-white">
                  {upcomingBookings.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Cancelled reservations
                </span>
                <span className="font-semibold text-slate-950 dark:text-white">
                  {cancelledBookings.length}
                </span>
              </div>
            </div>
            <p className="mt-5 rounded-xl bg-white/70 p-4 text-sm leading-6 text-slate-600 transition-colors duration-300 ease-in-out dark:bg-slate-950/70 dark:text-slate-400">
              {upcomingBookings.length > 0
                ? 'Your next reservation is ready to review. Check your booking details before heading to campus.'
                : 'No upcoming reservations yet. Start by browsing available resources or creating a booking.'}
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
