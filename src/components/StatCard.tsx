type StatCardProps = {
  label: string
  value: number
  helperText?: string
}

export function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      {helperText && <p className="mt-2 text-sm text-slate-600">{helperText}</p>}
    </article>
  )
}
