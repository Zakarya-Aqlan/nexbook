import type { Booking } from '../types'

type BookingCardProps = {
  booking: Booking
  resourceName: string
  groupLabel: 'Active' | 'Cancelled' | 'Completed'
  displayStatus: string
  canManage: boolean
  onCancel: (bookingId: string) => void
  onEdit: (booking: Booking) => void
}

const statusStyles = {
  Active: 'bg-blue-50 text-blue-700 ring-blue-100',
  Cancelled: 'bg-red-50 text-red-700 ring-red-100',
  Completed: 'bg-green-50 text-green-700 ring-green-100',
}

export function BookingCard({
  booking,
  resourceName,
  groupLabel,
  displayStatus,
  canManage,
  onCancel,
  onEdit,
}: BookingCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {resourceName}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {booking.date}, {booking.startTime} - {booking.endTime}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${statusStyles[groupLabel]}`}
        >
          {groupLabel}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-900">Student</dt>
          <dd>{booking.studentName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Status</dt>
          <dd>{displayStatus}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-slate-900">Purpose</dt>
          <dd className="leading-6">{booking.purpose}</dd>
        </div>
      </dl>

      {canManage && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(booking)}
            className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            Cancel Booking
          </button>
        </div>
      )}
    </article>
  )
}
