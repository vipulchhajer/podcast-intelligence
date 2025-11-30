# 🎨 Design System - Podcast Intelligence App

## Color Palette

### **Primary Colors** (Main actions, navigation)
- **Blue:** `#3B82F6` (blue-600)
  - Used for: Primary buttons, links, active states
  - Tailwind: `bg-blue-600`, `text-blue-600`

### **Neutral Colors** (Text, backgrounds, borders)
- **Slate:** `#64748B` (slate-500)
  - Used for: Text, borders, inactive states
  - Tailwind: `bg-slate-50`, `text-slate-700`, `border-slate-200`

### **Status Colors** (Consistent with blue theme)

#### **New / Inactive**
- **Color:** Slate (gray)
- **Usage:** Unprocessed episodes
- **Badge:** `bg-slate-50 text-slate-700 border-slate-200`

#### **Processing States** (All blue-based)
- **Pending/Queued:** Blue
  - `bg-blue-50 text-blue-700 border-blue-200`
- **Downloading:** Blue
  - `bg-blue-50 text-blue-700 border-blue-200`
- **Transcribing:** Indigo (blue-purple)
  - `bg-indigo-50 text-indigo-700 border-indigo-200`
- **Summarizing:** Blue
  - `bg-blue-50 text-blue-700 border-blue-200`

#### **Completed**
- **Color:** Cyan (blue-green)
  - Harmonizes with blue, but distinct enough to signal success
  - `bg-cyan-50 text-cyan-700 border-cyan-200`

#### **Failed / Error**
- **Color:** Red (only for errors)
  - `bg-red-50 text-red-700 border-red-200`

---

## Color Philosophy

### **Why This Palette?**

1. **Monochromatic Harmony**
   - All colors are in the blue family (blue, indigo, cyan)
   - Creates visual cohesion
   - Professional and calming

2. **Limited Colors = Clear Hierarchy**
   - **Blue** = Action/In Progress
   - **Cyan** = Success/Complete
   - **Red** = Error (only when needed)
   - **Slate** = Neutral/Inactive

3. **Accessibility**
   - All color combinations meet WCAG AA contrast standards
   - Distinct enough for colorblind users
   - Icons supplement color for clarity

---

## Status Badge Colors

```
┌─────────────┬─────────┬──────────────────────────┐
│ Status      │ Color   │ Visual                   │
├─────────────┼─────────┼──────────────────────────┤
│ New         │ Slate   │ ⚪ Neutral, waiting      │
│ Pending     │ Blue    │ 🔵 Queued, starting soon │
│ Downloading │ Blue    │ 🔵 Active download       │
│ Transcribing│ Indigo  │ 🟣 AI processing         │
│ Summarizing │ Blue    │ 🔵 AI processing         │
│ Completed   │ Cyan    │ 🔷 Ready to view         │
│ Failed      │ Red     │ 🔴 Error occurred        │
└─────────────┴─────────┴──────────────────────────┘
```

---

## Button Colors

### **Primary (Blue)**
```jsx
variant="primary"
// Blue background, white text
```
- **Usage:** Main actions (Process, Add Podcast)
- **Color:** `bg-blue-600 hover:bg-blue-700`

### **Success (Cyan)**
```jsx
variant="success"
// Cyan/teal background, white text
```
- **Usage:** View completed episodes
- **Color:** `bg-cyan-600 hover:bg-cyan-700`

### **Danger (Red)**
```jsx
variant="danger"
// Red background, white text
```
- **Usage:** Retry failed episodes, delete actions
- **Color:** `bg-red-600 hover:bg-red-700`

### **Ghost (Transparent)**
```jsx
variant="ghost"
// Transparent background, blue text
```
- **Usage:** Secondary actions, minimal emphasis
- **Color:** `bg-transparent text-blue-600 hover:bg-blue-50`

---

## Typography

### **Font Family**
- **Primary:** System font stack (San Francisco, Segoe UI, etc.)
- **Code:** Monospace (Consolas, Monaco)

### **Font Weights**
- **Regular:** 400 (body text)
- **Medium:** 500 (labels, metadata)
- **Semibold:** 600 (subheadings)
- **Bold:** 700 (headings, CTAs)

### **Font Sizes**
```
xs:  12px - Small labels, metadata
sm:  14px - Body text, descriptions
base: 16px - Default
lg:  18px - Card titles
xl:  20px - Section headings
2xl: 24px - Page titles
```

