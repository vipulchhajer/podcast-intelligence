import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Podcasts from './pages/Podcasts'
import PodcastEpisodes from './pages/PodcastEpisodes'
import Episodes from './pages/Episodes'
import EpisodeDetail from './pages/EpisodeDetail'
import DesignDemo from './pages/DesignDemo'
import { EmailCaptureModal } from './components/EmailCaptureModal'
import { captureEmail } from './api/client'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  // Check if user has already provided email
  useEffect(() => {
    const emailSubmitted = localStorage.getItem('emailSubmitted')
    if (!emailSubmitted) {
      // Show modal after a short delay (better UX)
      setTimeout(() => setShowEmailModal(true), 1000)
    }
  }, [])

  const handleEmailSubmit = async (email) => {
    try {
      await captureEmail(email)
      localStorage.setItem('emailSubmitted', 'true')
      localStorage.setItem('userEmail', email)
      setShowEmailModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleEmailSkip = () => {
    localStorage.setItem('emailSubmitted', 'skipped')
    setShowEmailModal(false)
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Email Capture Modal */}
        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={handleEmailSkip}
          onSubmit={handleEmailSubmit}
        />

        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo */}
              <div className="flex">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <span className="text-2xl">🎙️</span>
                  <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                    Podcast Intelligence
                  </span>
                </Link>
                {/* Desktop Navigation */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-primary-500"
                  >
                    Home
                  </Link>
                  <Link
                    to="/podcasts"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-primary-500"
                  >
                    Podcasts
                  </Link>
                  <Link
                    to="/episodes"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-primary-500"
                  >
                    My Episodes
                  </Link>
                </div>
              </div>
              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
                  aria-expanded="false"
                  aria-label="Main menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200">
              <div className="pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/podcasts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  Podcasts
                </Link>
                <Link
                  to="/episodes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  My Episodes
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/podcasts/:podcastId" element={<PodcastEpisodes />} />
            <Route path="/episodes" element={<Episodes />} />
            <Route path="/episodes/:id" element={<EpisodeDetail />} />
            <Route path="/design-demo" element={<DesignDemo />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App


