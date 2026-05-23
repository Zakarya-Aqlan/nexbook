import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ResourceCard } from '../components/ResourceCard'
import { resources as mockResources } from '../data/resources'
import type { Resource, ResourceType } from '../types'

type ResourceFilter = 'all' | ResourceType
type ApiResource = {
  id: unknown
  name: unknown
  category: unknown
  location: unknown
  capacity: unknown
  openTime: unknown
  closeTime: unknown
  description: unknown
}

const filters: { label: string; value: ResourceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Rooms', value: 'room' },
  { label: 'Labs', value: 'lab' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Sports', value: 'sports' },
]

const resourceSubtitles = [
  'Browse spaces built for study, teamwork, and practice.',
  'Find rooms, labs, equipment, and sports facilities in one place.',
  'Choose the right resource before you book a slot.',
  'Explore clear details and simple booking actions.',
  'Move from browsing to booking without wasting time.',
  'Find the resource for your next campus task.',
]

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function isResourceType(value: unknown): value is ResourceType {
  return (
    value === 'room' ||
    value === 'lab' ||
    value === 'equipment' ||
    value === 'sports'
  )
}

function isApiResource(value: unknown): value is ApiResource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'category' in value &&
    'location' in value &&
    'capacity' in value &&
    'openTime' in value &&
    'closeTime' in value &&
    'description' in value
  )
}

function mapApiResource(resource: unknown): Resource | null {
  if (!isApiResource(resource) || !isResourceType(resource.category)) {
    return null
  }

  if (
    typeof resource.id !== 'string' ||
    typeof resource.name !== 'string' ||
    typeof resource.location !== 'string' ||
    typeof resource.capacity !== 'number' ||
    typeof resource.openTime !== 'string' ||
    typeof resource.closeTime !== 'string' ||
    typeof resource.description !== 'string'
  ) {
    return null
  }

  return {
    id: resource.id,
    name: resource.name,
    type: resource.category,
    location: resource.location,
    capacity: resource.capacity,
    openingTime: resource.openTime,
    closingTime: resource.closeTime,
    description: resource.description,
  }
}

function mapApiResources(responseBody: unknown): Resource[] {
  if (
    typeof responseBody !== 'object' ||
    responseBody === null ||
    !('data' in responseBody) ||
    !Array.isArray(responseBody.data)
  ) {
    throw new Error('Resources response was not usable.')
  }

  const mappedResources = responseBody.data.map(mapApiResource)

  if (mappedResources.some((resource) => resource === null)) {
    throw new Error('Resources response included invalid resources.')
  }

  return mappedResources.filter(
    (resource): resource is Resource => resource !== null,
  )
}

export function Resources() {
  const [selectedType, setSelectedType] = useState<ResourceFilter>('all')
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [resources, setResources] = useState<Resource[]>(mockResources)
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [isUsingFallbackResources, setIsUsingFallbackResources] =
    useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSubtitleIndex(
        (currentIndex) => (currentIndex + 1) % resourceSubtitles.length,
      )
    }, 3500)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadResources() {
      try {
        const response = await fetch(
          `${apiBaseUrl.replace(/\/$/, '')}/api/resources`,
        )

        if (!response.ok) {
          throw new Error('Resources request failed.')
        }

        const responseBody: unknown = await response.json()
        const apiResources = mapApiResources(responseBody)

        if (isMounted) {
          setResources(apiResources)
          setIsUsingFallbackResources(false)
        }
      } catch {
        if (isMounted) {
          setResources(mockResources)
          setIsUsingFallbackResources(true)
        }
      } finally {
        if (isMounted) {
          setIsLoadingResources(false)
        }
      }
    }

    loadResources()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredResources =
    selectedType === 'all'
      ? resources
      : resources.filter((resource) => resource.type === selectedType)

  return (
    <main className="space-y-8 transition-colors duration-300 ease-in-out">
      <section className="relative min-h-[28rem] overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10 transition-colors duration-300 ease-in-out sm:p-8 lg:min-h-[22rem] lg:p-10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.28),transparent_45%,rgba(79,70,229,0.18))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="relative grid min-h-[inherit] gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Resources
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Campus Resources
            </h1>
            <div className="mt-4 max-w-2xl">
              <style>{`
                @keyframes resources-subtitle-enter {
                  from {
                    opacity: 0;
                    transform: translateY(0.5rem);
                  }

                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <p className="min-h-[4.5rem] text-base leading-7 text-blue-50/85 sm:min-h-14 sm:text-lg">
                <span
                  key={subtitleIndex}
                  className="block"
                  style={{
                    animation: 'resources-subtitle-enter 500ms ease-out both',
                  }}
                >
                  {resourceSubtitles[subtitleIndex]}
                </span>
              </p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book"
                className="min-h-11 rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-blue-800 shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Book a resource
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

        {isLoadingResources && (
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors duration-300 ease-in-out dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            Loading resources...
          </p>
        )}

        {!isLoadingResources && isUsingFallbackResources && (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition-colors duration-300 ease-in-out dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Using local sample resources because the backend is unavailable.
          </p>
        )}

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
