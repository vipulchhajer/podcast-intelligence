# Quick Reference Card

Keep this open while coding! 📌

## 🎯 Most Common Patterns

### Adding Status Polling to a Page
```javascript
import { usePolling } from '../hooks/usePolling'

// In your component:
usePolling(() => fetchData(true), 3000, [dependencies])
```

### Displaying HTML Content (RSS Feeds)
```javascript
import { sanitizeHtml } from '../utils/sanitizeHtml'

<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
```

### Responsive Images
```jsx
<img 
  src={url} 
  alt={title}
  loading="lazy"
  className="w-full aspect-square object-cover"
  onError={(e) => { e.target.style.display = 'none' }}
/>
```

### Status Badge Colors
```javascript
const badges = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'downloading': 'bg-blue-100 text-blue-800',
  'transcribing': 'bg-indigo-100 text-indigo-800',
  'summarizing': 'bg-purple-100 text-purple-800',
  'completed': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
}
```

---

## 📱 Tailwind Breakpoints

| Code | Min Width | Device |
|------|-----------|--------|
| `sm:` | 640px | Tablet |
| `md:` | 768px | Tablet Landscape |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |

**Example:** `className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"`

---

## ✅ Before Committing

- [ ] Does it work on mobile? (Chrome DevTools toggle)
- [ ] Are statuses updating in real-time?
- [ ] Are error messages displayed properly?
- [ ] Do images have fallbacks?
- [ ] Is HTML content sanitized?

---

## 🤖 Cursor AI Prompts

**Ask Cursor to verify:**
```
"Does this follow DEVELOPMENT.md patterns?"
"Check this against our polling checklist"
```

**Request with patterns:**
```
"Add X feature following our status polling pattern"
"Create Y page, use the mobile image checklist"
```

---

## 🔥 Emergency Commands

**Backend not starting?**
```bash
cd backend
rm podcast_app.db
python main.py
```

**Frontend not updating?**
```bash
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
```

**Find what's using port 8000:**
```bash
lsof -ti:8000 | xargs kill -9
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.cursorrules` | Cursor AI instructions |
| `DEVELOPMENT.md` | Full dev guide + checklists |
| `frontend/src/hooks/usePolling.js` | Polling hook |
| `frontend/src/utils/sanitizeHtml.js` | HTML sanitizer |
| `backend/main.py` | API routes |
| `backend/models.py` | Database schema |

---

## 🎨 Common UI Patterns

**Loading State:**
```jsx
{loading ? <LoadingSpinner size="lg" /> : <Content />}
```

**Empty State:**
```jsx
{items.length === 0 && <EmptyMessage />}
```

**Error State:**
```jsx
{error && <ErrorAlert message={error} />}
```

---

**Full details:** See `DEVELOPMENT.md`

