import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', path: '/' },
  { label: 'Resources', path: '/resources' },
  { label: 'Book', path: '/book' },
  { label: 'My Bookings', path: '/my-bookings' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-2xl font-bold text-blue-700">NexBook</p>
          <p className="text-sm font-medium text-slate-500">
            Campus resource booking
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
