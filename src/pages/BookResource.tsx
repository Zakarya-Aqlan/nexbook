import { useParams } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'

export function BookResource() {
  const { resourceId } = useParams()

  return (
    <main className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Book
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          Book a Resource
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
          Choose a campus resource, pick a time, and submit your booking
          request.
        </p>
      </section>

      <BookingForm initialResourceId={resourceId} />
    </main>
  )
}
