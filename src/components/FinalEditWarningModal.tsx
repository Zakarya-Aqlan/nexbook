type FinalEditWarningModalProps = {
  onConfirm: () => void
  onKeepEditing: () => void
}

export function FinalEditWarningModal({
  onConfirm,
  onKeepEditing,
}: FinalEditWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/65 px-4 py-6 backdrop-blur-sm transition-colors duration-300 ease-in-out">
      <section
        aria-labelledby="final-edit-warning-title"
        aria-modal="true"
        role="dialog"
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Final edit
        </p>
        <h2
          id="final-edit-warning-title"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
        >
          Confirm final edit
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          This is your final edit for this booking. After this update, you will
          not be able to edit it again.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onKeepEditing}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-slate-800 dark:hover:text-blue-300 dark:focus:ring-blue-900"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
          >
            Confirm Final Edit
          </button>
        </div>
      </section>
    </div>
  )
}
