import { useParams } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'

export function BookResource() {
  const { resourceId } = useParams()

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:p-10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(14,165,233,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Book
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Book a Resource
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/85 sm:text-lg">
              Choose a campus resource, pick a clear available slot, and submit
              your request with confidence.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur transition-colors duration-300 ease-in-out">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Booking Flow
            </p>
            <div className="mt-5 space-y-3 text-sm text-blue-50/85">
              <p className="rounded-xl bg-white/10 p-3">
                1. Select your resource and date
              </p>
              <p className="rounded-xl bg-white/10 p-3">
                2. Choose an available duration and slot
              </p>
              <p className="rounded-xl bg-white/10 p-3">
                3. Confirm details and manage it later
              </p>
            </div>
          </div>
        </div>
      </section>

      <BookingForm initialResourceId={resourceId} />
    </main>
  )
}
