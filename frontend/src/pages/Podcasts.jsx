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

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  
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
  const navigate = useNavigate()

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
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

    setAddingPodcast(true)
    try {
      const result = await addPodcast(rssUrl)
      setRssUrl('')
      await fetchPodcasts()
      showToast(`Successfully added: ${result.podcast.title}`, 'success')
    } catch (error) {
      console.error('Failed to add podcast:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to add podcast. Please check the RSS URL.'
      showToast(errorMsg, 'error')
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Podcasts</h1>

      {/* Add Podcast Form */}
      <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Podcast</h2>
        <form onSubmit={handleAddPodcast} className="flex flex-col sm:flex-row gap-4">
          <input
            type="url"
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            placeholder="Paste RSS feed URL here..."
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
            disabled={addingPodcast}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={addingPodcast}
            disabled={addingPodcast}
          >
            {addingPodcast ? 'Adding...' : 'Add Podcast'}
          </Button>
        </form>
      </div>

      {/* Podcasts List */}
      {podcasts.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl p-12 text-center">
          <p className="text-gray-500">No podcasts yet. Add your first podcast above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {podcasts.map((podcast) => (
            <div
              key={podcast.id}
              onClick={() => handlePodcastClick(podcast)}
              className="bg-white shadow-sm rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
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
              <div className="p-4">
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 line-clamp-2">{podcast.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 truncate">{podcast.slug}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Podcasts
