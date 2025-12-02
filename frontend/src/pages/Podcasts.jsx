import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPodcast, listPodcasts } from '../api/client'
import { Button } from '../components/Button'

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-blue-500' : 'bg-primary-600'
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}></div>
  )
}

function Podcasts() {
  const [podcasts, setPodcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [rssUrl, setRssUrl] = useState('')
  const [addingPodcast, setAddingPodcast] = useState(false)
  const [toast, setToast] = useState(null)
  const [urlError, setUrlError] = useState('')
  const navigate = useNavigate()

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // Validate URL format as user types
  const handleUrlChange = (e) => {
    const url = e.target.value
    setRssUrl(url)
    setUrlError('') // Clear error when user types
    
    if (url && !url.match(/^https?:\/\/.+/i)) {
      setUrlError('URL must start with http:// or https://')
    }
  }

  useEffect(() => {
    fetchPodcasts()
  }, [])

  const fetchPodcasts = async () => {
    try {
      const data = await listPodcasts()
      setPodcasts(data)
    } catch (error) {
      console.error('Failed to fetch podcasts:', error)
      showToast('Failed to load podcasts. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPodcast = async (e) => {
    e.preventDefault()
    if (!rssUrl) return
    
    // Clear previous errors
    setUrlError('')

    // Validate URL format
    if (!rssUrl.match(/^https?:\/\/.+/i)) {
      setUrlError('Please enter a valid URL starting with http:// or https://')
      return
    }

    // Warn about Substack podcasts
    if (rssUrl.toLowerCase().includes('substack.com')) {
      const proceed = window.confirm(
        '⚠️ Substack Podcast Detected\n\n' +
        'This podcast is hosted on Substack, which often blocks automated downloads.\n\n' +
        'Episodes may fail to process. Consider:\n' +
        '• Using getrssfeed.com to find alternative RSS sources\n' +
        '• Checking the podcast\'s website for a direct RSS feed\n\n' +
        'Proceed anyway?'
      )
      if (!proceed) return
    }

    setAddingPodcast(true)
    try {
      const result = await addPodcast(rssUrl)
      setRssUrl('')
      setUrlError('')
      await fetchPodcasts()
      showToast(`✓ Successfully added: ${result.podcast.title}`, 'success')
    } catch (error) {
      console.error('Failed to add podcast:', error)
      
      // Get error message from backend
      const errorMsg = error.response?.data?.detail || 'Unable to add podcast. Please check the RSS feed URL and try again.'
      
      // Show error in both toast and inline
      showToast(errorMsg, 'error')
      setUrlError(errorMsg)
    } finally {
      setAddingPodcast(false)
    }
  }

  const handlePodcastClick = (podcast) => {
    navigate(`/podcasts/${podcast.id}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-gray-500">Loading podcasts...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Podcasts</h1>

      {/* Add Podcast Form */}
      <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Add New Podcast</h2>
        <form onSubmit={handleAddPodcast} className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                value={rssUrl}
                onChange={handleUrlChange}
                placeholder="Paste RSS feed URL here..."
                className={`flex-1 rounded-lg shadow-sm text-sm sm:text-base focus:ring-primary-500 ${
                  urlError 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                required
                disabled={addingPodcast}
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={addingPodcast}
                disabled={addingPodcast || !!urlError}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {addingPodcast ? 'Adding...' : 'Add Podcast'}
              </Button>
            </div>
            
            {/* Inline error message */}
            {urlError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{urlError}</p>
                  <p className="text-xs text-red-700 mt-1">
                    💡 Try using <a href="https://getrssfeed.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-900">getrssfeed.com</a> to find the correct RSS feed URL
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Helper text */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-2">How to find RSS feed URLs</h3>
                <ul className="text-xs text-blue-800 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5 font-bold">1.</span>
                    <span>Open <a href="https://getrssfeed.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 font-medium">getrssfeed.com</a> and paste the podcast URL from Apple Podcasts, SoundCloud, or Deezer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5 font-bold">2.</span>
                    <span>Look for RSS, Subscribe, or <svg className="w-3 h-3 inline-block" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"/><path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"/></svg> feed icons on podcast websites</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Podcasts List */}
      {podcasts.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-8 sm:p-12 text-center">
          <p className="text-gray-500 text-sm sm:text-base">No podcasts yet. Add your first podcast above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {podcasts.map((podcast) => (
            <div
              key={podcast.id}
              onClick={() => handlePodcastClick(podcast)}
              className="bg-white shadow-sm rounded-lg sm:rounded-xl overflow-hidden cursor-pointer hover:shadow-md active:scale-95 sm:hover:scale-[1.02] transition-all duration-200 group"
            >
              {podcast.image_url && (
                <div className="w-full aspect-square bg-gray-100">
                  <img 
                    src={podcast.image_url} 
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="p-2 sm:p-3 md:p-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-2">{podcast.title}</h3>
                <p className="text-xs text-gray-500 truncate hidden sm:block">{podcast.slug}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Podcasts
