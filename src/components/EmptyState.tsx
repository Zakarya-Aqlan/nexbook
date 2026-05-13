type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'No items to show yet',
  message = 'There is nothing here right now.',
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  )
}
