type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'No items to show yet',
  message = 'There is nothing here right now.',
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition-colors duration-300 sm:p-10 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
        NB
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
        {message}
      </p>
    </div>
  )
}
