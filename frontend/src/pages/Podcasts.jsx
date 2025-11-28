import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPodcast, listPodcasts, getPodcastEpisodes, processEpisode } from '../api/client'

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
  const [selectedPodcast, setSelectedPodcast] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [processingEpisodes, setProcessingEpisodes] = useState(new Set())
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

  const handleSelectPodcast = async (podcast) => {
    setSelectedPodcast(podcast)
    setLoadingEpisodes(true)
    try {
      const data = await getPodcastEpisodes(podcast.id)
      setEpisodes(data.episodes || [])
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
      showToast('Failed to load episodes. Please try again.', 'error')
    } finally {
      setLoadingEpisodes(false)
    }
  }

  const handleProcessEpisode = async (episode) => {
    setProcessingEpisodes(new Set(processingEpisodes).add(episode.guid))
    try {
      const result = await processEpisode(selectedPodcast.id, episode.guid)
      showToast('Processing started! Check "My Episodes" to track progress.', 'success')
      
      // Refresh episodes to update status
      const data = await getPodcastEpisodes(selectedPodcast.id)
      setEpisodes(data.episodes || [])
    } catch (error) {
      console.error('Failed to process episode:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to start processing. Please try again.'
      showToast(errorMsg, 'error')
    } finally {
      const newProcessing = new Set(processingEpisodes)
      newProcessing.delete(episode.guid)
      setProcessingEpisodes(newProcessing)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'new': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'downloading': 'bg-blue-100 text-blue-800',
      'transcribing': 'bg-indigo-100 text-indigo-800',
      'summarizing': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    if (['downloading', 'transcribing', 'summarizing', 'pending'].includes(status)) {
      return <LoadingSpinner size="sm" />
    }
    return null
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
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Podcast</h2>
        <form onSubmit={handleAddPodcast} className="flex gap-4">
          <input
            type="url"
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            placeholder="Paste RSS feed URL here..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
            disabled={addingPodcast}
          />
          <button
            type="submit"
            disabled={addingPodcast}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {addingPodcast && <LoadingSpinner size="sm" />}
            {addingPodcast ? 'Adding...' : 'Add Podcast'}
          </button>
        </form>
      </div>

      {/* Podcasts List */}
      {podcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No podcasts yet. Add your first podcast above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {podcasts.map((podcast) => (
            <div
              key={podcast.id}
              onClick={() => handleSelectPodcast(podcast)}
              className={`bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                selectedPodcast?.id === podcast.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">{podcast.title}</h3>
              <p className="text-sm text-gray-500">{podcast.slug}</p>
            </div>
          ))}
        </div>
      )}

      {/* Episodes List */}
      {selectedPodcast && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Episodes - {selectedPodcast.title}
          </h2>

          {loadingEpisodes ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <LoadingSpinner size="lg" />
              <div className="text-gray-500">Loading episodes...</div>
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No episodes found</div>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <div
                  key={episode.guid}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{episode.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'}
                        {episode.duration_formatted && ` • ${episode.duration_formatted}`}
                      </p>
                      {episode.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                      {episode.status === 'failed' && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="text-red-800 font-medium">Error:</p>
                          <p className="text-red-600 text-xs mt-1">{episode.error_message || 'Processing failed'}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-2 ${getStatusBadge(episode.status)}`}>
                        {getStatusIcon(episode.status)}
                        {episode.status}
                      </span>
                      {episode.status === 'new' && (
                        <button
                          onClick={() => handleProcessEpisode(episode)}
                          disabled={processingEpisodes.has(episode.guid)}
                          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingEpisodes.has(episode.guid) && <LoadingSpinner size="sm" />}
                          {processingEpisodes.has(episode.guid) ? 'Starting...' : 'Process'}
                        </button>
                      )}
                      {episode.status === 'completed' && episode.id && (
                        <button
                          onClick={() => navigate(`/episodes/${episode.id}`)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          View
                        </button>
                      )}
                      {episode.status === 'failed' && (
                        <button
                          onClick={() => handleProcessEpisode(episode)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Podcasts
