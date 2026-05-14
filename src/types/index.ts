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

export type BookingStatus = 'pending' | 'approved' | 'cancelled'

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
