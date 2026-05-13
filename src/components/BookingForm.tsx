import { useEffect, useMemo, useState } from 'react'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import {
  getOpeningHoursError,
  getPastDateError,
  getTimeRangeError,
  hasBookingConflict,
} from '../utils/bookingUtils'
import { addBooking, getBookings } from '../utils/storage'

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

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function getStudentNameError(studentName: string) {
  if (!studentName || /^[A-Za-z ]+$/.test(studentName)) {
    return ''
  }

  return 'Student Name can only contain English letters and spaces.'
}

function getStudentIdError(studentId: string) {
  if (!studentId || /^[0-9]+$/.test(studentId)) {
    return ''
  }

  return 'Student ID can only contain numbers.'
}

function getPurposeError(purpose: string) {
  if (!purpose || /^[A-Za-z0-9 .,!?'"():;&/\-\r\n]+$/.test(purpose)) {
    return ''
  }

  return 'Purpose can only contain English letters, numbers, spaces, and basic punctuation.'
}

export function BookingForm({ initialResourceId }: BookingFormProps) {
  const [form, setForm] = useState<BookingFormValues>(emptyForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

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

  const studentNameError = getStudentNameError(form.studentName)
  const studentIdError = getStudentIdError(form.studentId)
  const purposeError = getPurposeError(form.purpose)

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const requiredFieldError = getRequiredFieldError()

    if (requiredFieldError) {
      setErrorMessage(requiredFieldError)
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    if (studentNameError || studentIdError || purposeError) {
      setErrorMessage(
        'Please use English input only. Student Name must contain letters only, Student ID must contain numbers only, and Purpose can only use English letters, numbers, spaces, and basic punctuation.',
      )
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
    }

    const validationError =
      getPastDateError(newBooking.date) ||
      getTimeRangeError(newBooking.startTime, newBooking.endTime) ||
      getOpeningHoursError(
        selectedResource,
        newBooking.startTime,
        newBooking.endTime,
      ) ||
      hasBookingConflict(newBooking, getBookings())

    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      setConfirmedBooking(null)
      return
    }

    addBooking(newBooking)
    setConfirmedBooking(newBooking)
    setSuccessMessage('Booking request saved successfully.')
    setErrorMessage('')
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Student Name
            </span>
            <input
              type="text"
              value={form.studentName}
              onChange={(event) =>
                updateField('studentName', event.target.value)
              }
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              placeholder="Alex Tan"
            />
            {studentNameError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {studentNameError}
              </p>
            )}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Student ID
            </span>
            <input
              type="text"
              value={form.studentId}
              onChange={(event) => updateField('studentId', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              placeholder="123456"
            />
            {studentIdError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {studentIdError}
              </p>
            )}
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Resource</span>
          <select
            value={form.resourceId}
            onChange={(event) => updateField('resourceId', event.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Choose a resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </label>

        {selectedResource && (
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-950 ring-1 ring-blue-100">
            <p className="font-semibold">{selectedResource.name}</p>
            <p className="mt-1 leading-6">
              {selectedResource.location}
              <span className="mx-2 text-blue-300">|</span>
              Capacity {selectedResource.capacity}
            </p>
            <p>
              Open {selectedResource.openingTime} -{' '}
              {selectedResource.closingTime}
            </p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              min={getTodayDate()}
              value={form.date}
              onChange={(event) => updateField('date', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Start Time
            </span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => updateField('startTime', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">End Time</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => updateField('endTime', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Purpose</span>
          <textarea
            value={form.purpose}
            onChange={(event) => updateField('purpose', event.target.value)}
            className="min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            placeholder="Briefly explain why you need this resource."
          />
          {purposeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {purposeError}
            </p>
          )}
        </label>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          className="min-h-11 w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-auto"
        >
          Submit Booking
        </button>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">
          Booking Summary
        </h2>

        {confirmedBooking && selectedResource ? (
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">Resource</dt>
              <dd>{selectedResource.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Student</dt>
              <dd>
                {confirmedBooking.studentName} ({confirmedBooking.studentId})
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Date and Time</dt>
              <dd>
                {confirmedBooking.date}, {confirmedBooking.startTime} -{' '}
                {confirmedBooking.endTime}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Purpose</dt>
              <dd>{confirmedBooking.purpose}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Status</dt>
              <dd className="capitalize">{confirmedBooking.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Submit a valid booking to see the confirmation details here.
          </p>
        )}
      </aside>
    </section>
  )
}
