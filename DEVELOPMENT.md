# Development Guide

This guide helps you maintain consistency and avoid common pitfalls when adding features to the Podcast Intelligence app.

## 🔄 Real-Time Status Updates: Checklist

When creating **any new page that displays episode statuses** (pending, downloading, transcribing, completed, etc.), follow this checklist:

### ✅ Frontend Checklist

- [ ] **Import the polling hook**
  ```javascript
  import { usePolling } from '../hooks/usePolling'
  ```

- [ ] **Create a fetch function with silent mode**
  ```javascript
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await apiCall()
      setData(data)
    } catch (error) {
      if (!silent) showError(error)
    } finally {
      if (!silent) setLoading(false)
    }
  }
  ```

- [ ] **Add polling with the hook**
  ```javascript
  // Auto-refresh every 3 seconds
  usePolling(() => fetchData(true), 3000, [/* dependencies */])
  ```

- [ ] **Display status badges consistently**
  ```javascript
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
  ```

- [ ] **Show loading spinners for in-progress statuses**
  ```javascript
  if (['downloading', 'transcribing', 'summarizing', 'pending'].includes(status)) {
    return <LoadingSpinner size="sm" />
  }
  ```

- [ ] **Include error messages for failed episodes**
  ```javascript
  {episode.status === 'failed' && episode.error_message && (
    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <p className="text-red-800 text-xs font-medium">Error:</p>
      <p className="text-red-600 text-xs mt-1">{episode.error_message}</p>
    </div>
  )}
  ```

### ✅ Backend Checklist

When creating new API endpoints that return episode data:

- [ ] **Always include these fields in episode responses:**
  - `status` (string: pending/downloading/transcribing/summarizing/completed/failed)
  - `error_message` (string or null)
  - `id` (for navigation)
  - `guid` (for uniqueness)

- [ ] **Use consistent status updates in background tasks:**
  ```python
  episode.status = "downloading"
  await db.commit()
  # ... do work ...
  episode.status = "transcribing"
  await db.commit()
  # ... do work ...
  episode.status = "completed"
  await db.commit()
  ```

- [ ] **Handle errors properly:**
  ```python
  except Exception as e:
      episode.status = "failed"
      episode.error_message = str(e)
      await db.commit()
  ```

---

## 📄 Pagination: Checklist

When displaying large lists of episodes or other items:

### ✅ For Database-Backed Lists (My Episodes)

- [ ] **Use the Pagination component**
  ```javascript
  import { Pagination } from '../components/Pagination'
  ```

- [ ] **Track pagination state**
  ```javascript
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [limit] = useState(20) // Items per page
  ```

- [ ] **Calculate offset for API calls**
  ```javascript
  const offset = (currentPage - 1) * limit
  const data = await listEpisodes(limit, offset, statusFilter)
  ```

- [ ] **Add page change handler**
  ```javascript
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const totalPages = Math.ceil(totalItems / limit)
  ```

- [ ] **Render pagination controls**
  ```jsx
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={handlePageChange}
    total={totalItems}
    showing={items.length}
  />
  ```

- [ ] **Reset to page 1 when filters change**
  ```javascript
  useEffect(() => {
    setCurrentPage(1)
    fetchData()
  }, [statusFilter])
  ```

### ✅ For RSS Feed Lists (Podcast Episodes)

- [ ] **Use "Load More" pattern instead of pagination**
  ```javascript
  const [limit, setLimit] = useState(20)
  const [totalInFeed, setTotalInFeed] = useState(0)
  const [loading, setLoading] = useState(false)
  ```

- [ ] **Implement load more handler**
  ```javascript
  const handleLoadMore = () => {
    setLoading(true)
    setLimit(prev => prev + 20)
  }
  ```

- [ ] **Show load more button conditionally**
  ```jsx
  {items.length < totalInFeed && (
    <Button onClick={handleLoadMore} loading={loading}>
      Load More Episodes ({totalInFeed - items.length} remaining)
    </Button>
  )}
  ```

- [ ] **Display item counts**
  ```jsx
  <p>Showing {items.length} of {totalInFeed} episodes from RSS feed</p>
  ```

### ✅ Backend Pagination Support

- [ ] **Accept limit and offset parameters**
  ```python
  @app.get("/api/episodes")
  async def list_episodes(
      limit: int = 20,
      offset: int = 0,
      status: str | None = None,
      db: AsyncSession = Depends(get_db)
  ):
  ```

- [ ] **Return pagination metadata**
  ```python
  return {
      "episodes": episode_list,
      "total": total,
      "limit": limit,
      "offset": offset,
      "has_more": offset + len(episodes) < total
  }
  ```

- [ ] **Use SQL LIMIT and OFFSET for efficiency**
  ```python
  query = select(Episode).order_by(Episode.created_at.desc()).limit(limit).offset(offset)
  ```

---

## 📱 Mobile-Responsive Images: Checklist

When adding images anywhere in the app:

- [ ] **Use responsive aspect ratios**
  ```jsx
  <div className="w-full aspect-square bg-gray-100">
    <img src={url} className="w-full h-full object-cover" />
  </div>
  ```

- [ ] **Add lazy loading**
  ```jsx
  <img src={url} loading="lazy" />
  ```

- [ ] **Include error handling**
  ```jsx
  <img 
    src={url} 
    onError={(e) => { e.target.style.display = 'none' }}
  />
  ```

- [ ] **Use Tailwind breakpoints for different screen sizes**
  ```jsx
  className="w-full sm:w-48 md:w-64 lg:w-80"
  ```

---

## 🎨 HTML Content Rendering: Checklist

