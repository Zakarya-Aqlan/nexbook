import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', path: '/' },
  { label: 'Resources', path: '/resources' },
  { label: 'Book', path: '/book' },
  { label: 'My Bookings', path: '/my-bookings' },
]

type Theme = 'light' | 'dark'

const themeKey = 'nexbook-theme'

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(themeKey)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function Navbar() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(themeKey, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            NexBook
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Campus resource booking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-blue-900"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>
    </header>
  )
}
