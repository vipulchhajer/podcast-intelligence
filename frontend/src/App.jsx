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
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <span className="text-2xl">🎙️</span>
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Podcast Intelligence
                  </span>
                </Link>
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
            </div>
          </div>
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


