import { Link } from 'react-router-dom'
import type { Resource, ResourceType } from '../types'

type ResourceCardProps = {
  resource: Resource
}

const typeBadgeStyles: Record<ResourceType, string> = {
  room: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
  lab: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900',
  equipment: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
  sports: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
}

const typeAccentBars: Record<ResourceType, string> = {
  room: 'bg-blue-500',
  lab: 'bg-indigo-500',
  equipment: 'bg-amber-500',
  sports: 'bg-emerald-500',
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${typeAccentBars[resource.type]}`}
      />
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {resource.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {resource.location}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 transition-colors duration-300 ease-in-out ${typeBadgeStyles[resource.type]}`}
          >
            {resource.type}
          </span>
        </div>
      </div>

      <dl className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition-colors duration-300 ease-in-out sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div>
          <dt className="font-semibold text-slate-900 dark:text-slate-100">
            Capacity
          </dt>
          <dd>{resource.capacity} people</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900 dark:text-slate-100">
            Opening Hours
          </dt>
          <dd>
            {resource.openingTime} - {resource.closingTime}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {resource.description}
      </p>

      <Link
        to={`/book/${resource.id}`}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
      >
        Book Now
      </Link>
    </article>
  )
}
