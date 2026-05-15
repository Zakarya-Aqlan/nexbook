import { useEffect, useMemo, useRef, useState } from 'react'
import { getTodayDate } from '../utils/dateUtils'

type DatePickerProps = {
  label: string
  value: string
  onChange: (date: string) => void
  minDate?: string
  placeholder?: string
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${
        isOpen ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function isBeforeMonth(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() < secondDate.getFullYear() ||
    (firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() < secondDate.getMonth())
  )
}

export function DatePicker({
  label,
  value,
  onChange,
  minDate = getTodayDate(),
  placeholder = 'Choose a date',
}: DatePickerProps) {
  const selectedDate = parseDateValue(value)
  const minDateObject = parseDateValue(minDate) ?? parseDateValue(getTodayDate())!
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(selectedDate ?? minDateObject),
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const todayValue = getTodayDate()

  useEffect(() => {
    const nextSelectedDate = parseDateValue(value)

    if (nextSelectedDate) {
      setVisibleMonth(getMonthStart(nextSelectedDate))
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getDate()
    const leadingBlankDays = visibleMonth.getDay()

    return {
      blanks: Array.from({ length: leadingBlankDays }, (_, index) => index),
      days: Array.from({ length: daysInMonth }, (_, index) => index + 1),
    }
  }, [visibleMonth])

  const previousMonth = addMonths(visibleMonth, -1)
  const previousDisabled = isBeforeMonth(previousMonth, getMonthStart(minDateObject))

  function handleSelectDate(day: number) {
    const selected = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day,
    )
    const selectedValue = formatDateValue(selected)

    if (selected < minDateObject) {
      return
    }

    onChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative space-y-2 sm:max-w-xs">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors duration-300 ease-in-out hover:border-slate-400 hover:bg-slate-50 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:focus:border-blue-500 dark:focus:ring-blue-900"
      >
        <span
          className={
            value
              ? 'font-medium text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500'
          }
        >
          {value || placeholder}
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-full min-w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-800">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth(previousMonth)}
              disabled={previousDisabled}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors duration-300 ease-in-out hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {getMonthLabel(visibleMonth)}
            </p>
            <button
              type="button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors duration-300 ease-in-out hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <span
                key={day}
                className="py-1 text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500"
              >
                {day}
              </span>
            ))}

            {calendarDays.blanks.map((blank) => (
              <span key={blank} aria-hidden="true" className="h-9" />
            ))}

            {calendarDays.days.map((day) => {
              const date = new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                day,
              )
              const dateValue = formatDateValue(date)
              const isDisabled = date < minDateObject
              const isSelected = dateValue === value
              const isToday = dateValue === todayValue

              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  disabled={isDisabled}
                  className={`h-9 rounded-lg text-sm font-medium transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                      : isDisabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300'
                  } ${isToday && !isSelected ? 'ring-1 ring-blue-200 dark:ring-blue-900' : ''}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
