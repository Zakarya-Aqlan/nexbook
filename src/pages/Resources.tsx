import { useState } from 'react'
import { ResourceCard } from '../components/ResourceCard'
import { resources } from '../data/resources'
import type { ResourceType } from '../types'

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

  const filteredResources =
    selectedType === 'all'
      ? resources
      : resources.filter((resource) => resource.type === selectedType)

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium text-blue-700">Resources</p>
        <h1 className="text-3xl font-bold">Campus Resources</h1>
        <p className="max-w-2xl text-slate-600">
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedType === filter.value
                ? 'bg-blue-700 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </section>
    </main>
  )
}
