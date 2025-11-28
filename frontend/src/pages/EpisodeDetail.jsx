import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEpisode } from '../api/client'

function EpisodeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [episode, setEpisode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    fetchEpisode()
  }, [id])

  const fetchEpisode = async () => {
    try {
      const data = await getEpisode(id)
      setEpisode(data)
    } catch (error) {
      console.error('Failed to fetch episode:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading episode...</div>
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Episode not found</p>
          <button
            onClick={() => navigate('/episodes')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Episodes
          </button>
        </div>
      </div>
    )
  }

  const summary = episode.summary || {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/episodes')}
        className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Episodes
      </button>

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <span className="text-sm font-medium text-primary-600">{episode.podcast?.title}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{episode.title}</h1>
        {episode.published && (
          <p className="text-sm text-gray-500">
            Published: {new Date(episode.published).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
        {episode.description && (
          <p className="mt-4 text-gray-600">{episode.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'summary'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'transcript'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Transcript
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-8">
              {/* Executive Summary */}
              {summary.executive_summary && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Executive Summary</h2>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {summary.executive_summary}
                    </pre>
                  </div>
                </div>
              )}

              {/* Key Themes */}
              {summary.key_themes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Key Themes</h2>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {summary.key_themes}
                    </pre>
                  </div>
                </div>
              )}

              {/* Notable Quotes */}
              {summary.notable_quotes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Notable Quotes</h2>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {summary.notable_quotes}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actionable Insights */}
              {summary.actionable_insights && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Actionable Insights</h2>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {summary.actionable_insights}
                    </pre>
                  </div>
                </div>
              )}

              {!summary.executive_summary && !summary.key_themes && (
                <p className="text-gray-500">No summary available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Transcript</h2>
              {episode.transcript ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                    {episode.transcript}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500">No transcript available yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EpisodeDetail

