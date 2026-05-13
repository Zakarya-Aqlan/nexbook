import { useState } from 'react'
import type { Booking, Resource } from '../types'
import { getBookings } from '../utils/storage'

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateSlots(resource: Resource, duration: number): string[] {
  const open = timeToMinutes(resource.openingTime)
  const close = timeToMinutes(resource.closingTime)
  const slots: string[] = []

  for (let m = open; m + duration <= close; m += duration) {
    slots.push(minutesToTime(m))
  }

  return slots
}

function hasConflict(
  startMins: number,
  endMins: number,
  bookings: Booking[],
  resourceId: string,
  date: string,
  excludeBookingId: string | undefined,
) {
  return bookings.some((b) => {
    if (
      b.id === excludeBookingId ||
      b.resourceId !== resourceId ||
      b.date !== date ||
      b.status === 'cancelled'
    ) {
      return false
    }
    const bs = timeToMinutes(b.startTime)
    const be = timeToMinutes(b.endTime)
    return startMins < be && endMins > bs
  })
}

const DURATIONS = [
  { label: '1 hour', mins: 60 },
  { label: '2 hours', mins: 120 },
  { label: '3 hours', mins: 180 },
]

type AvailabilitySlotsProps = {
  resource: Resource | undefined
  date: string
  excludeBookingId?: string
  selectedStartTime?: string
  selectedEndTime?: string
  onSelectSlot: (startTime: string, endTime: string) => void
}

export function AvailabilitySlots({
  resource,
  date,
  excludeBookingId,
  selectedStartTime,
  selectedEndTime,
  onSelectSlot,
}: AvailabilitySlotsProps) {
  const [duration, setDuration] = useState(60)

  if (!resource) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Choose a resource to view availability.
      </p>
    )
  }

  if (!date) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Select a date to view availability.
      </p>
    )
  }

  const bookings = getBookings()
  const slots = generateSlots(resource, duration)
  const closeMins = timeToMinutes(resource.closingTime)
  const resourceId = resource.id

  function handleDurationChange(newDur: number) {
    setDuration(newDur)
    if (selectedStartTime) {
      const start = timeToMinutes(selectedStartTime)
      const end = start + newDur
      if (
        end <= closeMins &&
        !hasConflict(start, end, bookings, resourceId, date, excludeBookingId)
      ) {
        onSelectSlot(selectedStartTime, minutesToTime(end))
      }
    }
  }

  const visibleSlots = slots
    .map((start) => {
      const startMins = timeToMinutes(start)
      const endMins = startMins + duration
      const unavailable = hasConflict(
        startMins,
        endMins,
        bookings,
        resourceId,
        date,
        excludeBookingId,
      )
      return { start, endLabel: minutesToTime(endMins), unavailable }
    })
    .filter((slot): slot is { start: string; endLabel: string; unavailable: boolean } => slot !== null)

  const hasAnyAvailable = visibleSlots.some((slot) => !slot.unavailable)

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Duration
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map(({ label, mins }) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleDurationChange(mins)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                duration === mins
                  ? 'bg-blue-700 text-white dark:bg-blue-600'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700'
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
        <span className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
          Selected
        </span>
      </div>

      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Availability for {date}
      </p>

      {visibleSlots.length === 0 || !hasAnyAvailable ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          No available slots for this duration. Try a shorter duration or another date.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visibleSlots.map(({ start, endLabel, unavailable }) => {
            const isSelected =
              start === selectedStartTime && endLabel === selectedEndTime

            if (isSelected) {
              return (
                <button
                  key={start}
                  type="button"
                  onClick={() => onSelectSlot(start, endLabel)}
                  className="flex flex-col items-center rounded border-2 border-blue-700 bg-blue-700 px-2 py-1 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-800 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <span>{start}–{endLabel}</span>
                  <span className="text-[10px] font-normal leading-none opacity-90">✓ Selected</span>
                </button>
              )
            }

            if (unavailable) {
              return (
                <span
                  key={start}
                  className="flex flex-col items-center rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                >
                  <span>{start}</span>
                  <span className="text-[10px] leading-none">Booked</span>
                </span>
              )
            }

            return (
              <button
                key={start}
                type="button"
                onClick={() => onSelectSlot(start, endLabel)}
                className="flex flex-col items-center rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 transition-colors duration-150 hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-200"
              >
                <span>{start}–{endLabel}</span>
              </button>
            )
          })}
        </div>
      )}

      {selectedStartTime && selectedEndTime && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900">
          Selected Time: {selectedStartTime} – {selectedEndTime}
        </p>
      )}
    </div>
  )
}