---

## Spacing

Based on Tailwind's 4px scale:

```
1 = 4px   (tight padding)
2 = 8px   (small gaps)
3 = 12px  (default gaps)
4 = 16px  (card padding)
6 = 24px  (section spacing)
8 = 32px  (large spacing)
12 = 48px (page margins)
```

---

## Borders & Shadows

### **Borders**
- **Width:** 1px default
- **Radius:** `rounded-lg` (8px) for cards, `rounded-full` for badges
- **Color:** Always use `/60` opacity for subtle effect
  - Example: `border-slate-200/60`

### **Shadows**
- **Small:** `shadow-sm` - Subtle card elevation
- **Medium:** `shadow-md` - Hover states
- **Large:** `shadow-lg` - Modals, popovers

---

## Component Patterns

### **Episode Cards**

**Structure:**
1. Card container (white bg, border, shadow)
2. Status badge (top-right or inline)
3. Title (bold, large)
4. Metadata (date, duration - small, gray)
5. Description (truncated, medium gray)
6. Action button (status-dependent)

**No colored bars:** Status is clear from badge and button color

### **Status Badges**

**Structure:**
- Pill shape (`rounded-full`)
- Icon + Text
- Border matches background color
- Subtle backgrounds (50-level colors)

**Visual Indicators:**
- ✓ Checkmark icon = Completed (cyan)
- Spinner icon = Processing (blue/indigo)
- X icon = Failed (red)
- No icon = New (slate)

---

## Hover & Interactive States

### **Cards**
```css
hover:shadow-md
hover:border-slate-300
transition-all duration-300
```

### **Buttons**
```css
hover:bg-[color]-700  /* Darkens on hover */
active:scale-95       /* Subtle press effect */
disabled:opacity-50   /* Clear disabled state */
```

---

## Mobile Responsive

### **Breakpoints**
```
sm:  640px  (small tablets)
md:  768px  (tablets)
lg:  1024px (laptops)
xl:  1280px (desktops)
```

### **Mobile-First Approach**
- Base styles are mobile
- Use `sm:`, `md:`, `lg:` to enhance for larger screens
- Stack vertically on mobile, side-by-side on desktop

---

## Accessibility

### **Contrast Ratios**
- All text meets WCAG AA (4.5:1 minimum)
- Status colors have sufficient contrast
- Never rely on color alone (always use icons + text)

### **Focus States**
- All interactive elements have visible focus rings
- Focus ring color: `ring-blue-500`

### **Screen Readers**
- Status badges include semantic labels
- Buttons have descriptive text
- Icons have aria-labels

---

## Design Principles

1. **Consistency** - Same patterns everywhere
2. **Clarity** - Status is always obvious
3. **Simplicity** - Limited color palette
4. **Accessibility** - Works for everyone
5. **Responsiveness** - Great on all devices

---

## Quick Reference

### **When to Use Each Color:**

| Use Case | Color | Example |
|----------|-------|---------|
| Primary action | Blue | "Process" button |
| Success/complete | Cyan | "Ready" badge, "View" button |
| Error/retry | Red | "Failed" badge, "Retry" button |
| Neutral/new | Slate | "New" badge, borders |
| Processing | Blue/Indigo | Status badges with spinner |

### **Never Use:**
- ❌ Pure green (doesn't match blue theme)
- ❌ Yellow/amber (too bright, save for warnings)
- ❌ Purple/violet (replaced with indigo)
- ❌ Colored bars without clear meaning
- ❌ More than 3-4 colors on one screen

---

## Examples

### **Good Status Flow:**
```
New (Slate) → Processing (Blue) → Transcribing (Indigo) 
→ Summarizing (Blue) → Ready (Cyan)
```

### **Color Harmony:**
- All blues work together
- Cyan is close enough to blue to feel cohesive
- Red stands out clearly for errors
- Slate is neutral and professional

---

**Last Updated:** November 29, 2024  
**Status:** Active Design System

---

## Implementation Notes

All colors are implemented in:
- `StatusBadge.jsx` - Status badge colors
- `Button.jsx` - Button variant colors
- `EpisodeCard.jsx` - Card border colors (Option 3)

To maintain consistency, always reference these components rather than creating custom colors.



