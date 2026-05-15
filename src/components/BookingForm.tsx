import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import {
  getNoRemainingTodayError,
  getPastSameDayTimeError,
  hasAvailableSlotForResource,
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
import { AvailabilitySlots } from './AvailabilitySlots'
import { DatePicker } from './DatePicker'
import { ResourceSelect } from './ResourceSelect'
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
  purpose: string
}

const emptyForm: BookingFormValues = {
  studentName: '',
  studentId: '',
  resourceId: '',
  date: '',
  startTime: '',
  endTime: '',
  purpose: '',
}

function getStudentNameError(studentName: string) {
  if (!studentName || /^[A-Za-z ]+$/.test(studentName)) {
    return ''
  }

  return 'Student Name must contain English letters and spaces only.'
}

function getStudentIdError(studentId: string) {
  if (!studentId || /^[0-9]+$/.test(studentId)) {
    return ''
  }

  return 'Student ID must contain numbers only.'
}

function getPurposeError(purpose: string) {
  if (!purpose || /^[A-Za-z0-9 .,!?'"():;&/\-\r\n]+$/.test(purpose)) {
    return ''
  }

  return 'Purpose can only use English letters, numbers, spaces, and basic punctuation.'
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
  const savedBookings = getBookings()
  const selectedDateIsToday = form.date === getTodayDate()
  const unavailableTodayResourceIds = selectedDateIsToday
    ? resources
        .filter(
          (resource) =>
            !hasAvailableSlotForResource({
              resource,
              date: form.date,
              duration: selectedDuration,
              bookings: savedBookings,
            }),
        )
        .map((resource) => resource.id)
    : []
  const todayIsNoLongerBookable =
    selectedDateIsToday &&
    unavailableTodayResourceIds.length === resources.length
  const minBookingDate = getTodayDate()

  const studentNameError = getStudentNameError(form.studentName)
  const studentIdError = getStudentIdError(form.studentId)
  const purposeError = getPurposeError(form.purpose)
  const fieldValidationErrors = [
    studentNameError,
    studentIdError,
    purposeError,
  ].filter(Boolean)

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
      return 'Student name is required.'
    }

    if (!form.studentId.trim()) {
      return 'Student ID is required.'
    }

    if (!form.resourceId) {
      return 'Please choose a resource.'
    }

    if (!form.date) {
      return 'Booking date is required.'
    }

    if (!form.startTime) {
      return 'Start time is required.'
    }

    if (!form.endTime) {
      return 'End time is required.'
    }

    if (!form.purpose.trim()) {
      return 'Purpose is required.'
    }

    return null
  }

  function saveBooking(booking: Booking) {
    addBooking(booking)
    setConfirmedBooking(booking)
    setSuccessMessage('Booking request saved successfully.')
    setErrorMessage('')
    setPendingSameDayBooking(null)
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
      setErrorMessage('Please choose a valid resource.')
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      resourceId: form.resourceId,
      studentName: form.studentName.trim(),
      studentId: form.studentId.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: form.purpose.trim(),
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
        selectedDuration,
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
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {pendingSameDayBooking && (
        <SameDayBookingModal
          onConfirm={() => saveBooking(pendingSameDayBooking)}
          onEditDetails={() => setPendingSameDayBooking(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Student Name
            </span>
            <input
              type="text"
              value={form.studentName}
              onChange={(event) =>
                updateField('studentName', event.target.value)
              }
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              placeholder="Alex Tan"
            />
            {studentNameError && (
              <p className="rounded-lg border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:bg-red-950 dark:text-red-300">
                {studentNameError}
              </p>
            )}
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Student ID
            </span>
            <input
              type="text"
              value={form.studentId}
              onChange={(event) => updateField('studentId', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              placeholder="123456"
            />
            {studentIdError && (
              <p className="rounded-lg border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:bg-red-950 dark:text-red-300">
                {studentIdError}
              </p>
            )}
          </label>
        </div>

        <ResourceSelect
          label="Resource"
          resources={resources}
          value={form.resourceId}
          unavailableResourceIds={unavailableTodayResourceIds}
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

        {selectedResource && (
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-950 ring-1 ring-blue-100 transition-colors duration-300 ease-in-out dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-900">
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

        <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 transition-colors duration-300 ease-in-out dark:border-slate-800">
          <DatePicker
            label="Date"
            value={form.date}
            minDate={minBookingDate}
            onChange={(date) => updateField('date', date)}
          />
          {todayIsNoLongerBookable && (
            <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 transition-colors duration-300 ease-in-out dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Bookings for today are no longer available. Please choose another
              date.
            </p>
          )}
          <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Select a date first, then choose one of the available time slots
            below.
          </p>

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

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Purpose
          </span>
          <textarea
            value={form.purpose}
            onChange={(event) => updateField('purpose', event.target.value)}
            className="min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors duration-300 ease-in-out placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
            placeholder="Briefly explain why you need this resource."
          />
          {purposeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:bg-red-950 dark:text-red-300">
              {purposeError}
            </p>
          )}
        </label>

        {errorMessage && (
          <p className="whitespace-pre-line rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:bg-red-950 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:bg-green-950 dark:text-green-300">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          className="min-h-11 w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-auto dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
        >
          Submit Booking
        </button>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 ease-in-out sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          Booking Summary
        </h2>

        {confirmedBooking && selectedResource ? (
          <>
            <p className="mt-4 rounded-lg border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:bg-green-950 dark:text-green-300">
              Booking confirmed successfully!
            </p>
            <dl className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Resource
                </dt>
                <dd>{selectedResource.name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Student
                </dt>
                <dd>
                  {confirmedBooking.studentName} ({confirmedBooking.studentId})
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Date and Time
                </dt>
                <dd>
                  {confirmedBooking.date}, {confirmedBooking.startTime} -{' '}
                  {confirmedBooking.endTime}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Purpose
                </dt>
                <dd>{confirmedBooking.purpose}</dd>
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
                ? 'This is a same-day booking, so editing is disabled after submission. You can still cancel it if needed.'
                : 'Need to make changes? Please edit your booking before the booking date. Same-day bookings cannot be edited.'}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/"
                className="min-h-11 rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus:ring-blue-900"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
              >
                View My Bookings
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Submit a valid booking to see the confirmation details here.
          </p>
        )}
      </aside>
    </section>
  )
}
