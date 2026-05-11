import { Link } from 'react-router-dom'
import type { Resource } from '../types'

type ResourceCardProps = {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {resource.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{resource.location}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {resource.type}
        </span>
      </div>

      <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-900">Capacity</dt>
          <dd>{resource.capacity} people</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Opening Hours</dt>
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
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Book Now
      </Link>
    </article>
  )
}
