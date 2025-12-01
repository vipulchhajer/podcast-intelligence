/**
 * Status Badge Component
 * Consistent status display across the app
 */

const LoadingSpinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const statusConfig = {
  pending: {
    colors: 'bg-blue-50 text-blue-700 border-blue-200/60',
    label: 'Queued',
    icon: <LoadingSpinner />,
  },
  downloading: {
    colors: 'bg-blue-50 text-blue-700 border-blue-200/60',
    label: 'Downloading',
    icon: <LoadingSpinner />,
  },
  transcribing: {
    colors: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    label: 'Transcribing',
    icon: <LoadingSpinner />,
  },
  summarizing: {
    colors: 'bg-blue-50 text-blue-700 border-blue-200/60',
    label: 'Summarizing',
    icon: <LoadingSpinner />,
  },
  completed: {
    colors: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
    label: 'Ready',
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  failed: {
    colors: 'bg-red-50 text-red-700 border-red-200/60',
    label: 'Failed',
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
}

export function StatusBadge({ status, variant = 'default', className = '' }) {
  // Default to 'pending' for unknown statuses (better than 'new' which implies clickable)
  const config = statusConfig[status] || statusConfig.pending
  
  if (variant === 'dot') {
    // Minimal dot variant
    const dotColors = {
      pending: 'bg-blue-400',
      downloading: 'bg-blue-400',
      transcribing: 'bg-indigo-400',
      summarizing: 'bg-blue-400',
      completed: 'bg-cyan-400',
      failed: 'bg-red-400',
    }
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`w-2 h-2 rounded-full ${dotColors[status] || dotColors.pending}`} />
        <span className="text-sm text-gray-600 capitalize">{config.label}</span>
      </div>
    )
  }
  
  // Default pill variant
  return (
    <span className={`
      inline-flex items-center gap-1.5
      px-2.5 py-1 rounded-full
      text-xs font-medium
      border
      ${config.colors}
      ${className}
    `}>
      {config.icon}
      {config.label}
    </span>
  )
}

export default StatusBadge

