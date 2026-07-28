export type ResourceType = 'room' | 'lab' | 'equipment' | 'sports'

export type Resource = {
  id: string
  name: string
  type: ResourceType
  location: string
  capacity: number
  openingTime: string
  closingTime: string
  description: string
}

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'upcoming'
  | 'active'
  | 'cancelled'
  | 'completed'

export type Booking = {
  id: string
  resourceId: string
  studentName: string
  studentId: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  status: BookingStatus
  createdAt: string
  remainingEdits?: number
}

export type ActivityType = 'booked' | 'updated' | 'cancelled' | 'completed'

export type ActivitySource = 'backend' | 'local'

export type Activity = {
  id: string
  type: ActivityType
  bookingId: string
  resourceId: string
  resourceName: string
  date: string
  startTime: string
  endTime: string
  studentId?: string
  createdAt: string
  clientEventKey?: string
  source: ActivitySource
}
