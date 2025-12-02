import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPodcastEpisodes, processEpisode } from '../api/client'
import { sanitizeHtml } from '../utils/sanitizeHtml'
import { usePolling } from '../hooks/usePolling'
import { Button } from '../components/Button'
import { EpisodeCardModern } from '../components/EpisodeCard'
import { Pagination } from '../components/Pagination'

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

function PodcastEpisodes() {
  const { podcastId } = useParams()
  const navigate = useNavigate()
  const [podcast, setPodcast] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [processingEpisodes, setProcessingEpisodes] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalInFeed, setTotalInFeed] = useState(0)
  const episodesPerPage = 20

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const fetchEpisodes = useCallback(async (silent = false) => {
    if (!silent) setPageLoading(true)
    try {
      const offset = (currentPage - 1) * episodesPerPage
      const data = await getPodcastEpisodes(podcastId, episodesPerPage, offset)
      setPodcast(data.podcast)
      setEpisodes(data.episodes || [])
      setTotalInFeed(data.total_in_feed || 0)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
      if (!silent) showToast('Failed to load episodes. Please try again.', 'error')
    } finally {
      setInitialLoading(false)
      if (!silent) setPageLoading(false)
    }
  }, [podcastId, currentPage, episodesPerPage])

  useEffect(() => {
    fetchEpisodes()
  }, [fetchEpisodes])

  // Auto-refresh episode statuses every 3 seconds
  usePolling(() => fetchEpisodes(true), 3000, [podcastId, currentPage])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProcessEpisode = async (episode) => {
    setProcessingEpisodes(new Set(processingEpisodes).add(episode.guid))
    try {
      const result = await processEpisode(podcastId, episode.guid)
      
      // Optimistically update local state to show "pending" status immediately
      setEpisodes(prevEpisodes => 
        prevEpisodes.map(ep => 
          ep.guid === episode.guid 
            ? { ...ep, status: 'pending', id: result.episode_id }
            : ep
        )
      )
      
      showToast('Processing started! Check "My Episodes" to track progress.', 'success')
      
      // Refresh episodes to get latest status from server
      setTimeout(() => {
        fetchEpisodes(true)
      }, 2000) // Increased to 2 seconds for better reliability
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


  if (initialLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-gray-500">Loading episodes...</div>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Podcast not found</p>
          <Button variant="primary" size="md" onClick={() => navigate('/podcasts')} className="w-full sm:w-auto">
            Back to Podcasts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Back Button */}
      <Button
        variant="link"
        onClick={() => navigate('/podcasts')}
        className="mb-3 sm:mb-4 text-sm sm:text-base"
        icon={
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        }
      >
        Back to Podcasts
      </Button>

      {/* Podcast Header */}
      <div className="bg-white shadow-sm rounded-lg sm:rounded-xl overflow-hidden mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
          {podcast.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={podcast.image_url} 
                alt={podcast.title}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg object-cover shadow-md mx-auto sm:mx-0"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{podcast.title}</h1>
            {podcast.author && (
              <p className="text-sm text-gray-600 mb-2">By {podcast.author}</p>
            )}
            <p className="text-sm text-gray-500">{episodes.length} episodes available</p>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Episodes</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {episodes.length > 0 && (
                <>
                  Showing {(currentPage - 1) * episodesPerPage + 1}-
                  {Math.min(currentPage * episodesPerPage, totalInFeed)} of {totalInFeed} episodes from RSS feed
                </>
              )}
              {episodes.length === 0 && (
                <>No episodes found</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Auto-updates every 3s • Last: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => fetchEpisodes(false)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              className="text-xs sm:text-sm"
            >
              Refresh
            </Button>
          </div>
        </div>

        {episodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No episodes found</div>
        ) : (
          <>
            <div className="relative">
              {/* Loading overlay */}
              {pageLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm text-gray-600 font-medium">Loading episodes...</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <EpisodeCardModern
                    key={episode.guid}
                    episode={episode}
                    onProcess={() => handleProcessEpisode(episode)}
                    onView={() => navigate(`/episodes/${episode.id}`)}
                    isProcessing={processingEpisodes.has(episode.guid)}
                  />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalInFeed > episodesPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalInFeed / episodesPerPage)}
                onPageChange={handlePageChange}
                total={totalInFeed}
                showing={episodes.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PodcastEpisodes

