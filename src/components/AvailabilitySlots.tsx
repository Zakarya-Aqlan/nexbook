import type { Resource } from '../types'
import {
  getAvailabilitySlots,
  getDurationHourLabel,
  minimumBookingDuration,
  timeToMinutes,
} from '../utils/availabilityUtils'
import { getBookings } from '../utils/storage'

const DURATIONS = [
  { label: '1 hour', mins: 60 },
  { label: '2 hours', mins: 120 },
  { label: '3 hours', mins: 180 },
]

type AvailabilitySlotsProps = {
  resource: Resource | undefined
  date: string
  excludeBookingId?: string
  currentSlot?: {
    startTime: string
    endTime: string
  }
  duration: number
  selectedStartTime?: string
  selectedEndTime?: string
  onDurationChange: (duration: number) => void
  onSelectSlot: (startTime: string, endTime: string) => void
}

export function AvailabilitySlots({
  resource,
  date,
  excludeBookingId,
  currentSlot,
  duration,
  selectedStartTime,
  selectedEndTime,
  onDurationChange,
  onSelectSlot,
}: AvailabilitySlotsProps) {
  if (!resource) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        Choose a resource to see slots.
      </p>
    )
  }

  if (!date) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        Select a date to see slots.
      </p>
    )
  }

  const activeResource = resource
  const bookings = getBookings()
  const closeMins = timeToMinutes(activeResource.closingTime)

  function handleDurationChange(newDur: number) {
    onDurationChange(newDur)

    if (selectedStartTime) {
      const updatedSlots = getAvailabilitySlots({
        resource: activeResource,
        date,
        duration: newDur,
        bookings,
        excludeBookingId,
      })
      const matchingSlot = updatedSlots.find(
        (slot) => slot.start === selectedStartTime && !slot.unavailable,
      )

      if (matchingSlot && timeToMinutes(matchingSlot.endLabel) <= closeMins) {
        onSelectSlot(selectedStartTime, matchingSlot.endLabel)
        return
      }

      onSelectSlot('', '')
    }
  }

  const visibleSlots = getAvailabilitySlots({
    resource: activeResource,
    date,
    duration,
    bookings,
    excludeBookingId,
  })

  function isCurrentSlot(start: string, end: string) {
    return currentSlot?.startTime === start && currentSlot.endTime === end
  }

  const hasAnyAvailable = visibleSlots.some(
    (slot) => !slot.unavailable && !isCurrentSlot(slot.start, slot.endLabel),
  )
  const hasCurrentSlot = visibleSlots.some((slot) =>
    isCurrentSlot(slot.start, slot.endLabel),
  )
  const noSlotsMessage =
    duration === minimumBookingDuration
      ? `No ${getDurationHourLabel(duration)} slots left for this resource. Try another date or resource.`
      : `No ${getDurationHourLabel(duration)} slots left for this resource. Try a shorter duration or another date.`

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Duration
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map(({ label, mins }) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleDurationChange(mins)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
                duration === mins
                  ? 'bg-blue-700 text-white dark:bg-blue-600'
                  : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950" />
          Available
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700" />
          Booked
        </span>
        <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" />
          Past
        </span>
        <span className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
          Selected
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Slots for {date}
      </p>

      {visibleSlots.length === 0 || (!hasAnyAvailable && !hasCurrentSlot) ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          {noSlotsMessage}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visibleSlots.map(
            ({ start, endLabel, unavailable, unavailableReason }) => {
              const isOriginalSlot = isCurrentSlot(start, endLabel)
              const isSelected =
                start === selectedStartTime && endLabel === selectedEndTime

              if (isOriginalSlot) {
                return (
                  <span
                    key={start}
                    className="flex flex-col items-center rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-500 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <span>
                      {start}-{endLabel}
                    </span>
                    <span className="text-[10px] leading-none">Current</span>
                  </span>
                )
              }

              if (unavailable) {
                return (
                  <span
                    key={start}
                    className={`flex flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition-colors duration-300 ease-in-out ${
                      unavailableReason === 'past'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400'
                        : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    <span>
                      {start}-{endLabel}
                    </span>
                    <span className="text-[10px] leading-none">
                      {unavailableReason === 'past' ? 'Past' : 'Booked'}
                    </span>
                  </span>
                )
              }

              if (isSelected) {
                return (
                  <button
                    key={start}
                    type="button"
                    onClick={() => onSelectSlot(start, endLabel)}
                    className="flex flex-col items-center rounded-lg border-2 border-blue-700 bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-900"
                  >
                    <span>
                      {start}-{endLabel}
                    </span>
                    <span className="text-[10px] font-normal leading-none opacity-90">
                      Selected
                    </span>
                  </button>
                )
              }

              return (
                <button
                  key={start}
                  type="button"
                  onClick={() => onSelectSlot(start, endLabel)}
                  className="flex flex-col items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors duration-300 ease-in-out hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-200 dark:focus:ring-blue-900"
                >
                  <span>
                    {start}-{endLabel}
                  </span>
                </button>
              )
            },
          )}
        </div>
      )}

      {selectedStartTime &&
        selectedEndTime &&
        !isCurrentSlot(selectedStartTime, selectedEndTime) && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-100 transition-colors duration-300 ease-in-out dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900">
          Selected time: {selectedStartTime} - {selectedEndTime}
        </p>
      )}
    </div>
  )
}
