import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEpisode } from '../api/client'
import { Button } from '../components/Button'

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
        <div className="bg-white shadow-sm rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-6">Episode not found</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/episodes')}>
            Back to Episodes
          </Button>
        </div>
      </div>
    )
  }

  const summary = episode.summary || {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="link"
        onClick={() => navigate('/episodes')}
        className="mb-4"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        }
      >
        Back to Episodes
      </Button>

      {/* Header */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Podcast Image */}
          {episode.podcast?.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={episode.podcast.image_url} 
                alt={episode.podcast.title}
                className="w-full sm:w-40 sm:h-40 rounded-lg object-cover shadow-md"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span className="text-sm font-medium text-primary-600">{episode.podcast?.title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{episode.title}</h1>
            {episode.published && (
              <p className="text-sm text-gray-500">
                Published: {new Date(episode.published).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-3xl">📝</span>
                    Executive Summary
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-base">
                        {summary.executive_summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Themes */}
              {summary.key_themes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-3xl">🎯</span>
                    Key Themes
                  </h2>
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-base">
                        {summary.key_themes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notable Quotes */}
              {summary.notable_quotes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-3xl">💬</span>
                    Notable Quotes
                  </h2>
                  <div className="space-y-6">
                    {(() => {
                      // Extract only the numbered quotes from the notable_quotes field
                      // The AI returns a summary followed by numbered quotes
                      const quotesText = summary.notable_quotes
                      
                      // Find where the numbered list starts (look for pattern like "1. " at start of line)
                      const lines = quotesText.split('\n')
                      const quoteLines = []
                      let inQuoteSection = false
                      
                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim()
                        // Check if this line starts with a number followed by a period
                        if (/^\d+\.\s+/.test(line)) {
                          inQuoteSection = true
                          quoteLines.push(line)
                        } else if (inQuoteSection && line.startsWith('"') && !line.match(/^\d+\./)) {
                          // Continuation of previous quote (multi-line quote)
                          if (quoteLines.length > 0) {
                            quoteLines[quoteLines.length - 1] += ' ' + line
                          }
                        }
                      }
                      
                      // If no numbered quotes found, fallback to splitting by double newlines
                      if (quoteLines.length === 0) {
                        quoteLines.push(...quotesText.split('\n\n').filter(q => q.trim() && q.includes('"')))
                      }
                      
                      return quoteLines.map((quoteLine, index) => {
                        // Remove numbering (e.g., "1. ", "2. ")
                        const cleanLine = quoteLine.replace(/^\d+\.\s*/, '').trim()
                        
                        // Extract quote and context
                        // Pattern 1: "Quote text" — Context
                        // Pattern 2: "Quote text" Context (no em dash)
                        const quoteMatch = cleanLine.match(/^[""]([^""]+?)[""][\s—-]*(.*)$/)
                        
                        if (!quoteMatch) {
                          // If no match, skip this line
                          return null
                        }
                        
                        const actualQuote = quoteMatch[1].trim()
                        const context = quoteMatch[2].replace(/^[\s—-]+/, '').trim()
                        
                        return (
                          <div key={index} className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-primary-500 rounded-r-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            {/* Quote icon */}
                            <svg className="absolute top-4 left-4 w-8 h-8 text-primary-200" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                            
                            {/* Quote text - Serif, larger, italic */}
                            <blockquote className="relative ml-6">
                              <p className="font-serif text-xl text-gray-900 leading-relaxed italic font-normal mb-3">
                                "{actualQuote}"
                              </p>
                              
                              {/* Context/Commentary - Sans-serif, smaller, lighter */}
                              {context && (
                                <footer className="font-sans text-sm text-gray-600 font-normal not-italic border-t border-gray-200 pt-3 mt-3">
                                  {context}
                                </footer>
                              )}
                            </blockquote>
                          </div>
                        )
                      }).filter(Boolean)
                    })()}
                  </div>
                </div>
              )}

              {/* Actionable Insights */}
              {summary.actionable_insights && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-3xl">💡</span>
                    Actionable Insights
                  </h2>
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6 shadow-sm">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-base">
                        {summary.actionable_insights}
                      </p>
                    </div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-3xl">📄</span>
                Full Transcript
              </h2>
              {episode.transcript ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap font-sans text-gray-600 text-sm leading-loose">
                      {episode.transcript}
                    </p>
                  </div>
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


