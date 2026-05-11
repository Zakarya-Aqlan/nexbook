import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { BookResource } from './pages/BookResource'
import { Dashboard } from './pages/Dashboard'
import { MyBookings } from './pages/MyBookings'
import { Resources } from './pages/Resources'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/book" element={<BookResource />} />
          <Route path="/book/:resourceId" element={<BookResource />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
