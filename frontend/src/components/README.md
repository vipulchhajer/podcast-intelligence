# UI Components

Modern, reusable UI components for the Podcast Intelligence app.

## Button

Unified button component with consistent styling across the app.

### Variants
- `primary` - Primary action button (blue background)
- `secondary` - Secondary action button (gray background)
- `success` - Success/positive action (green background)
- `danger` - Destructive/error action (red background)
- `ghost` - Transparent with border
- `link` - Text-only link style

### Sizes
- `sm` - Small (compact)
- `md` - Medium (default)
- `lg` - Large (prominent)

### Props
```jsx
<Button
  variant="primary"     // Button style variant
  size="md"            // Button size
  loading={false}      // Show loading spinner
  disabled={false}     // Disable button
  icon={<Icon />}      // Optional icon
  className=""         // Additional classes
  {...props}           // Other button props (onClick, type, etc.)
>
  Button Text
</Button>
```

### Examples

```jsx
import { Button } from '../components/Button'

// Primary action
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

// Loading state
<Button variant="primary" loading={isSaving} disabled={isSaving}>
  {isSaving ? 'Saving...' : 'Save'}
</Button>

// With icon
<Button 
  variant="danger" 
  icon={<TrashIcon />}
  onClick={handleDelete}
>
  Delete
</Button>

// Link style (back button)
<Button 
  variant="link" 
  onClick={() => navigate(-1)}
  icon={<ArrowLeftIcon />}
>
  Go Back
</Button>
```

---

## StatusBadge

Displays episode processing status with consistent colors and icons.

### Statuses
- `new` - Gray (not yet processed)
- `pending` - Yellow with spinner (queued)
- `downloading` - Blue with spinner (downloading audio)
- `transcribing` - Indigo with spinner (transcribing)
- `summarizing` - Purple with spinner (generating summary)
- `completed` - Green with checkmark (done)
- `failed` - Red with X icon (error)

### Props
```jsx
<StatusBadge
  status="completed"   // Status string
  className=""        // Additional classes (optional)
/>
```

### Examples

```jsx
import { StatusBadge } from '../components/StatusBadge'

// Simple usage
<StatusBadge status={episode.status} />

// With custom styling
<StatusBadge status="completed" className="ml-2" />
```

### Status Colors
```javascript
const statusConfig = {
  new: 'gray',
  pending: 'yellow',
  downloading: 'blue',
  transcribing: 'indigo',
  summarizing: 'purple',
  completed: 'green',
  failed: 'red',
}
```

---

## IconButton

Compact button for icon-only actions (close buttons, refresh, etc.).

### Props
```jsx
<IconButton
  onClick={handleClick}
  className=""         // Additional classes
  {...props}          // Other button props
>
  <Icon />
</IconButton>
```

### Example
```jsx
import { IconButton } from '../components/Button'

<IconButton onClick={handleClose}>
  <XIcon className="w-5 h-5" />
</IconButton>
```

---

## Design System

### Colors
- **Primary**: Blue (`bg-primary-600`)
- **Secondary**: Gray (`bg-gray-100`)
- **Success**: Green (`bg-green-600`)
- **Danger**: Red (`bg-red-600`)

### Shadows
- **Light**: `shadow-sm` (cards, buttons)
- **Medium**: `shadow-md` (hover states)
- **None**: No shadow (flat design)

### Border Radius
- **Cards/Modals**: `rounded-xl` (larger radius)
- **Buttons**: `rounded-lg` (medium radius)
- **Badges**: `rounded-full` (pill shape)

### Transitions
All interactive elements use:
```css
transition-all duration-200
```

---

## Best Practices

### When to Use Each Button Variant

**Primary** - Main call-to-action
- "Process Episode"
- "Add Podcast"
- "Save"

**Secondary** - Alternative actions
- "Cancel"
- Filter buttons (when not selected)
- "Restart"

**Success** - Positive outcomes
- "View" (completed episode)
- "Download"

**Danger** - Destructive actions
- "Delete"
- "Retry" (failed episode)
- "Remove"

**Ghost** - Tertiary actions
- Secondary navigation
- Less important actions

**Link** - Navigation
- "Back to ..."
- "Go to ..."
- Internal links that look like buttons

### Consistency Guidelines

1. **Always use components** - Never create custom buttons
2. **Loading states** - Use `loading` prop, not custom spinners
3. **Icons** - Pass as `icon` prop, not as children
4. **Disabled states** - Handled automatically with `disabled` prop
5. **Size consistency** - Use `sm` for compact UIs, `md` for normal, `lg` for hero CTAs

---

## Migration Guide

### Old Pattern
```jsx
<button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
  Click Me
</button>
```

### New Pattern
```jsx
<Button variant="primary" size="md">
  Click Me
</Button>
```

### Benefits
- ✅ Consistent styling
- ✅ Built-in loading states
- ✅ Proper disabled states
- ✅ Accessibility improvements
- ✅ Easier to maintain
- ✅ Smaller bundle size (shared styles)



