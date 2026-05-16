import { useEffect, useMemo, useState } from 'react'
import { BookingCard } from '../components/BookingCard'
import { EmptyState } from '../components/EmptyState'
import { AvailabilitySlots } from '../components/AvailabilitySlots'
import { DatePicker } from '../components/DatePicker'
import { ResourceSelect } from '../components/ResourceSelect'
import { SameDayBookingModal } from '../components/SameDayBookingModal'
import { FinalEditWarningModal } from '../components/FinalEditWarningModal'
import { resources } from '../data/resources'
import type { Booking } from '../types'
import {
  getAvailableSlotCount,
  getDurationHourLabel,
  getNoRemainingTodayError,
  getPastSameDayTimeError,
  minimumBookingDuration,
  timeToMinutes,
} from '../utils/availabilityUtils'
import {
  getDurationError,
  getOpeningHoursError,
  getPastDateError,
  getTimeRangeError,
  hasBookingConflict,
} from '../utils/bookingUtils'
import { getTodayDate } from '../utils/dateUtils'
import { cancelBooking, getBookings, updateBooking } from '../utils/storage'
import type { ResourceSelectLabels } from '../components/ResourceSelect'

type BookingFilter = 'Active' | 'Cancelled' | 'Completed'

type EditFormValues = {
  resourceId: string
  date: string
  startTime: string
  endTime: string
  purpose: string
}

const filters: BookingFilter[] = ['Active', 'Cancelled', 'Completed']
const maxRemainingEdits = 2

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

  return 'Purpose: use letters, numbers, spaces, and basic punctuation.'
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

