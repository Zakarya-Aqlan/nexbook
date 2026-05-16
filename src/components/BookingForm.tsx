import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import {
  getAvailableSlotCount,
  getDurationHourLabel,
  getNoRemainingTodayError,
  getPastSameDayTimeError,
  minimumBookingDuration,
} from '../utils/availabilityUtils'
import {
  getDurationError,
  getOpeningHoursError,
  getPastDateError,
  getTimeRangeError,
  hasBookingConflict,
} from '../utils/bookingUtils'
import { getTodayDate } from '../utils/dateUtils'
import { addBooking, getBookings } from '../utils/storage'
import {
  formatStudentIdForDisplay,
  formatStudentIdForStorage,
  getStudentIdDigits,
} from '../utils/studentIdUtils'
import { AvailabilitySlots } from './AvailabilitySlots'
import { DatePicker } from './DatePicker'
import { ResourceSelect } from './ResourceSelect'
import type { ResourceSelectLabels } from './ResourceSelect'
import { SameDayBookingModal } from './SameDayBookingModal'

type BookingFormProps = {
  initialResourceId?: string
}

type BookingFormValues = {
  studentName: string
  studentId: string
  resourceId: string
  date: string
  startTime: string
  endTime: string
}

const emptyForm: BookingFormValues = {
  studentName: '',
  studentId: '',
  resourceId: '',
  date: '',
  startTime: '',
  endTime: '',
}

function getStudentNameError(studentName: string) {
  if (!studentName || /^[A-Za-z ]+$/.test(studentName)) {
    return ''
  }

  return 'Student name: use letters and spaces only.'
}

function getStudentIdError(studentId: string) {
  if (!studentId || /^[0-9]{6}$/.test(studentId)) {
    return ''
  }

  return 'Student ID must be 6 digits.'
}

function getSlotWord(count: number) {
  return count === 1 ? 'slot' : 'slots'
}

function getResourceAvailabilityLabel(
  minimumSlotCount: number,
  selectedDurationSlotCount: number,
  selectedDuration: number,
  selectedDateIsToday: boolean,
): ResourceSelectLabels[string] {
  if (minimumSlotCount === 0) {
    return {
      text: selectedDateIsToday ? 'Unavailable today' : 'Unavailable on this date',
      tone: 'warning',
    }
  }

  if (
    selectedDuration > minimumBookingDuration &&
    selectedDurationSlotCount === 0
  ) {
    return {
      text: `No ${getDurationHourLabel(selectedDuration)} slots left`,
      tone: 'warning',
    }
  }

  if (selectedDateIsToday && minimumSlotCount <= 2) {
    return {
      text: `Closing soon - ${minimumSlotCount} ${getSlotWord(
        minimumSlotCount,
      )} left`,
      tone: 'warning',
    }
  }

  return {
    text: `${selectedDurationSlotCount} ${getSlotWord(
      selectedDurationSlotCount,
    )} available`,
    tone: 'success',
  }
}

