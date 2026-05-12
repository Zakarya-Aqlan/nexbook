import { useParams } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'

export function BookResource() {
  const { resourceId } = useParams()

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium text-blue-700">Book</p>
        <h1 className="text-3xl font-bold">Book a Resource</h1>
        <p className="max-w-2xl text-slate-600">
          Choose a campus resource, pick a time, and submit your booking
          request.
        </p>
      </section>

      <BookingForm initialResourceId={resourceId} />
    </main>
  )
}
