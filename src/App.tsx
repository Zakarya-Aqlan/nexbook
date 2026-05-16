import { Navigate, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { BookResource } from './pages/BookResource'
import { Dashboard } from './pages/Dashboard'
import { MyBookings } from './pages/MyBookings'
import { Resources } from './pages/Resources'

function App() {
  return (
    <div className="min-h-screen bg-slate-100 font-['Inter',sans-serif] text-slate-900 transition-colors duration-300 ease-in-out dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/book" element={<BookResource />} />
          <Route path="/book/:resourceId" element={<BookResource />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App
