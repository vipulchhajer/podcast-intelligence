/**
 * Episode Card Component - Multiple Design Variants
 * Choose your favorite design by changing the variant prop
 */

import { Button } from './Button'
import { StatusBadge } from './StatusBadge'
import { sanitizeHtml } from '../utils/sanitizeHtml'

// OPTION 1: Minimal/Clean (Linear/Notion style)
export function EpisodeCardMinimal({ episode, onProcess, onView, isProcessing }) {
  return (
    <div className="group relative bg-white border border-gray-200/60 hover:border-gray-300 rounded-2xl p-6 transition-all duration-300 hover:shadow-sm">
      {/* Status indicator as subtle line */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${
        episode.status === 'completed' ? 'bg-cyan-500' : 
        episode.status === 'failed' ? 'bg-red-500' :
        episode.status === 'new' ? 'bg-gray-300' :
        'bg-blue-500'
      }`} />
      
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 min-w-0 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors">
            {episode.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span>{episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'}</span>
            {episode.duration_formatted && (
              <>
                <span>•</span>
                <span>{episode.duration_formatted}</span>
              </>
            )}
            {episode.status !== 'new' && (
              <>
                <span>•</span>
                <span className="capitalize text-gray-600 font-medium">{episode.status}</span>
              </>
            )}
          </div>
          {episode.description && (
            <div 
              className="text-sm text-gray-600 line-clamp-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.description) }}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {episode.status === 'new' && (
            <Button variant="primary" size="sm" onClick={onProcess} loading={isProcessing}>
              Process
            </Button>
          )}
          {episode.status === 'completed' && (
            <Button variant="ghost" size="sm" onClick={onView}>
              Read →
            </Button>
          )}
          {episode.status === 'failed' && (
            <Button variant="danger" size="sm" onClick={onProcess}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// OPTION 2: Card-based (Spotify/Modern style)
export function EpisodeCardModern({ episode, onProcess, onView, isProcessing }) {
  return (
    <div className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="p-5">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
              {episode.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={episode.status} />
              <span className="text-xs text-gray-500">
                {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'}
              </span>
              {episode.duration_formatted && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{episode.duration_formatted}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {episode.status === 'new' && (
              <Button variant="primary" size="sm" onClick={onProcess} loading={isProcessing}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Process
              </Button>
            )}
            {episode.status === 'completed' && (
              <Button variant="outline" size="sm" onClick={onView}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </Button>
            )}
            {episode.status === 'failed' && (
              <Button variant="danger" size="sm" onClick={onProcess}>
                Retry
              </Button>
            )}
          </div>
        </div>
        
        {episode.description && (
          <div 
            className="text-sm text-gray-600 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.description) }}
          />
        )}
      </div>
    </div>
  )
}

// OPTION 3: Premium/Glassmorphism (Apple/Premium style)
export function EpisodeCardPremium({ episode, onProcess, onView, isProcessing }) {
  const getStatusColor = (status) => {
    const colors = {
      'new': 'from-slate-500/10 to-slate-500/5 border-slate-200',
      'pending': 'from-blue-500/10 to-blue-500/5 border-blue-200',
      'downloading': 'from-blue-500/10 to-blue-500/5 border-blue-200',
      'transcribing': 'from-indigo-500/10 to-indigo-500/5 border-indigo-200',
      'summarizing': 'from-blue-500/10 to-blue-500/5 border-blue-200',
      'completed': 'from-cyan-500/10 to-cyan-500/5 border-cyan-200',
      'failed': 'from-red-500/10 to-red-500/5 border-red-200',
    }
    return colors[status] || colors['new']
  }

  return (
    <div className={`group relative bg-gradient-to-br ${getStatusColor(episode.status)} rounded-2xl p-[1px] hover:scale-[1.01] transition-all duration-300`}>
      <div className="bg-white rounded-2xl p-6 h-full">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Metadata pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                {episode.published ? new Date(episode.published).toLocaleDateString() : 'No date'}
              </span>
              {episode.duration_formatted && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {episode.duration_formatted}
                </span>
              )}
              <StatusBadge status={episode.status} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug group-hover:text-primary-600 transition-colors">
              {episode.title}
            </h3>
            
            {episode.description && (
              <div 
                className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.description) }}
              />
            )}
            
            {/* Action area */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              {episode.status === 'new' && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={onProcess} 
                  loading={isProcessing}
                  className="flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Processing
                </Button>
              )}
              {episode.status === 'completed' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onView}
                  className="flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Read Summary
                </Button>
              )}
              {episode.status === 'failed' && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={onProcess}
                  className="flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpisodeCardModern

