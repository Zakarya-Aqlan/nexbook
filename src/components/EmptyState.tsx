type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'No items to show yet',
  message = 'There is nothing here right now.',
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-white/60 transition-colors duration-300 ease-in-out sm:py-14 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-base font-bold text-blue-700 ring-1 ring-blue-100 transition-colors duration-300 ease-in-out dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
        NB
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
        {message}
      </p>
    </div>
  )
}
