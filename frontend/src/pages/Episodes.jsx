import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEpisodes, processEpisode } from '../api/client'

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

  // Separate effect for polling (runs once on mount)
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if we need to poll by fetching current state
      fetchEpisodes(true)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

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

  const getStatusBadge = (status) => {
    const badges = {
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
    if (status === 'completed') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
    if (status === 'failed') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
    return null
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Episodes</h1>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 rounded-md text-sm ${
              statusFilter === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm ${
              statusFilter === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('transcribing')}
            className={`px-4 py-2 rounded-md text-sm ${
              statusFilter === 'transcribing'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Processing
          </button>
        </div>
      </div>

      {episodes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No episodes yet. Start by adding a podcast!</p>
          <button
            onClick={() => navigate('/podcasts')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go to Podcasts
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
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
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {episode.podcast_title}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{episode.title}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'} •{' '}
                      {new Date(episode.created_at).toLocaleDateString()}
                    </p>
                    {episode.status === 'failed' && episode.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-800 text-xs font-medium">Error:</p>
                        <p className="text-red-600 text-xs mt-1">{episode.error_message}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        episode.status
                      )}`}
                    >
                      {getStatusIcon(episode.status)}
                      {episode.status}
                    </span>
                    
                    {/* Retry button for failed episodes */}
                    {episode.status === 'failed' && (
                      <button
                        onClick={(e) => handleRetry(episode, e)}
                        disabled={retrying[episode.id]}
                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        title="Restart processing this episode"
                      >
                        {retrying[episode.id] ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Retry button for stuck pending episodes (likely failed to start) */}
                    {episode.status === 'pending' && (
                      <button
                        onClick={(e) => handleRetry(episode, e)}
                        disabled={retrying[episode.id]}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title="Episode seems stuck. Click to restart."
                      >
                        {retrying[episode.id] ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Restarting...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Show progress message only for actually processing episodes */}
                    {['downloading', 'transcribing', 'summarizing'].includes(episode.status) && (
                      <div className="text-xs text-gray-500 italic">
                        Processing... Please wait
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
