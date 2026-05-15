type StatCardProps = {
  label: string
  value: number
  helperText?: string
  marker?: string
  accent?: 'blue' | 'indigo' | 'emerald' | 'amber'
}

const accentStyles = {
  blue: {
    marker:
      'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
    bar: 'bg-blue-500',
  },
  indigo: {
    marker:
      'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900',
    bar: 'bg-indigo-500',
  },
  emerald: {
    marker:
      'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    bar: 'bg-emerald-500',
  },
  amber: {
    marker:
      'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    bar: 'bg-amber-500',
  },
}

export function StatCard({
  label,
  value,
  helperText,
  marker = label.charAt(0),
  accent = 'blue',
}: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ${styles.marker}`}
          aria-hidden="true"
        >
          {marker}
        </span>
      </div>
      {helperText && (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </article>
  )
}
