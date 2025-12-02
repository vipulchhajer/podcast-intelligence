import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEpisodes, processEpisode } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { Pagination } from '../components/Pagination'

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

// Skeleton loader for episodes
const EpisodeSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
)

function Episodes() {
  const [episodes, setEpisodes] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)
  const [retrying, setRetrying] = useState({}) // Track retry state per episode
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEpisodes, setTotalEpisodes] = useState(0)
  const [limit] = useState(20) // Episodes per page
  const [expandedPodcasts, setExpandedPodcasts] = useState(new Set()) // Track which podcasts are expanded
  const navigate = useNavigate()

  const togglePodcast = (podcastId) => {
    const newExpanded = new Set(expandedPodcasts)
    if (newExpanded.has(podcastId)) {
      newExpanded.delete(podcastId)
    } else {
      newExpanded.add(podcastId)
    }
    setExpandedPodcasts(newExpanded)
  }

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter changes
    fetchEpisodes()
  }, [statusFilter])

  useEffect(() => {
    fetchEpisodes()
  }, [currentPage])

  // Auto-refresh episode statuses every 3 seconds
  usePolling(() => fetchEpisodes(true), 3000, [currentPage, statusFilter])

  const fetchEpisodes = async (silent = false) => {
    try {
      const offset = (currentPage - 1) * limit
      const data = await listEpisodes(limit, offset, statusFilter)
      setEpisodes(data.episodes)
      setTotalEpisodes(data.total)
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(totalEpisodes / limit)

  // Group episodes by podcast
  const groupedEpisodes = episodes.reduce((groups, episode) => {
    const podcastKey = episode.podcast_id
    if (!groups[podcastKey]) {
      groups[podcastKey] = {
        podcast_id: episode.podcast_id,
        podcast_title: episode.podcast_title,
        podcast_image_url: episode.podcast_image_url,
        episodes: []
      }
    }
    groups[podcastKey].episodes.push(episode)
    return groups
  }, {})

  const podcastGroups = Object.values(groupedEpisodes)

  // Helper functions for expand/collapse
  const expandAll = () => {
    const allPodcastIds = podcastGroups.map(group => group.podcast_id)
    setExpandedPodcasts(new Set(allPodcastIds))
  }

  const collapseAll = () => {
    setExpandedPodcasts(new Set())
  }

  const allExpanded = podcastGroups.length > 0 && expandedPodcasts.size === podcastGroups.length

  const handleRetry = async (episode, e) => {
    e.stopPropagation() // Prevent navigation when clicking retry
    
    setRetrying(prev => ({ ...prev, [episode.id]: true }))
    
    try {
      await processEpisode(episode.podcast_id, episode.guid)
      
      // Optimistically update local state
      setEpisodes(prevEpisodes =>
        prevEpisodes.map(ep =>
          ep.id === episode.id
            ? { ...ep, status: 'pending', error_message: null }
            : ep
        )
      )
      
      // Refresh episodes to get latest status from server
      setTimeout(() => {
        fetchEpisodes(true)
      }, 2000)
    } catch (error) {
      console.error('Failed to retry episode:', error)
      // Use console for now - could add toast notification in future
      window.alert(error.response?.data?.detail || 'Failed to retry episode. Please try again.')
    } finally {
      setRetrying(prev => ({ ...prev, [episode.id]: false }))
    }
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Episodes</h1>
          
          {/* Status Filter */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={statusFilter === null ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(null)}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === 'transcribing' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('transcribing')}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Processing
            </Button>
          </div>
        </div>

        {/* Expand/Collapse All - Only show if there are podcasts */}
        {podcastGroups.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="link"
              size="sm"
              onClick={allExpanded ? collapseAll : expandAll}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {allExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              }
              className="text-xs sm:text-sm"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        )}
      </div>

      {/* Show skeleton loaders while initial data is loading */}
      {initialLoading ? (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Loading your episodes...</span>
          </div>
          {[1, 2, 3, 4, 5].map(i => <EpisodeSkeleton key={i} />)}
        </div>
      ) : episodes.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
          <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">No episodes yet. Start by adding a podcast!</p>
          <Button variant="primary" size="md" onClick={() => navigate('/podcasts')} className="w-full sm:w-auto">
            Go to Podcasts
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {/* Accordion: Group episodes by podcast */}
            {podcastGroups.map((group) => {
              const isExpanded = expandedPodcasts.has(group.podcast_id)
              
              return (
                <div key={group.podcast_id} className="bg-white shadow-sm rounded-lg sm:rounded-xl overflow-hidden transition-all">
                  {/* Podcast header - Clickable to expand/collapse */}
                  <button
                    onClick={() => togglePodcast(group.podcast_id)}
                    className="w-full bg-gradient-to-r from-primary-50 to-white px-4 sm:px-6 py-3 sm:py-4 hover:from-primary-100 hover:to-primary-50 transition-colors active:bg-primary-100"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {group.podcast_image_url && (
                        <img 
                          src={group.podcast_image_url} 
                          alt={group.podcast_title}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-sm flex-shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{group.podcast_title}</h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {group.episodes.length} episode{group.episodes.length !== 1 ? 's' : ''}
                          {!isExpanded && (
                            <span className="text-gray-500 hidden sm:inline"> • Tap to expand</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* View Podcast link - Hidden on mobile, shown on desktop */}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/podcasts/${group.podcast_id}`)
                          }}
                          className="hidden sm:inline-flex text-xs"
                        >
                          View Podcast →
                        </Button>
                        {/* Expand/Collapse Icon - Prominent on mobile */}
                        <svg 
                          className={`w-5 h-5 sm:w-6 sm:h-6 text-primary-600 sm:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Episodes list - Only shown when expanded */}
                  {isExpanded && (
                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                      {group.episodes.map((episode) => (
                    <li
                      key={episode.id}
                      onClick={() => episode.status === 'completed' && navigate(`/episodes/${episode.id}`)}
                      className={`p-4 sm:p-6 ${
                        episode.status === 'completed'
                          ? 'hover:bg-gray-50 cursor-pointer active:bg-gray-100'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug">{episode.title}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'} •{' '}
                            Added {new Date(episode.created_at).toLocaleDateString()}
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
                                  
                                  {/* Show helpful tip for "Access denied" errors */}
                                  {episode.error_message.toLowerCase().includes('access denied') || 
                                   episode.error_message.toLowerCase().includes('blocking downloads') ? (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <p className="text-blue-800 text-xs font-medium mb-1">💡 Tip: Try Alternative RSS</p>
                                      <p className="text-blue-700 text-xs">
                                        Visit{' '}
                                        <a 
                                          href="https://getrssfeed.com" 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="underline hover:text-blue-900 font-medium"
                                        >
                                          getrssfeed.com
                                        </a>
                                        {' '}to find alternative RSS feeds for this podcast that may work better.
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-red-700 text-xs mt-2 font-medium">
                                      💡 Click "Retry" to process this episode again
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              }
                              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <span className="hidden sm:inline">{retrying[episode.id] ? 'Retrying...' : 'Retry'}</span>
                              <span className="sm:hidden">Retry</span>
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
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              }
                              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              <span className="hidden sm:inline">{retrying[episode.id] ? 'Restarting...' : 'Restart'}</span>
                              <span className="sm:hidden">Restart</span>
                            </Button>
                          )}
                          
                          {/* Show progress message only for actually processing episodes */}
                          {['downloading', 'transcribing', 'summarizing'].includes(episode.status) && (
                            <div className="text-xs text-gray-500 italic hidden sm:block">
                              Processing...
                            </div>
                          )}
                        </div>
                      </div>
                      </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 bg-white shadow-sm rounded-xl overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                total={totalEpisodes}
                showing={episodes.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Episodes
