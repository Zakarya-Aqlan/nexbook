import { useEffect, useMemo, useRef, useState } from 'react'
import { BookingCard } from '../components/BookingCard'
import { EmptyState } from '../components/EmptyState'
import { AvailabilitySlots } from '../components/AvailabilitySlots'
import { DatePicker } from '../components/DatePicker'
import { ResourceSelect } from '../components/ResourceSelect'
import { FinalEditWarningModal } from '../components/FinalEditWarningModal'
import { resources } from '../data/resources'
import { mapApiActivity } from '../services/activityApi'
import { buildApiUrl } from '../services/apiConfig'
import {
  loadBookings as loadBookingsFromApi,
  mapApiBooking,
} from '../services/bookingApi'
import type { Booking } from '../types'
import { mirrorActivity } from '../utils/activityStorage'
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
  getBookingGroup,
  getTimeRangeError,
  hasBookingConflict,
} from '../utils/bookingUtils'
import {
  getTodayDate,
  getTomorrowDate,
} from '../utils/dateUtils'
import {
  cancelBooking,
  getBookingSource,
  getBookings,
  markBookingSource,
  mirrorBooking,
  updateBooking,
} from '../utils/storage'
import { formatStudentIdForDisplay } from '../utils/studentIdUtils'
import type { ResourceSelectLabels } from '../components/ResourceSelect'

type BookingFilter = 'Active' | 'Upcoming' | 'Cancelled' | 'Completed'

type EditFormValues = {
  resourceId: string
  date: string
  startTime: string
  endTime: string
}

type ApiErrorBody = {
  error?: {
    message?: unknown
    details?: unknown
  }
}

type UpdateBookingPayload = {
  studentName: string
  studentId: string
  resourceId: string
  date: string
  startTime: string
  endTime: string
  duration: number
}

const filters: BookingFilter[] = ['Active', 'Upcoming', 'Cancelled', 'Completed']
const maxRemainingEdits = 2

function replaceBooking(bookings: Booking[], updatedBooking: Booking) {
  const hasBooking = bookings.some(
    (booking) => booking.id === updatedBooking.id,
  )

  if (!hasBooking) {
    return [...bookings, updatedBooking]
  }

  return bookings.map((booking) =>
    booking.id === updatedBooking.id ? updatedBooking : booking,
  )
}

function getApiErrorMessage(errorBody: unknown, fallbackMessage: string) {
  if (!errorBody || typeof errorBody !== 'object') {
    return fallbackMessage
  }

  const { error } = errorBody as ApiErrorBody
  const message =
    error && typeof error.message === 'string' ? error.message : ''
  const details = Array.isArray(error?.details)
    ? error.details.filter(
        (detail): detail is string => typeof detail === 'string',
      )
    : []

  return [message, ...details].filter(Boolean).join('\n') || fallbackMessage
}

async function requestBooking(
  path: string,
  request: RequestInit,
  unavailableMessage: string,
  fallbackMessage: string,
) {
  let response: Response

  try {
    response = await fetch(buildApiUrl(path), request)
  } catch {
    throw new Error(unavailableMessage)
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage))
  }

  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('data' in responseBody)
  ) {
    throw new Error('The backend returned an unusable booking response.')
  }

  const booking = mapApiBooking(responseBody.data)

  if (!booking) {
    throw new Error('The backend returned an unusable booking response.')
  }

  const activity =
    'activity' in responseBody
      ? mapApiActivity(responseBody.activity)
      : null

  return { booking, activity }
}

function getDisplayStatus(booking: Booking, currentTime: Date) {
  return getBookingGroup(booking, currentTime)
}

