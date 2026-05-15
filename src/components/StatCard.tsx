type StatCardProps = {
  label: string
  value: number
  helperText?: string
  accent?: 'blue' | 'indigo' | 'emerald' | 'red'
}

const accentStyles = {
  blue: {
    bar: 'bg-blue-500',
  },
  indigo: {
    bar: 'bg-indigo-500',
  },
  emerald: {
    bar: 'bg-emerald-500',
  },
  red: {
    bar: 'bg-red-500',
  },
}

export function StatCard({
  label,
  value,
  helperText,
  accent = 'blue',
}: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      {helperText && (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </article>
  )
}