When displaying user content from RSS feeds (descriptions, etc.):

- [ ] **Import sanitizer**
  ```javascript
  import { sanitizeHtml } from '../utils/sanitizeHtml'
  ```

- [ ] **Use dangerouslySetInnerHTML with sanitization**
  ```jsx
  <div 
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    className="prose prose-sm max-w-none"
  />
  ```

- [ ] **NEVER render raw HTML without sanitization** (prevents XSS attacks)

---

## 🧪 Manual Testing Checklist

Before pushing changes or sharing with users, test these scenarios:

### Episode Processing Flow
- [ ] Add a new podcast via RSS URL
- [ ] Click on the podcast to view episodes
- [ ] Process an episode - verify status updates in real-time
- [ ] Check "My Episodes" page shows the same status
- [ ] Wait for completion - verify transcript and summary appear
- [ ] Test retry button on a failed episode
- [ ] Test on mobile screen size (Chrome DevTools)

### Common Edge Cases
- [ ] Long episode titles (do they truncate properly?)
- [ ] Episodes without images (graceful fallback?)
- [ ] Failed episodes (error message displays?)
- [ ] Slow network (loading states show?)
- [ ] Multiple episodes processing simultaneously

---

## 📐 Tailwind Responsive Breakpoints

Reference for consistent responsive design:

| Breakpoint | Min Width | Use Case |
|------------|-----------|----------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

**Example:**
```jsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
```
- Mobile: 1 column
- Small tablet: 2 columns
- Laptop: 3 columns
- Desktop: 4 columns

---

## 🔧 Common Patterns

### Loading States
```jsx
{loading ? (
  <div className="flex flex-col items-center gap-4">
    <LoadingSpinner size="lg" />
    <div className="text-gray-500">Loading...</div>
  </div>
) : (
  // ... content
)}
```

### Empty States
```jsx
{items.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-gray-500 mb-4">No items yet</p>
    <button onClick={action}>Add Your First Item</button>
  </div>
) : (
  // ... list items
)}
```

### Error States
```jsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded">
    <p className="text-red-800 font-medium">Error</p>
    <p className="text-red-600 text-sm mt-1">{error}</p>
  </div>
)}
```

---

## 🚀 Future: When to Add Tests

Consider adding automated tests when you reach any of these milestones:

- ✅ **10+ active users** - More edge cases emerge
- ✅ **Adding team members** - Prevent breaking each other's code
- ✅ **Monetizing** - Money = need for reliability
- ✅ **Frequent bugs** - Tests catch regressions

### Priority Testing Order (when ready)

1. **Integration tests** - Full episode processing flow
2. **API contract tests** - Ensure frontend/backend stay in sync
3. **Component tests** - Individual UI component behavior
4. **E2E tests** - User journey testing

---

## 💡 Pro Tips

1. **DRY Principle**: If you copy-paste code 3+ times, extract it to a utility/hook
2. **Mobile First**: Design for mobile, then scale up (easier than scaling down)
3. **Silent Errors**: Always handle API errors gracefully (don't break the UI)
4. **Consistent Naming**: `fetchX`, `handleX`, `getX` - pick a pattern and stick to it
5. **Comments**: Add WHY comments, not WHAT comments

---

## 📚 Key Files Reference

### Frontend Structure
```
frontend/src/
├── hooks/
│   └── usePolling.js         # Reusable polling hook
├── utils/
│   └── sanitizeHtml.js       # HTML sanitization
├── api/
│   └── client.js             # API calls
└── pages/
    ├── Podcasts.jsx          # Podcast grid
    ├── PodcastEpisodes.jsx   # Single podcast's episodes (with polling)
    ├── Episodes.jsx          # My Episodes list (with polling)
    └── EpisodeDetail.jsx     # Episode details + summary
```

### Backend Structure
```
backend/
├── main.py                   # API routes
├── models.py                 # Database models
├── services/
│   └── groq_service.py       # Groq API integration
└── podcast_intelligence/
    ├── rss_parser.py         # RSS feed parsing
    ├── downloader.py         # Audio downloading
    ├── transcriber.py        # Transcription logic
    └── summarizer.py         # Summarization logic
```

---

## 🤝 Getting Help

If you're stuck:
1. Check this guide first
2. Look at existing similar pages (e.g., Episodes.jsx, PodcastEpisodes.jsx)
3. Review error messages in browser console
4. Check backend logs (`python main.py` output)

---

## 🤖 Working with Cursor AI

This project includes a `.cursorrules` file that helps Cursor AI understand the codebase patterns.

### Making Cursor Read This Guide

Cursor automatically reads `.cursorrules`, which references this DEVELOPMENT.md file.

**To ensure Cursor follows patterns:**

1. **Mention the guide in your prompts:**
   ```
   "Add a new page for X, following DEVELOPMENT.md checklist"
   "Check if this follows the patterns in DEVELOPMENT.md"
   ```

2. **Reference specific sections:**
   ```
   "Use the polling pattern from DEVELOPMENT.md"
   "Follow the mobile image checklist"
   ```

3. **Ask for verification:**
   ```
   "Does this code follow our DEVELOPMENT.md guidelines?"
   ```

### Quick Cursor Prompts

**When adding features:**
- "Add episode filtering, following our status polling pattern"
- "Create a search page - make sure to check DEVELOPMENT.md checklist"

**When fixing bugs:**
- "This status isn't updating - verify polling hook usage per DEVELOPMENT.md"

**When unsure:**
- "What's the correct pattern for X according to DEVELOPMENT.md?"

---

**Last Updated:** November 29, 2024
**Version:** 1.0.0 MVP

