import { useParams } from 'react-router-dom'

export function BookResource() {
  const { resourceId } = useParams()

  return (
    <main className="space-y-4">
      <p className="text-sm font-medium text-blue-700">Book</p>
      <h1 className="text-3xl font-bold">Book a Resource</h1>
      <p className="max-w-2xl text-slate-600">
        {resourceId
          ? `Booking form placeholder for resource: ${resourceId}`
          : 'Choose a resource and time slot to create a booking.'}
      </p>
    </main>
  )
}
