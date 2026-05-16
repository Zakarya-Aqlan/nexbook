import { useEffect, useState } from 'react'

const contactEmail = 'zakaryaaqlan@gmail.com'

export function Footer() {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    if (!isEmailModalOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsEmailModalOpen(false)
        setCopyMessage('')
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isEmailModalOpen])

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(contactEmail)
      setCopyMessage('Email copied')
    } catch {
      setCopyMessage('Could not copy email. Please copy it manually.')
    }
  }

  function closeEmailModal() {
    setIsEmailModalOpen(false)
    setCopyMessage('')
  }

  return (
    <>
      <footer className="border-t border-slate-200/80 bg-white/70 transition-colors duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 dark:text-slate-400">
          <div>
            <p className="text-base font-semibold text-slate-950 dark:text-white">
              NexBook
            </p>
            <p className="mt-1">Smart campus resource booking system</p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href="https://github.com/Zakarya-Aqlan/nexbook"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 transition-colors duration-300 ease-in-out hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-blue-900"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isEmailModalOpen}
              aria-controls="footer-email-modal"
              className="font-medium text-blue-700 transition-colors duration-300 ease-in-out hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-blue-900"
            >
              Email
            </button>
          </div>
        </div>
      </footer>

      {isEmailModalOpen && (
        <div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
          onClick={closeEmailModal}
        >
          <section
            id="footer-email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-email-title"
            className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Contact
            </p>
            <h2
              id="footer-email-title"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
            >
              Contact Email
            </h2>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 block break-all text-sm font-medium text-blue-700 transition-colors duration-300 ease-in-out hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-blue-900"
            >
              {contactEmail}
            </a>

            {copyMessage && (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {copyMessage}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEmailModal}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-slate-800 dark:hover:text-blue-300 dark:focus:ring-blue-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-blue-900"
              >
                Copy Email
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
