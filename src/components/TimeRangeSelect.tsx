import { useMemo } from 'react'
import type { Resource } from '../types'

const MINUTE_OPTIONS = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
]

function buildHourOptions(resource: Resource | undefined): string[] {
  if (!resource) return []
  const [openH] = resource.openingTime.split(':').map(Number)
  const [closeH, closeM] = resource.closingTime.split(':').map(Number)
  const startHour = openH
  const endHour = Math.min(23, closeM > 0 ? closeH + 1 : closeH)
  const hours: string[] = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(String(h).padStart(2, '0'))
  }
  return hours
}

type TimeRangeSelectProps = {
  resource: Resource | undefined
  startTime: string
  endTime: string
  onChangeStartTime: (time: string) => void
  onChangeEndTime: (time: string) => void
}

export function TimeRangeSelect({
  resource,
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
}: TimeRangeSelectProps) {
  const hourOptions = useMemo(() => buildHourOptions(resource), [resource])

  const startHour = startTime ? startTime.split(':')[0] : ''
  const startMinute = startTime ? startTime.split(':')[1] : ''
  const endHour = endTime ? endTime.split(':')[0] : ''
  const endMinute = endTime ? endTime.split(':')[1] : ''
  const timesDisabled = !resource

  function updateStartHour(hour: string) {
    const minute = startMinute || '00'
    onChangeStartTime(hour ? `${hour}:${minute}` : '')
  }

  function updateStartMinute(minute: string) {
    if (!startHour) return
    onChangeStartTime(`${startHour}:${minute}`)
  }

  function updateEndHour(hour: string) {
    const minute = endMinute || '00'
    onChangeEndTime(hour ? `${hour}:${minute}` : '')
  }

  function updateEndMinute(minute: string) {
    if (!endHour) return
    onChangeEndTime(`${endHour}:${minute}`)
  }

  return (
    <>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Start Time
        </span>
        <div className="flex gap-2">
          <select
            value={startHour}
            onChange={(event) => updateStartHour(event.target.value)}
            disabled={timesDisabled}
            aria-label="Start hour"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            <option value="">HH</option>
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
          <select
            value={startMinute}
            onChange={(event) => updateStartMinute(event.target.value)}
            disabled={timesDisabled || !startHour}
            aria-label="Start minute"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            <option value="">MM</option>
            {MINUTE_OPTIONS.map((minute) => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          End Time
        </span>
        <div className="flex gap-2">
          <select
            value={endHour}
            onChange={(event) => updateEndHour(event.target.value)}
            disabled={timesDisabled}
            aria-label="End hour"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            <option value="">HH</option>
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
          <select
            value={endMinute}
            onChange={(event) => updateEndMinute(event.target.value)}
            disabled={timesDisabled || !endHour}
            aria-label="End minute"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            <option value="">MM</option>
            {MINUTE_OPTIONS.map((minute) => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </select>
        </div>
      </label>
    </>
  )
}
