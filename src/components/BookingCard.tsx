import type { Booking } from '../types'

type BookingCardProps = {
  booking: Booking
  resourceName: string
  groupLabel: 'Active' | 'Cancelled' | 'Completed'
  displayStatus: string
  canEdit: boolean
  canCancel: boolean
  remainingEdits?: number
  onCancel: (bookingId: string) => void
  onEdit: (booking: Booking) => void
}

const statusStyles = {
  Active: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
  Cancelled:
    'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
  Completed:
    'bg-green-50 text-green-700 ring-green-100 dark:bg-green-950 dark:text-green-300 dark:ring-green-900',
}

export function BookingCard({
  booking,
  resourceName,
  groupLabel,
  displayStatus,
  canEdit,
  canCancel,
  remainingEdits,
  onCancel,
  onEdit,
}: BookingCardProps) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {resourceName}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {booking.date}, {booking.startTime} - {booking.endTime}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 transition-colors duration-300 ease-in-out ${statusStyles[groupLabel]}`}
        >
          {groupLabel}
        </span>
      </div>

      {groupLabel === 'Active' && remainingEdits !== undefined && (
        <p className="mt-4 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors duration-300 ease-in-out dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
          {remainingEdits > 0
            ? `Edits left: ${remainingEdits}`
            : 'No edits left'}
        </p>
      )}

      <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-300 ease-in-out sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div>
          <dt className="font-semibold text-slate-900 dark:text-slate-100">
            Student
          </dt>
          <dd>{booking.studentName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900 dark:text-slate-100">
            Status
          </dt>
          <dd>{displayStatus}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-slate-900 dark:text-slate-100">
            Purpose
          </dt>
          <dd className="leading-6">{booking.purpose}</dd>
        </div>
      </dl>

      {(canEdit || canCancel) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(booking)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950 dark:hover:text-blue-300 dark:focus:ring-blue-900"
            >
              Edit
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-900"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}
    </article>
  )
}
