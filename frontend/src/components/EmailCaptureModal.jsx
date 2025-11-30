import { useState } from 'react'
import { Button } from './Button'

export function EmailCaptureModal({ isOpen, onClose, onSubmit }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(email)
      // Modal will close from parent
    } catch (err) {
      setError(err.message || 'Failed to submit email. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Podcast Intelligence!
          </h2>
          <p className="text-gray-600">
            This is a beta app shared with friends. Drop your email so I can reach out for feedback.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              required
              autoFocus
              disabled={submitting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Privacy note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-medium">📧 I promise no spam!</span>
              <br />
              You may receive ONE email from me asking for feedback. That's it.
            </p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Get Started'}
          </Button>
        </form>

        {/* Skip option */}
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          disabled={submitting}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

