import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEpisodes, processEpisode } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'

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

function Episodes() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)
  const [retrying, setRetrying] = useState({}) // Track retry state per episode
  const navigate = useNavigate()

  useEffect(() => {
    fetchEpisodes()
  }, [statusFilter])

  // Auto-refresh episode statuses every 3 seconds
  usePolling(() => fetchEpisodes(true), 3000, [])

  const fetchEpisodes = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await listEpisodes(50, statusFilter)
      setEpisodes(data)
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRetry = async (episode, e) => {
    e.stopPropagation() // Prevent navigation when clicking retry
    
    setRetrying(prev => ({ ...prev, [episode.id]: true }))
    
    try {
      await processEpisode(episode.podcast_id, episode.guid)
      
      // Refresh episodes after a short delay
      setTimeout(() => {
        fetchEpisodes(true)
      }, 1000)
    } catch (error) {
      console.error('Failed to retry episode:', error)
      alert(error.response?.data?.detail || 'Failed to retry episode. Please try again.')
    } finally {
      setRetrying(prev => ({ ...prev, [episode.id]: false }))
    }
  }


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-gray-500">Loading episodes...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Episodes</h1>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === 'transcribing' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('transcribing')}
          >
            Processing
          </Button>
        </div>
      </div>

      {episodes.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-6">No episodes yet. Start by adding a podcast!</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/podcasts')}>
            Go to Podcasts
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {episodes.map((episode) => (
              <li
                key={episode.id}
                onClick={() => episode.status === 'completed' && navigate(`/episodes/${episode.id}`)}
                className={`p-6 ${
                  episode.status === 'completed'
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Podcast Thumbnail - Hidden on mobile, shown on sm+ */}
                  {episode.podcast_image_url && (
                    <div className="hidden sm:block flex-shrink-0">
                      <img 
                        src={episode.podcast_image_url} 
                        alt={episode.podcast_title}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {episode.podcast_title}
                    </p>
                    <p className="mt-1 text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{episode.title}</p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'} •{' '}
                      {new Date(episode.created_at).toLocaleDateString()}
                    </p>
                    {episode.status === 'failed' && episode.error_message && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <p className="text-red-800 text-xs font-semibold">Processing Failed</p>
                            </div>
                            <p className="text-red-600 text-xs leading-relaxed">{episode.error_message}</p>
                            <p className="text-red-700 text-xs mt-2 font-medium">
                              💡 Click "Retry" to process this episode again
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                    <StatusBadge status={episode.status} />
                    
                    {/* Retry button for failed episodes */}
                    {episode.status === 'failed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => handleRetry(episode, e)}
                        loading={retrying[episode.id]}
                        disabled={retrying[episode.id]}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        }
                      >
                        {retrying[episode.id] ? 'Retrying...' : 'Retry'}
                      </Button>
                    )}
                    
                    {/* Restart button for stuck pending episodes */}
                    {episode.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleRetry(episode, e)}
                        loading={retrying[episode.id]}
                        disabled={retrying[episode.id]}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        }
                      >
                        {retrying[episode.id] ? 'Restarting...' : 'Restart'}
                      </Button>
                    )}
                    
                    {/* Show progress message only for actually processing episodes */}
                    {['downloading', 'transcribing', 'summarizing'].includes(episode.status) && (
                      <div className="text-xs text-gray-500 italic">
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Episodes
