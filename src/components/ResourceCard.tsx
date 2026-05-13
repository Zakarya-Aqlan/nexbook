import { Link } from 'react-router-dom'
import type { Resource } from '../types'

type ResourceCardProps = {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {resource.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {resource.location}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
          {resource.type}
        </span>
      </div>

      <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-900">Capacity</dt>
          <dd>{resource.capacity} people</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Opening Hours</dt>
          <dd>
            {resource.openingTime} - {resource.closingTime}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">
        {resource.description}
      </p>

      <Link
        to={`/book/${resource.id}`}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        Book Now
      </Link>
    </article>
  )
}
