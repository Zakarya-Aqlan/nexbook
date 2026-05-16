import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
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
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:p-10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(79,70,229,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Resources
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Campus Resources
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/85 sm:text-lg">
              Browse spaces, labs, equipment, and sports facilities for your
              next task.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book"
                className="min-h-11 rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-blue-800 shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Book a resource
              </Link>
              <Link
                to="/my-bookings"
                className="min-h-11 rounded-lg border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                View my bookings
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur transition-colors duration-300 ease-in-out">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Resource overview
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-3xl font-bold">{resources.length}</p>
                <p className="mt-1 text-xs font-medium text-blue-50/80">
                  Total
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-3xl font-bold">{filteredResources.length}</p>
                <p className="mt-1 text-xs font-medium text-blue-50/80">
                  Showing
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Browse
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Find the right resource
          </h2>
        </div>

        <div
          className="flex flex-wrap gap-2 rounded-2xl border border-white/70 bg-white p-2 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800"
          aria-label="Resource filters"
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedType(filter.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
                selectedType === filter.value
                  ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {filteredResources.length === 0 ? (
        <EmptyState
          title="No resources found"
          message="Try another resource type."
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </section>
      )}
    </main>
  )
}
