type StatCardProps = {
  label: string
  value: number
  helperText?: string
}

export function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 border-t-4 border-t-blue-500 bg-white p-6 shadow-sm transition-colors duration-300 ease-in-out dark:border-slate-800 dark:border-t-blue-400 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold text-slate-950 dark:text-white">
        {value}
      </p>
      {helperText && (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </article>
  )
}
