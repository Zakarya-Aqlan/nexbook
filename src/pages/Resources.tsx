import { useState } from 'react'
import { ResourceCard } from '../components/ResourceCard'
import { resources } from '../data/resources'
import type { ResourceType } from '../types'
import { hasAvailableSlotForResourceToday } from '../utils/availabilityUtils'
import { getBookings } from '../utils/storage'

type ResourceFilter = 'all' | ResourceType

const filters: { label: string; value: ResourceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Rooms', value: 'room' },
  { label: 'Labs', value: 'lab' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Sports', value: 'sports' },
]

export function Resources() {
  const [selectedType, setSelectedType] = useState<ResourceFilter>('all')
  const bookings = getBookings()
  const unavailableTodayResourceIds = new Set(
    resources
      .filter((resource) => !hasAvailableSlotForResourceToday(resource, bookings))
      .map((resource) => resource.id),
  )

  const filteredResources =
    selectedType === 'all'
      ? resources
      : resources.filter((resource) => resource.type === selectedType)

  return (
    <main className="space-y-10 transition-colors duration-300 ease-in-out">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Resources
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          Campus Resources
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
          Browse study spaces, labs, and equipment available for student
          booking.
        </p>
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Resource filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSelectedType(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out ${
              selectedType === filter.value
                ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            unavailableToday={unavailableTodayResourceIds.has(resource.id)}
          />
        ))}
      </section>
    </main>
  )
}
