import { useEffect, useRef, useState } from 'react'
import type { Resource } from '../types'

type ResourceSelectProps = {
  label: string
  resources: Resource[]
  value: string
  onChange: (resourceId: string) => void
  placeholder?: string
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${
        isOpen ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ResourceSelect({
  label,
  resources,
  value,
  onChange,
  placeholder = 'Choose a resource',
}: ResourceSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedResource = resources.find((resource) => resource.id === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function handleSelect(resourceId: string) {
    onChange(resourceId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors duration-300 ease-in-out hover:border-blue-300 hover:bg-slate-50 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-slate-900 dark:focus:border-blue-500 dark:focus:ring-blue-900"
      >
        <span
          className={
            selectedResource
              ? 'font-medium text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500'
          }
        >
          {selectedResource?.name ?? placeholder}
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950"
        >
          {resources.map((resource) => {
            const isSelected = resource.id === value

            return (
              <button
                key={resource.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(resource.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-300 ease-in-out ${
                  isSelected
                    ? 'bg-blue-700 text-white dark:bg-blue-600'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="block font-semibold">{resource.name}</span>
                <span
                  className={`mt-0.5 block text-xs ${
                    isSelected
                      ? 'text-blue-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {resource.location} | Capacity {resource.capacity}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
