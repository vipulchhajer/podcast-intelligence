/**
 * Custom hook for polling/auto-refreshing data at regular intervals
 * 
 * Use this hook whenever you need to keep data in sync with the backend,
 * especially for status updates on episodes or long-running processes.
 * 
 * @param {Function} callback - Function to call on each interval (should be async)
 * @param {number} interval - Time between calls in milliseconds (default: 3000ms = 3s)
 * @param {Array} dependencies - Dependencies array for useEffect (when to restart polling)
 * 
 * @example
 * // In your component:
 * usePolling(() => fetchEpisodes(true), 3000, [podcastId])
 * 
 * // This will call fetchEpisodes(true) every 3 seconds
 * // and restart if podcastId changes
 */

import { useEffect } from 'react'

export const usePolling = (callback, interval = 3000, dependencies = []) => {
  useEffect(() => {
    // Start polling
    const timer = setInterval(() => {
      callback()
    }, interval)
    
    // Cleanup on unmount or dependency change
    return () => clearInterval(timer)
  }, dependencies)
}

export default usePolling



