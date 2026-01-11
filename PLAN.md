# Flawless Admin Presentation System

## Summary
Implement full real-time control for admin (rep) presentations, enabling:
- Admin control over all form inputs (customer sees changes live)
- Scroll synchronization (admin scroll updates customer view)
- Accurate element-relative cursor positioning (works across screen sizes)
- Smooth, jank-free experience via performance optimizations
- Easy access to customer magic link URL

---

## Implementation Steps

### Step 1: Extend Liveblocks Types ✅
**File:** `src/liveblocks.config.ts`

- Update `Presence` type:
  - Change cursor from `{x, y}` to `{containerX, containerY, scrollY}` (percentage-based)
  - Add `scrollY: number` for scroll sync
  - Add `isControlling: boolean` for visual feedback

- Add new `RoomEvent` types:
  - `INPUT_CHANGE: { controlId, value }` - broadcast input changes
  - `SCROLL_SYNC: { scrollY }` - (optional, can use presence instead)

---

### Step 2: Rewrite Cursor Tracking for Element-Relative Positioning ✅
**File:** `src/hooks/useCursorTracking.ts`

- Accept `containerRef` parameter to track relative to content container
- Calculate cursor position as **percentage** of container dimensions
- Include scroll offset in cursor data
- **Throttle updates** at 60fps using `requestAnimationFrame`
- Clean up animation frames on unmount

---

### Step 3: Optimize Cursor Rendering ✅
**File:** `src/components/Cursors.tsx`

- Wrap component with `React.memo` to prevent unnecessary re-renders
- Use `useMemo` to filter for rep cursor only
- Accept `containerRef` prop to calculate absolute position from percentages
- Add CSS `will-change: transform` and short `transition` (50ms) for smooth interpolation
- Change cursor color when `isControlling` is true (visual feedback)

---

### Step 4: Add Input Broadcasting to Rep Controls ✅
**File:** `src/hooks/useRepControls.ts`

- Add `broadcastInputChange(controlId, value)` function
  - Sets `isControlling: true` in presence
  - Broadcasts `INPUT_CHANGE` event
  - Clears `isControlling` after 500ms

- Add `syncScroll(scrollY)` function
  - Updates presence with current scroll position

---

### Step 5: Handle Rep Events on Customer Side
**File:** `src/hooks/useCollaborativeState.ts`

- Accept `containerRef` and `onInputChange` callback
- Listen for `INPUT_CHANGE` events and call `onInputChange`
- Track `repIsControlling` state for visual feedback
- Implement scroll sync:
  - Watch rep's `scrollY` in presence
  - Programmatically scroll customer container with `behavior: 'smooth'`
  - Use threshold (10px) to avoid jitter

---

### Step 6: Enable Rep's TermsPanel Controls
**File:** `src/components/RepSessionView.tsx`

- Add `containerRef` for the content area
- Pass ref to `useCursorTracking`
- **Enable TermsPanel** (`disabled={false}`)
- Wire `onChange` to:
  1. Update local state
  2. Call `broadcastInputChange` for changed control

- Add scroll tracking:
  - Listen to scroll events on container
  - Throttle with `requestAnimationFrame`
  - Call `syncScroll`

- Add magic link URL section:
  - Retrieve stored token from localStorage (stored during session creation)
  - Display URL with copy button
  - Fallback to `/terms/${sessionId}` if token unavailable

---

### Step 7: Update Customer View for Rep Control
**File:** `src/components/CollaborativeTermsPage.tsx`

- Add `containerRef` for main content
- Create `handleRepInputChange` callback to update `terms` state
- Pass callback to `useCollaborativeState`
- Pass `containerRef` to `<Cursors />`
- Wrap main content in ref'd div with `overflow-auto`
- Add visual banner when `repIsControlling` is true

---

### Step 8: Store Magic Link Token
**File:** `src/routes/rep/index.tsx`

- When session is created, store token in localStorage:
  ```js
  localStorage.setItem('sessionTokens', JSON.stringify({...existing, [sessionId]: token}))
  ```
- This allows RepSessionView to reconstruct the magic link URL

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/liveblocks.config.ts` | Extend Presence, add INPUT_CHANGE event |
| `src/hooks/useCursorTracking.ts` | Container-relative positioning, throttling |
| `src/hooks/useRepControls.ts` | Add broadcastInputChange, syncScroll |
| `src/hooks/useCollaborativeState.ts` | Handle INPUT_CHANGE, scroll sync |
| `src/components/Cursors.tsx` | Memoize, container-relative rendering |
| `src/components/RepSessionView.tsx` | Enable controls, scroll tracking, magic link UI |
| `src/components/CollaborativeTermsPage.tsx` | Handle rep input changes, container ref |
| `src/routes/rep/index.tsx` | Store token in localStorage |

---

## Performance Optimizations

1. **Cursor throttling**: 60fps via `requestAnimationFrame`
2. **React.memo**: On Cursors component
3. **CSS GPU acceleration**: `will-change: transform`, `transition: 50ms`
4. **Scroll sync threshold**: Only sync when delta > 10px
5. **Passive scroll listeners**: `{ passive: true }`

---

## Testing Checklist

- [ ] Rep cursor points to correct elements on customer screen (different screen sizes)
- [ ] Rep changes term slider → customer sees real-time update
- [ ] Rep changes down payment → customer sees real-time update
- [ ] Rep toggles balloon → customer sees real-time update
- [ ] Rep scrolls → customer view scrolls smoothly
- [ ] Customer sees "rep is controlling" visual feedback
- [ ] Cursor changes color when rep is actively controlling
- [ ] Magic link URL accessible and copyable from rep view
- [ ] No jank on customer device during presentation