function getRemainingEdits(booking: Booking) {
  return booking.remainingEdits ?? maxRemainingEdits
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
  const [editDuration, setEditDuration] = useState(60)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingSameDayEdit, setPendingSameDayEdit] = useState<Booking | null>(
    null,
  )
  const [pendingFinalEdit, setPendingFinalEdit] = useState<Booking | null>(null)
  const [todayDate, setTodayDate] = useState(getTodayDate)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTodayDate(getTodayDate())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('')
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

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
  const editSelectedDateIsToday = editForm.date === todayDate
  const editExcludeBookingId = editingBookingId || undefined
  const editResourceAvailability = editForm.date
    ? resources.map((resource) => ({
        resourceId: resource.id,
        minimumSlotCount: getAvailableSlotCount({
          resource,
          date: editForm.date,
          duration: minimumBookingDuration,
          bookings,
          excludeBookingId: editExcludeBookingId,
        }),
        selectedDurationSlotCount: getAvailableSlotCount({
          resource,
          date: editForm.date,
          duration: editDuration,
          bookings,
          excludeBookingId: editExcludeBookingId,
        }),
      }))
    : []
  const editUnavailableResourceIds = editResourceAvailability
    .filter(({ minimumSlotCount }) => minimumSlotCount === 0)
    .map(({ resourceId }) => resourceId)
  const editResourceLabels =
    editResourceAvailability.reduce<ResourceSelectLabels>(
      (labels, resourceAvailability) => ({
        ...labels,
        [resourceAvailability.resourceId]: getResourceAvailabilityLabel(
          resourceAvailability.minimumSlotCount,
          resourceAvailability.selectedDurationSlotCount,
          editDuration,
          editSelectedDateIsToday,
        ),
      }),
      {},
    )
  const editTodayIsNoLongerBookable =
    editSelectedDateIsToday &&
    editResourceAvailability.length > 0 &&
    editResourceAvailability.every(
      ({ minimumSlotCount }) => minimumSlotCount === 0,
    )
  const editMinBookingDate = todayDate

  function refreshBookings() {
    setBookings(getBookings())
  }

  function startEditing(booking: Booking) {
    const bookingDuration = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)

    setEditingBookingId(booking.id)
    setEditForm({
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
    })
    setEditDuration([60, 120, 180].includes(bookingDuration) ? bookingDuration : 60)
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
    setEditDuration(60)
    setErrorMessage('')
    setPendingSameDayEdit(null)
    setPendingFinalEdit(null)
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
    setMessage('Booking cancelled.')
    setErrorMessage('')
    setPendingSameDayEdit(null)
    setPendingFinalEdit(null)
    setToastMessage('')
  }

  function getEditRequiredError() {
    if (!editForm.resourceId) {
      return 'Choose a resource.'
    }

    if (!editForm.date) {
      return 'Choose a date.'
    }

    if (!editForm.startTime) {
      return 'Choose a start time.'
    }

    if (!editForm.endTime) {
      return 'Choose an end time.'
    }

    if (!editForm.purpose.trim()) {
      return 'Enter a purpose.'
    }

    return null
  }

  function saveUpdatedBooking(updatedBooking: Booking) {
    const bookingToEdit = bookings.find(
      (booking) => booking.id === updatedBooking.id,
    )
    const nextRemainingEdits = Math.max(
      getRemainingEdits(bookingToEdit ?? updatedBooking) - 1,
      0,
    )
    const bookingWithEditCount: Booking = {
      ...updatedBooking,
      remainingEdits: nextRemainingEdits,
    }

    updateBooking(bookingWithEditCount)
    refreshBookings()
    stopEditing()
    setPendingSameDayEdit(null)
    setPendingFinalEdit(null)
    setMessage('Booking updated.')
    setErrorMessage('')
    setToastMessage(
      nextRemainingEdits === 1
        ? 'Booking updated. 1 edit left.'
        : 'Booking updated. No edits left for this booking.',
    )
  }

  function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const bookingToEdit = bookings.find(
      (booking) => booking.id === editingBookingId,
    )

    if (!bookingToEdit) {
      setErrorMessage('Booking not found.')
      return
    }

    if (getRemainingEdits(bookingToEdit) <= 0) {
      setErrorMessage('No edits left for this booking.')
      return
    }

    const requiredError = getEditRequiredError()

    if (requiredError) {
      setErrorMessage(requiredError)
      return
    }

    const hasEditChanges =
      bookingToEdit.resourceId !== editForm.resourceId ||
      bookingToEdit.date !== editForm.date ||
      bookingToEdit.startTime !== editForm.startTime ||
      bookingToEdit.endTime !== editForm.endTime ||
      bookingToEdit.purpose !== editForm.purpose.trim()

    if (!hasEditChanges) {
      setMessage('')
      setErrorMessage(
        'No changes to save.',
      )
      return
    }

    if (!selectedResource) {
      setErrorMessage('Choose a valid resource.')
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
      getPastSameDayTimeError(updatedBooking.date, updatedBooking.startTime) ||
      getNoRemainingTodayError(
        selectedResource,
        updatedBooking.date,
        bookings,
        updatedBooking.id,
      ) ||
      hasBookingConflict(updatedBooking, otherBookings)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    if (getRemainingEdits(bookingToEdit) === 1) {
      setPendingFinalEdit(updatedBooking)
      setPendingSameDayEdit(null)
      setMessage('')
      setErrorMessage('')
      return
    }

    if (updatedBooking.date === todayDate) {
      setPendingSameDayEdit(updatedBooking)
      setPendingFinalEdit(null)
      setMessage('')
      setErrorMessage('')
      return
    }

    saveUpdatedBooking(updatedBooking)
  }

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-green-800 shadow-xl transition-colors duration-300 ease-in-out dark:border-green-900 dark:bg-slate-900 dark:text-green-300">
          {toastMessage}
        </div>
      )}

      {pendingSameDayEdit && (
        <SameDayBookingModal
          onConfirm={() => saveUpdatedBooking(pendingSameDayEdit)}
          onEditDetails={() => setPendingSameDayEdit(null)}
        />
      )}

      {pendingFinalEdit && (
        <FinalEditWarningModal
          onConfirm={() => saveUpdatedBooking(pendingFinalEdit)}
          onKeepEditing={() => setPendingFinalEdit(null)}
        />
      )}

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:p-9 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(79,70,229,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
            My Bookings
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Your Bookings
          </h1>
          <div className="mt-4 max-w-2xl">
            <p className="text-base leading-7 text-blue-50/85 sm:text-lg">
              Review, edit, or cancel your campus bookings.
            </p>
          </div>
        </div>
      </section>

      <section
        className="flex flex-wrap gap-2 rounded-2xl border border-white/70 bg-white p-2 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800"
        aria-label="Booking filters"
      >
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setSelectedFilter(filter)
              stopEditing()
              setMessage('')
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
              selectedFilter === filter
                ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {filter} ({bookingCounts[filter]})
          </button>
        ))}
      </section>

      {message && (
        <p className="rounded-lg border border-green-100 border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition-colors duration-300 ease-in-out dark:border-green-900 dark:border-l-green-500 dark:bg-green-950 dark:text-green-300">
          {message}
        </p>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Create a booking to see it here."
        />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={`No ${selectedFilter.toLowerCase()} bookings`}
          message="Try another filter."
        />
      ) : (
        <section className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingGroup = getBookingGroup(booking)
            const isEditing = editingBookingId === booking.id
            const isSameDayBooking = booking.date === todayDate
            const isFutureActiveBooking =
              bookingGroup === 'Active' && !isSameDayBooking
            const remainingEdits = getRemainingEdits(booking)

            return (
              <div key={booking.id} className="space-y-3">
                <BookingCard
                  booking={booking}
                  resourceName={getResourceName(booking.resourceId)}
                  groupLabel={bookingGroup}
                  displayStatus={getDisplayStatus(booking)}
                  canEdit={isFutureActiveBooking && remainingEdits > 0}
                  canCancel={bookingGroup === 'Active'}
                  remainingEdits={
                    isFutureActiveBooking ? remainingEdits : undefined
                  }
                  onCancel={handleCancelBooking}
                  onEdit={startEditing}
                />

                {isEditing && (
                  <form
                    onSubmit={handleSaveEdit}
                    className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm ring-1 ring-blue-100/70 transition-colors duration-300 ease-in-out sm:p-6 dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-900/30"
                  >
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        Edit mode
                      </p>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                        Edit booking
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Student: {booking.studentName} ({booking.studentId})
                      </p>
                    </div>

                    <ResourceSelect
                      label="Resource"
                      resources={resources}
                      value={editForm.resourceId}
                      unavailableResourceIds={editUnavailableResourceIds}
                      resourceLabels={editResourceLabels}
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
                        minDate={editMinBookingDate}
                        onChange={(date) => updateEditField('date', date)}
                      />
                      {editTodayIsNoLongerBookable && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 transition-colors duration-300 ease-in-out dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          No bookings are available today. Choose another date.
                        </p>
                      )}
                      <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Pick a date and available slot. This booking does not
                        block its current time.
                      </p>

                      <AvailabilitySlots
                        resource={selectedResource}
                        date={editForm.date}
                        excludeBookingId={editingBookingId}
                        currentSlot={
                          editForm.resourceId === booking.resourceId &&
                          editForm.date === booking.date
                            ? {
                                startTime: booking.startTime,
                                endTime: booking.endTime,
                              }
                            : undefined
                        }
                        duration={editDuration}
                        selectedStartTime={editForm.startTime}
                        selectedEndTime={editForm.endTime}
                        onDurationChange={setEditDuration}
                        onSelectSlot={(startTime, endTime) => {
                          updateEditField('startTime', startTime)
                          updateEditField('endTime', endTime)
                        }}
                      />
                    </section>

                    <label className="space-y-2">
                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Purpose
                      </span>
                      <textarea
                        value={editForm.purpose}
                        onChange={(event) =>
                          updateEditField('purpose', event.target.value)
                        }
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition-colors duration-300 ease-in-out hover:border-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                      />
                    </label>

                    {errorMessage && (
                      <p className="rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={stopEditing}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-slate-800 dark:hover:text-blue-300 dark:focus:ring-blue-900"
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
