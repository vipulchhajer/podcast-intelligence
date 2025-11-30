# React Hooks

Custom React hooks for the Podcast Intelligence app.

## usePolling

**Purpose:** Auto-refresh data at regular intervals to keep UI in sync with backend.

**When to use:**
- Displaying episode statuses that change over time
- Any page showing real-time processing status
- Long-running background tasks

**Usage:**

```javascript
import { usePolling } from '../hooks/usePolling'

function MyComponent() {
  const [data, setData] = useState([])
  
  const fetchData = async (silent = false) => {
    // Your fetch logic here
    const result = await api.getData()
    setData(result)
  }
  
  // Initial load
  useEffect(() => {
    fetchData()
  }, [])
  
  // Auto-refresh every 3 seconds
  usePolling(() => fetchData(true), 3000, [])
  
  return <div>{/* render data */}</div>
}
```

**Parameters:**
- `callback` (Function): Function to call on each interval (should be async)
- `interval` (number): Time between calls in milliseconds (default: 3000)
- `dependencies` (Array): Dependencies for useEffect (default: [])

**Best Practices:**
- Use "silent" mode for polling to avoid showing loading spinners
- Clean up automatically handled - polling stops when component unmounts
- Pass dependencies if polling should restart based on props/state changes

**Examples:**

```javascript
// Basic: Poll every 3 seconds
usePolling(() => fetchEpisodes(true), 3000, [])

// With dependency: Restart polling when ID changes
usePolling(() => fetchPodcastEpisodes(podcastId, true), 3000, [podcastId])

// Custom interval: Poll every 5 seconds
usePolling(() => checkStatus(true), 5000, [])
```

**See it in action:**
- `pages/Episodes.jsx` - My Episodes page
- `pages/PodcastEpisodes.jsx` - Podcast Episodes page

---

## Future Hooks (Ideas)

As the app grows, consider extracting these patterns:

- `useEpisodeStatus` - Subscribe to single episode status updates
- `useToast` - Centralized toast notifications
- `useAuth` - Authentication state management
- `useLocalStorage` - Persist state to localStorage