function getResourceName(resourceId: string) {
  return (
    resources.find((resource) => resource.id === resourceId)?.name ??
    'Unknown resource'
  )
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
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [isUsingLocalBookingsFallback, setIsUsingLocalBookingsFallback] =
    useState(false)
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('Active')
  const [editingBookingId, setEditingBookingId] = useState('')
  const [editForm, setEditForm] = useState<EditFormValues>({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
  })
  const [editDuration, setEditDuration] = useState(60)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [actionErrorMessage, setActionErrorMessage] = useState('')
  const [pendingFinalEdit, setPendingFinalEdit] = useState<Booking | null>(null)
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [cancellingBookingIds, setCancellingBookingIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [toastMessage, setToastMessage] = useState('')
  const isSubmittingEditRef = useRef(false)
  const cancellingBookingIdsRef = useRef(new Set<string>())
  const currentTime = new Date(currentTimestamp)
  const todayDate = getTodayDate()

  useEffect(() => {
    let isMounted = true

    async function loadBookings() {
      const result = await loadBookingsFromApi()

      if (isMounted) {
        setBookings(result.bookings)
        setIsUsingLocalBookingsFallback(result.isUsingFallback)
        setIsLoadingBookings(false)
      }
    }

    loadBookings()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now())
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
          [filter]: bookings.filter(
            (booking) => getBookingGroup(booking, currentTime) === filter,
          )
            .length,
        }),
        { Active: 0, Upcoming: 0, Cancelled: 0, Completed: 0 },
      ),
    [bookings, currentTimestamp],
  )

  const filteredBookings = bookings.filter(
    (booking) => getBookingGroup(booking, currentTime) === selectedFilter,
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
  const editMinBookingDate = getTomorrowDate()

  function startEditing(booking: Booking) {
    const bookingDuration = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)

    setEditingBookingId(booking.id)
    setEditForm({
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    })
    setEditDuration([60, 120, 180].includes(bookingDuration) ? bookingDuration : 60)
    setMessage('')
    setErrorMessage('')
    setActionErrorMessage('')
  }

  function stopEditing() {
    setEditingBookingId('')
    setEditForm({
      resourceId: '',
      date: '',
      startTime: '',
      endTime: '',
    })
    setEditDuration(60)
    setErrorMessage('')
    setPendingFinalEdit(null)
  }

  function updateEditField(field: keyof EditFormValues, value: string) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setMessage('')
    setErrorMessage('')
    setActionErrorMessage('')
  }

  function setCancellationPending(bookingId: string, isPending: boolean) {
    const nextBookingIds = new Set(cancellingBookingIdsRef.current)

    if (isPending) {
      nextBookingIds.add(bookingId)
    } else {
      nextBookingIds.delete(bookingId)
    }

    cancellingBookingIdsRef.current = nextBookingIds
    setCancellingBookingIds(nextBookingIds)
  }

  async function handleCancelBooking(bookingId: string) {
    if (cancellingBookingIdsRef.current.has(bookingId)) {
      return
    }

    const bookingToCancel = bookings.find(
      (booking) => booking.id === bookingId,
    )

    if (!bookingToCancel) {
      setActionErrorMessage('Booking not found.')
      return
    }

    setMessage('')
    setActionErrorMessage('')

    let cancelledBooking: Booking | null

    if (getBookingSource(bookingId) === 'local') {
      cancelledBooking = cancelBooking(bookingId)
    } else {
      setCancellationPending(bookingId, true)

      try {
        const result = await requestBooking(
          `/api/bookings/${encodeURIComponent(bookingId)}/cancel`,
          { method: 'PATCH' },
          'The backend is unavailable. This booking was not cancelled.',
          'Booking could not be cancelled.',
        )
        const backendBooking = result.booking

        if (
          backendBooking.id !== bookingId ||
          backendBooking.status !== 'cancelled'
        ) {
          throw new Error('The backend returned an invalid cancellation response.')
        }

        markBookingSource(backendBooking.id, 'backend')
        cancelledBooking = mirrorBooking(backendBooking)

        if (result.activity) {
          mirrorActivity(result.activity)
        }
      } catch (error) {
        setActionErrorMessage(
          error instanceof Error
            ? error.message
            : 'Booking could not be cancelled.',
        )
        return
      } finally {
        setCancellationPending(bookingId, false)
      }
    }

    if (!cancelledBooking) {
      setActionErrorMessage('Booking could not be cancelled locally.')
      return
    }

    setBookings((currentBookings) =>
      replaceBooking(currentBookings, cancelledBooking),
    )

    if (editingBookingId === bookingId) {
      stopEditing()
    }

    setMessage('Booking cancelled.')
    setErrorMessage('')
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

    return null
  }

  async function saveUpdatedBooking(updatedBooking: Booking) {
    if (isSubmittingEditRef.current) {
      return
    }

    const bookingToEdit = bookings.find(
      (booking) => booking.id === updatedBooking.id,
    )

    if (!bookingToEdit) {
      setErrorMessage('Booking not found.')
      return
    }

    setPendingFinalEdit(null)
    setMessage('')
    setErrorMessage('')
    setActionErrorMessage('')

    let bookingToSave: Booking

    if (getBookingSource(updatedBooking.id) === 'local') {
      bookingToSave = {
        ...updatedBooking,
        remainingEdits: Math.max(getRemainingEdits(bookingToEdit) - 1, 0),
      }
      updateBooking(bookingToSave)
    } else {
      const payload: UpdateBookingPayload = {
        studentName: bookingToEdit.studentName,
        studentId: bookingToEdit.studentId,
        resourceId: updatedBooking.resourceId,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        duration:
          timeToMinutes(updatedBooking.endTime) -
          timeToMinutes(updatedBooking.startTime),
      }

      isSubmittingEditRef.current = true
      setIsSubmittingEdit(true)

      try {
        const result = await requestBooking(
          `/api/bookings/${encodeURIComponent(updatedBooking.id)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
          'The backend is unavailable. This booking was not updated.',
          'Booking could not be updated.',
        )
        bookingToSave = result.booking

        if (bookingToSave.id !== updatedBooking.id) {
          throw new Error('The backend returned an invalid booking response.')
        }

        markBookingSource(bookingToSave.id, 'backend')
        mirrorBooking(bookingToSave)

        if (result.activity) {
          mirrorActivity(result.activity)
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Booking could not be updated.',
        )
        return
      } finally {
        isSubmittingEditRef.current = false
        setIsSubmittingEdit(false)
      }
    }

    const nextRemainingEdits = getRemainingEdits(bookingToSave)

    setBookings((currentBookings) =>
      replaceBooking(currentBookings, bookingToSave),
    )
    stopEditing()
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

    if (isSubmittingEditRef.current) {
      return
    }

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
      bookingToEdit.endTime !== editForm.endTime

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

    const updatedBooking: Booking = {
      ...bookingToEdit,
      resourceId: editForm.resourceId,
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
    }

    if (updatedBooking.date === todayDate) {
      setErrorMessage('Same-day bookings cannot be edited after submission.')
      return
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
      setMessage('')
      setErrorMessage('')
      return
    }

    void saveUpdatedBooking(updatedBooking)
  }

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-green-800 shadow-xl transition-colors duration-300 ease-in-out dark:border-green-900 dark:bg-slate-900 dark:text-green-300">
          {toastMessage}
        </div>
      )}

      {pendingFinalEdit && (
        <FinalEditWarningModal
          onConfirm={() => {
            void saveUpdatedBooking(pendingFinalEdit)
          }}
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
              setActionErrorMessage('')
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

      {actionErrorMessage && (
        <p className={'rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300'}>
          {actionErrorMessage}
        </p>
      )}

      {isLoadingBookings && (
        <p className="rounded-lg border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors duration-300 ease-in-out dark:border-blue-900 dark:border-l-blue-500 dark:bg-blue-950 dark:text-blue-300">
          Loading bookings...
        </p>
      )}

      {!isLoadingBookings && isUsingLocalBookingsFallback && (
        <p className="rounded-lg border border-amber-100 border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition-colors duration-300 ease-in-out dark:border-amber-900 dark:border-l-amber-500 dark:bg-amber-950 dark:text-amber-300">
          Using local bookings because the backend is unavailable.
        </p>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Create a booking to see it here."
          showBadge={false}
        />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={`No ${selectedFilter.toLowerCase()} bookings`}
          message="Try another filter."
          showBadge={false}
        />
      ) : (
        <section className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingGroup = getBookingGroup(booking, currentTime)
            const isEditing = editingBookingId === booking.id
            const isUpcomingBooking = bookingGroup === 'Upcoming'
            const remainingEdits = getRemainingEdits(booking)
            const isCancelling = cancellingBookingIds.has(booking.id)

            return (
              <div key={booking.id} className="space-y-3">
                <BookingCard
                  booking={booking}
                  resourceName={getResourceName(booking.resourceId)}
                  groupLabel={bookingGroup}
                  displayStatus={getDisplayStatus(booking, currentTime)}
                  canEdit={
                    isUpcomingBooking &&
                    booking.date > todayDate &&
                    remainingEdits > 0
                  }
                  canCancel={
                    bookingGroup === 'Active' || bookingGroup === 'Upcoming'
                  }
                  isCancelling={isCancelling}
                  remainingEdits={
                    isUpcomingBooking ? remainingEdits : undefined
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
                        {`Student: ${booking.studentName} (${formatStudentIdForDisplay(
                          booking.studentId,
                        )})`}
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

                    {errorMessage && (
                      <p className="rounded-lg border border-red-100 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-300 ease-in-out dark:border-red-900 dark:border-l-red-500 dark:bg-red-950 dark:text-red-300">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingEdit}
                        className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
                      >
                        {isSubmittingEdit ? 'Saving changes...' : 'Save changes'}
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
