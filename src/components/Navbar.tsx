import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import nexbookLogo from '../assets/nexbook-logo.svg'

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

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
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
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur transition-colors duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[2.75rem_1fr_2.75rem] lg:px-8">
        <NavLink
          to="/"
          aria-label="NexBook home"
          className="inline-flex h-11 w-11 items-center justify-center justify-self-start rounded-2xl border border-white/70 bg-white shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800 dark:focus:ring-blue-900"
        >
          <img
            src={nexbookLogo}
            alt="NexBook"
            className="h-9 w-9 object-contain"
          />
        </NavLink>

        <div className="col-span-2 flex justify-center lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex max-w-full flex-wrap justify-center gap-1.5 rounded-2xl border border-white/70 bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 dark:ring-slate-800">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 ${
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
        </div>

        <div className="flex justify-end lg:col-start-3 lg:row-start-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            title={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-blue-900"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>
    </header>
  )
}
