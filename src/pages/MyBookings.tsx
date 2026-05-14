import { useEffect, useMemo, useState } from 'react'
import { BookingCard } from '../components/BookingCard'
import { EmptyState } from '../components/EmptyState'
import { AvailabilitySlots } from '../components/AvailabilitySlots'
import { DatePicker } from '../components/DatePicker'
import { ResourceSelect } from '../components/ResourceSelect'
import { SameDayBookingModal } from '../components/SameDayBookingModal'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import {
  getDurationError,
  getOpeningHoursError,
  getPastDateError,
  getTimeRangeError,
  hasBookingConflict,
} from '../utils/bookingUtils'
import { getTodayDate } from '../utils/dateUtils'
import { cancelBooking, getBookings, updateBooking } from '../utils/storage'

type BookingFilter = 'Active' | 'Cancelled' | 'Completed'

type EditFormValues = {
  resourceId: string
  date: string
  startTime: string
  endTime: string
  purpose: string
}

const filters: BookingFilter[] = ['Active', 'Cancelled', 'Completed']

function getBookingEndDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.endTime}:00`)
}

function getBookingGroup(booking: Booking): BookingFilter {
  if (booking.status === 'cancelled') {
    return 'Cancelled'
  }

  if (getBookingEndDate(booking) < new Date()) {
    return 'Completed'
  }

  return 'Active'
}

function getDisplayStatus(booking: Booking) {
  const bookingGroup = getBookingGroup(booking)

  if (bookingGroup === 'Cancelled' || bookingGroup === 'Completed') {
    return bookingGroup
  }

  return booking.status === 'approved' ? 'Approved' : 'Pending'
}

function getResourceName(resourceId: string) {
  return (
    resources.find((resource) => resource.id === resourceId)?.name ??
    'Unknown resource'
  )
}

function getPurposeError(purpose: string) {
  if (!purpose || /^[A-Za-z0-9 .,!?'"():;&/\-\r\n]+$/.test(purpose)) {
    return ''
  }

  return 'Purpose can only contain English letters, numbers, spaces, and basic punctuation.'
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings())
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('Active')
  const [editingBookingId, setEditingBookingId] = useState('')
  const [editForm, setEditForm] = useState<EditFormValues>({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
  })
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingSameDayEdit, setPendingSameDayEdit] = useState<Booking | null>(
    null,
  )
  const [todayDate, setTodayDate] = useState(getTodayDate)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTodayDate(getTodayDate())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const bookingCounts = useMemo(
    () =>
      filters.reduce<Record<BookingFilter, number>>(
        (counts, filter) => ({
          ...counts,
          [filter]: bookings.filter((booking) => getBookingGroup(booking) === filter)
            .length,
        }),
        { Active: 0, Cancelled: 0, Completed: 0 },
      ),
    [bookings],
  )

  const filteredBookings = bookings.filter(
    (booking) => getBookingGroup(booking) === selectedFilter,
  )

  const selectedResource = resources.find(
    (resource) => resource.id === editForm.resourceId,
  )

  function refreshBookings() {
    setBookings(getBookings())
  }

  function startEditing(booking: Booking) {
    setEditingBookingId(booking.id)
    setEditForm({
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
    })
    setMessage('')
    setErrorMessage('')
  }

  function stopEditing() {
    setEditingBookingId('')
    setEditForm({
      resourceId: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
    })
    setErrorMessage('')
    setPendingSameDayEdit(null)
  }

  function updateEditField(field: keyof EditFormValues, value: string) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setMessage('')
    setErrorMessage('')
  }

  function handleCancelBooking(bookingId: string) {
    cancelBooking(bookingId)
    refreshBookings()
    setEditingBookingId('')
    setMessage('Booking cancelled successfully.')
    setErrorMessage('')
    setPendingSameDayEdit(null)
  }

  function getEditRequiredError() {
    if (!editForm.resourceId) {
      return 'Please choose a resource.'
    }

    if (!editForm.date) {
      return 'Booking date is required.'
    }

    if (!editForm.startTime) {
      return 'Start time is required.'
    }

    if (!editForm.endTime) {
      return 'End time is required.'
    }

    if (!editForm.purpose.trim()) {
      return 'Purpose is required.'
    }

    return null
  }

  function saveUpdatedBooking(updatedBooking: Booking) {
    updateBooking(updatedBooking)
    refreshBookings()
    stopEditing()
    setPendingSameDayEdit(null)
    setMessage('Booking updated successfully.')
    setErrorMessage('')
  }

  function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const bookingToEdit = bookings.find(
      (booking) => booking.id === editingBookingId,
    )

    if (!bookingToEdit) {
      setErrorMessage('Booking could not be found.')
      return
    }

    const requiredError = getEditRequiredError()

    if (requiredError) {
      setErrorMessage(requiredError)
      return
    }

    if (!selectedResource) {
      setErrorMessage('Please choose a valid resource.')
      return
    }

    const purposeError = getPurposeError(editForm.purpose)

    if (purposeError) {
      setErrorMessage(purposeError)
      return
    }

    const updatedBooking: Booking = {
      ...bookingToEdit,
      resourceId: editForm.resourceId,
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      purpose: editForm.purpose.trim(),
    }

    const otherBookings = bookings.filter(
      (booking) => booking.id !== updatedBooking.id,
    )

    const validationError =
      getPastDateError(updatedBooking.date) ||
      getTimeRangeError(updatedBooking.startTime, updatedBooking.endTime) ||
      getDurationError(updatedBooking.startTime, updatedBooking.endTime) ||
      getOpeningHoursError(
        selectedResource,
        updatedBooking.startTime,
        updatedBooking.endTime,
      ) ||
      hasBookingConflict(updatedBooking, otherBookings)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    if (updatedBooking.date === todayDate) {
      setPendingSameDayEdit(updatedBooking)
      setMessage('')
      setErrorMessage('')
      return
    }

    saveUpdatedBooking(updatedBooking)
  }

  return (
    <main className="space-y-10 transition-colors duration-300 ease-in-out">
      {pendingSameDayEdit && (
        <SameDayBookingModal
          onConfirm={() => saveUpdatedBooking(pendingSameDayEdit)}
          onEditDetails={() => setPendingSameDayEdit(null)}
        />
      )}

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          My Bookings
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          Your Bookings
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
          Review your booking requests, edit active bookings, or cancel a
          booking you no longer need.
        </p>
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Booking filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setSelectedFilter(filter)
              stopEditing()
              setMessage('')
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out ${
              selectedFilter === filter
                ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {filter} ({bookingCounts[filter]})
          </button>
        ))}
      </section>

      {message && (
        <p className="rounded-lg border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:bg-green-950 dark:text-green-300">
          {message}
        </p>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Create a booking first, then it will appear on this page."
        />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={`No ${selectedFilter.toLowerCase()} bookings`}
          message="Try another filter to view your other bookings."
        />
      ) : (
        <section className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingGroup = getBookingGroup(booking)
            const isEditing = editingBookingId === booking.id
            const isSameDayBooking = booking.date === todayDate

            return (
              <div key={booking.id} className="space-y-3">
                <BookingCard
                  booking={booking}
                  resourceName={getResourceName(booking.resourceId)}
                  groupLabel={bookingGroup}
                  displayStatus={getDisplayStatus(booking)}
                  canEdit={bookingGroup === 'Active' && !isSameDayBooking}
                  canCancel={bookingGroup === 'Active'}
                  onCancel={handleCancelBooking}
                  onEdit={startEditing}
                />

                {isEditing && (
                  <form
                    onSubmit={handleSaveEdit}
                    className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm transition-colors duration-300 ease-in-out sm:p-6 dark:border-blue-900 dark:bg-slate-900"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                        Edit Booking
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Student: {booking.studentName} ({booking.studentId})
                      </p>
                    </div>

                    <ResourceSelect
                      label="Resource"
                      resources={resources}
                      value={editForm.resourceId}
                      onChange={(resourceId) => {
                        setEditForm((currentForm) => ({
                          ...currentForm,
                          resourceId,
                          startTime: '',
                          endTime: '',
                        }))
                        setMessage('')
                        setErrorMessage('')
                      }}
                    />

                    <section className="mt-8 space-y-4 border-t border-blue-200 pt-6 transition-colors duration-300 ease-in-out dark:border-slate-800">
                      <DatePicker
                        label="Date"
                        value={editForm.date}
                        onChange={(date) => updateEditField('date', date)}
                      />
                      <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Pick a new date, then select an available slot. This
                        booking will not block its own current time.
                      </p>

                      <AvailabilitySlots
                        resource={selectedResource}
                        date={editForm.date}
                        excludeBookingId={editingBookingId}
                        selectedStartTime={editForm.startTime}
                        selectedEndTime={editForm.endTime}
                        onSelectSlot={(startTime, endTime) => {
                          updateEditField('startTime', startTime)
                          updateEditField('endTime', endTime)
                        }}
                      />
                    </section>

                    <label className="space-y-2">
                      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Purpose
                      </span>
                      <textarea
                        value={editForm.purpose}
                        onChange={(event) =>
                          updateEditField('purpose', event.target.value)
                        }
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors duration-300 ease-in-out focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                      />
                    </label>

                    {errorMessage && (
                      <p className="rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:bg-red-950 dark:text-red-300">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={stopEditing}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-300 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
                      >
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </section>
      )}
    </main>
  )
}
