import type { Booking } from '../types'

type BookingCardProps = {
  booking: Booking
  resourceName: string
  groupLabel: 'Active' | 'Cancelled' | 'Completed'
  canManage: boolean
  onCancel: (bookingId: string) => void
  onEdit: (booking: Booking) => void
}

const statusStyles = {
  Active: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-700',
  Completed: 'bg-green-50 text-green-700',
}

export function BookingCard({
  booking,
  resourceName,
  groupLabel,
  canManage,
  onCancel,
  onEdit,
}: BookingCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {resourceName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {booking.date}, {booking.startTime} - {booking.endTime}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[groupLabel]}`}
        >
          {groupLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-900">Student</dt>
          <dd>{booking.studentName}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Status</dt>
          <dd className="capitalize">{booking.status}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-900">Purpose</dt>
          <dd>{booking.purpose}</dd>
        </div>
      </dl>

      {canManage && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(booking)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Cancel Booking
          </button>
        </div>
      )}
    </article>
  )
}