export function BookingForm({ initialResourceId }: BookingFormProps) {
  const [form, setForm] = useState<BookingFormValues>(emptyForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [pendingSameDayBooking, setPendingSameDayBooking] =
    useState<Booking | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  useEffect(() => {
    const resourceExists = resources.some(
      (resource) => resource.id === initialResourceId,
    )

    setForm((currentForm) => ({
      ...currentForm,
      resourceId: resourceExists && initialResourceId ? initialResourceId : '',
    }))
  }, [initialResourceId])

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === form.resourceId),
    [form.resourceId],
  )
  const confirmedResource = useMemo(
    () =>
      confirmedBooking
        ? resources.find((resource) => resource.id === confirmedBooking.resourceId)
        : undefined,
    [confirmedBooking],
  )
  const savedBookings = getBookings()
  const selectedDateIsToday = form.date === getTodayDate()
  const selectedDateResourceAvailability = form.date
    ? resources.map((resource) => ({
        resourceId: resource.id,
        minimumSlotCount: getAvailableSlotCount({
          resource,
          date: form.date,
          duration: minimumBookingDuration,
          bookings: savedBookings,
        }),
        selectedDurationSlotCount: getAvailableSlotCount({
          resource,
          date: form.date,
          duration: selectedDuration,
          bookings: savedBookings,
        }),
      }))
    : []
  const unavailableSelectedDateResourceIds = selectedDateResourceAvailability
    .filter(({ minimumSlotCount }) => minimumSlotCount === 0)
    .map(({ resourceId }) => resourceId)
  const selectedDateResourceLabels =
    selectedDateResourceAvailability.reduce<ResourceSelectLabels>(
      (labels, resourceAvailability) => ({
        ...labels,
        [resourceAvailability.resourceId]: getResourceAvailabilityLabel(
          resourceAvailability.minimumSlotCount,
          resourceAvailability.selectedDurationSlotCount,
          selectedDuration,
          selectedDateIsToday,
        ),
      }),
      {},
    )
  const todayIsNoLongerBookable =
    selectedDateIsToday &&
    selectedDateResourceAvailability.length > 0 &&
    selectedDateResourceAvailability.every(
      ({ minimumSlotCount }) => minimumSlotCount === 0,
    )
  const minBookingDate = getTodayDate()

  const studentNameError = getStudentNameError(form.studentName)
  const studentIdError = getStudentIdError(form.studentId)
  const fieldValidationErrors = [studentNameError, studentIdError].filter(Boolean)

  function updateField(field: keyof BookingFormValues, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  function getRequiredFieldError() {
    if (!form.studentName.trim()) {
      return 'Enter a student name.'
    }

    if (!form.studentId.trim()) {
      return 'Enter a student ID.'
    }

    if (!form.resourceId) {
      return 'Choose a resource.'
    }

    if (!form.date) {
      return 'Choose a date.'
    }

    if (!form.startTime) {
      return 'Choose a start time.'
    }

    if (!form.endTime) {
      return 'Choose an end time.'
    }

    return null
  }

  function saveBooking(booking: Booking) {
    addBooking(booking)
    setConfirmedBooking(booking)
    setSuccessMessage('Booking saved.')
    setErrorMessage('')
    setPendingSameDayBooking(null)
    setSelectedDuration(60)
    setForm((currentForm) => ({
      ...currentForm,
      resourceId: '',
      date: '',
      startTime: '',
      endTime: '',
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const requiredFieldError = getRequiredFieldError()

    if (requiredFieldError) {
      setErrorMessage(requiredFieldError)
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    if (fieldValidationErrors.length > 0) {
      setErrorMessage(fieldValidationErrors.join('\n'))
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    if (!selectedResource) {
      setErrorMessage('Choose a valid resource.')
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      resourceId: form.resourceId,
      studentName: form.studentName.trim(),
      studentId: formatStudentIdForStorage(form.studentId),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      remainingEdits: 2,
    }

    const existingBookings = getBookings()
    const validationError =
      getPastDateError(newBooking.date) ||
      getTimeRangeError(newBooking.startTime, newBooking.endTime) ||
      getDurationError(newBooking.startTime, newBooking.endTime) ||
      getOpeningHoursError(
        selectedResource,
        newBooking.startTime,
        newBooking.endTime,
      ) ||
      getPastSameDayTimeError(newBooking.date, newBooking.startTime) ||
      getNoRemainingTodayError(
        selectedResource,
        newBooking.date,
        existingBookings,
      ) ||
      hasBookingConflict(newBooking, existingBookings)

    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    if (newBooking.date === getTodayDate()) {
      setPendingSameDayBooking(newBooking)
      setConfirmedBooking(null)
      setSuccessMessage('')
      setErrorMessage('')
      return
    }

    saveBooking(newBooking)
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      {pendingSameDayBooking && (
        <SameDayBookingModal
          onConfirm={() => saveBooking(pendingSameDayBooking)}
          onEditDetails={() => setPendingSameDayBooking(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800"
      >
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Student details
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Student information
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Student name
              </span>
              <input
                type="text"
                value={form.studentName}
                onChange={(event) =>
                  updateField('studentName', event.target.value)
                }
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors duration-300 ease-in-out placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Zakarya Aqlan"
              />
              {studentNameError && (
                <p className="rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300">
                  {studentNameError}
                </p>
              )}
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Student ID
              </span>
              <div className="flex min-h-11 w-full overflow-hidden rounded-lg border border-slate-300 bg-white text-sm text-slate-900 shadow-sm transition-colors duration-300 ease-in-out hover:border-slate-400 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 font-semibold text-slate-600 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  TP
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.studentId}
                  onChange={(event) =>
                    updateField('studentId', getStudentIdDigits(event.target.value))
                  }
                  className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="085953"
                  aria-label="Student ID digits"
                />
              </div>
              {studentIdError && (
                <p className="rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300">
                  {studentIdError}
                </p>
              )}
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-300 ease-in-out sm:p-5 dark:border-slate-800 dark:bg-slate-950/60">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Resource and availability
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Choose a resource and time
            </h2>
          </div>

          <DatePicker
            label="Date"
            value={form.date}
            minDate={minBookingDate}
            onChange={(date) => {
              setForm((currentForm) => ({
                ...currentForm,
                date,
                startTime: '',
                endTime: '',
              }))
              setErrorMessage('')
              setSuccessMessage('')
            }}
          />
          {todayIsNoLongerBookable && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 transition-colors duration-300 ease-in-out dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              No bookings are available today. Choose another date.
            </p>
          )}
          <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Select a date to view available resources and slots.
          </p>

          <ResourceSelect
            label="Resource"
            resources={resources}
            value={form.date ? form.resourceId : ''}
            unavailableResourceIds={
              form.date ? unavailableSelectedDateResourceIds : []
            }
            resourceLabels={form.date ? selectedDateResourceLabels : {}}
            disabled={!form.date}
            onChange={(resourceId) => {
              setForm((currentForm) => ({
                ...currentForm,
                resourceId,
                startTime: '',
                endTime: '',
              }))
              setErrorMessage('')
              setSuccessMessage('')
            }}
          />

          {form.date && selectedResource && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 transition-colors duration-300 ease-in-out dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
              <p className="font-semibold">{selectedResource.name}</p>
              <p className="mt-1 leading-6">
                {selectedResource.location}
                <span className="mx-2 text-blue-300 dark:text-blue-700">|</span>
                Capacity {selectedResource.capacity}
              </p>
              <p>
                Open {selectedResource.openingTime} -{' '}
                {selectedResource.closingTime}
              </p>
            </div>
          )}

          {form.date && selectedResource && (
            <section className="space-y-4 border-t border-slate-200 pt-5 transition-colors duration-300 ease-in-out dark:border-slate-800">
              <AvailabilitySlots
                resource={selectedResource}
                date={form.date}
                duration={selectedDuration}
                selectedStartTime={form.startTime}
                selectedEndTime={form.endTime}
                onDurationChange={setSelectedDuration}
                onSelectSlot={(startTime, endTime) => {
                  updateField('startTime', startTime)
                  updateField('endTime', endTime)
                }}
              />
            </section>
          )}
        </section>

        {errorMessage && (
          <p className="whitespace-pre-line rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border border-green-100 border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:border-green-900 dark:border-l-green-500 dark:bg-green-950 dark:text-green-300">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          className="min-h-11 w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-auto dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
        >
          Submit booking
        </button>
      </form>

      <aside className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Summary
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
          Booking summary
        </h2>

        {confirmedBooking && confirmedResource ? (
          <>
            <p className="mt-4 rounded-lg border border-green-100 border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:border-green-900 dark:border-l-green-500 dark:bg-green-950 dark:text-green-300">
              Booking confirmed.
            </p>
            <dl className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Resource
                </dt>
                <dd>{confirmedResource.name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Student
                </dt>
                <dd>{`${confirmedBooking.studentName} (${formatStudentIdForDisplay(
                  confirmedBooking.studentId,
                )})`}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Date and time
                </dt>
                <dd>
                  {confirmedBooking.date}, {confirmedBooking.startTime} -{' '}
                  {confirmedBooking.endTime}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Status
                </dt>
                <dd className="capitalize">{confirmedBooking.status}</dd>
              </div>
            </dl>
            <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800 transition-colors duration-300 ease-in-out dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              {confirmedBooking.date === getTodayDate()
                ? 'Same-day bookings cannot be edited after submission. You can still cancel this booking.'
                : 'You can edit future bookings before the booking date. Same-day bookings cannot be edited.'}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors duration-300 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950 dark:hover:text-blue-300 dark:focus:ring-blue-900"
              >
                Go to dashboard
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
              >
                View my bookings
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Submit a valid booking to see details here.
          </p>
        )}
      </aside>
    </section>
  )
}
