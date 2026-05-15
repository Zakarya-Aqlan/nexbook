import { useEffect, useRef, useState } from 'react'
import type { Resource } from '../types'

type ResourceSelectLabelTone = 'neutral' | 'warning' | 'success'

export type ResourceSelectLabels = Record<
  string,
  {
    text: string
    tone?: ResourceSelectLabelTone
  }
>

type ResourceSelectProps = {
  label: string
  resources: Resource[]
  value: string
  onChange: (resourceId: string) => void
  placeholder?: string
  unavailableResourceIds?: string[]
  unavailableLabel?: string
  resourceLabels?: ResourceSelectLabels
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

const selectedLabelStyles: Record<ResourceSelectLabelTone, string> = {
  neutral: 'text-slate-500 dark:text-slate-400',
  warning: 'text-amber-700 dark:text-amber-400',
  success: 'text-green-700 dark:text-green-400',
}

const optionBadgeStyles: Record<ResourceSelectLabelTone, string> = {
  neutral:
    'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-900',
  success:
    'bg-green-50 text-green-700 ring-green-100 dark:bg-green-950 dark:text-green-400 dark:ring-green-900',
}

export function ResourceSelect({
  label,
  resources,
  value,
  onChange,
  placeholder = 'Choose a resource',
  unavailableResourceIds = [],
  unavailableLabel = 'Unavailable today',
  resourceLabels = {},
}: ResourceSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedResource = resources.find((resource) => resource.id === value)
  const unavailableResourceSet = new Set(unavailableResourceIds)
  const selectedResourceLabel = selectedResource
    ? getResourceLabel(selectedResource.id)
    : undefined
  const selectedResourceLabelTone = selectedResourceLabel?.tone ?? 'neutral'

  function getResourceLabel(resourceId: string) {
    return (
      resourceLabels[resourceId] ??
      (unavailableResourceSet.has(resourceId)
        ? { text: unavailableLabel, tone: 'warning' as const }
        : undefined)
    )
  }

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
    if (unavailableResourceSet.has(resourceId)) {
      return
    }

    onChange(resourceId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors duration-300 ease-in-out hover:border-slate-400 hover:bg-slate-50 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:focus:border-blue-500 dark:focus:ring-blue-900"
      >
        <span className="min-w-0">
          <span
            className={
              selectedResource
                ? 'block truncate font-medium text-slate-900 dark:text-slate-100'
                : 'block truncate text-slate-400 dark:text-slate-500'
            }
          >
            {selectedResource?.name ?? placeholder}
          </span>
          {selectedResourceLabel && (
            <span
              className={`mt-0.5 block truncate text-xs font-semibold ${selectedLabelStyles[selectedResourceLabelTone]}`}
            >
              {selectedResourceLabel.text}
            </span>
          )}
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="custom-scrollbar absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-800"
        >
          {resources.map((resource) => {
            const isSelected = resource.id === value
            const isUnavailable = unavailableResourceSet.has(resource.id)
            const resourceLabel = getResourceLabel(resource.id)
            const resourceLabelTone = resourceLabel?.tone ?? 'neutral'

            return (
              <button
                key={resource.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isUnavailable}
                onClick={() => handleSelect(resource.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
                  isSelected
                    ? 'bg-blue-700 text-white dark:bg-blue-600'
                    : isUnavailable
                      ? 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="block font-semibold">{resource.name}</span>
                  {resourceLabel && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        isSelected
                          ? 'bg-white/20 text-white ring-white/30'
                          : optionBadgeStyles[resourceLabelTone]
                      }`}
                    >
                      {resourceLabel.text}
                    </span>
                  )}
                </span>
                <span
                  className={`mt-0.5 block text-xs ${
                    isSelected
                      ? 'text-blue-100'
                      : isUnavailable
                        ? 'text-slate-400 dark:text-slate-600'
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
