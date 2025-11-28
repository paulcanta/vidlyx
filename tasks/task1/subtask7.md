# Task 1 - Subtask 7: Build Core Layout Components

## Objective
Create the main layout structure and navigation components for the application.

## Prerequisites
- Task 1 - Subtask 6 completed (Authentication system)
- React app running
- User can log in and out

## Instructions

### 1. Create Main Layout Component
Create `/home/pgc/vidlyx/dashboard/src/components/Layout/MainLayout.js`:

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (fixed top)                                         │
│  Logo | Search | User Menu                                  │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  SIDEBAR    │   MAIN CONTENT                                │
│  (fixed)    │   (scrollable)                                │
│             │                                               │
│  Navigation │   {children}                                  │
│  Links      │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### 2. Create Header Component
Create `/home/pgc/vidlyx/dashboard/src/components/Layout/Header.js`:

**Elements:**
- Logo (links to /app)
- Global search input (placeholder for now)
- User avatar/menu dropdown:
  - User name display
  - Settings link
  - Logout button

### 3. Create Sidebar Component
Create `/home/pgc/vidlyx/dashboard/src/components/Layout/Sidebar.js`:

**Navigation Items (using Phosphor Icons):**
- Dashboard (House icon) - /app
- New Analysis (Plus icon) - /app/new
- Collection (Folder icon) - /app/collection
- Settings (Gear icon) - /app/settings

**Admin Section (if user is admin):**
- Admin Dashboard - /admin
- User Management - /admin/users
- Analytics - /admin/analytics

### 4. Create Admin Layout Component
Create `/home/pgc/vidlyx/dashboard/src/components/Layout/AdminLayout.js`:
- Similar to MainLayout but with admin-specific sidebar
- Different color scheme to distinguish admin area

### 5. Create Dashboard Page
Create `/home/pgc/vidlyx/dashboard/src/pages/app/Dashboard.js`:

**Content:**
- Welcome message with user's first name
- Quick actions section:
  - "Analyze New Video" button
  - "View Collection" button
- Recent videos section (placeholder, will be implemented later)
- Quick stats (placeholder):
  - Videos analyzed
  - Saves created
  - Total watch time analyzed

### 6. Create Settings Page Shell
Create `/home/pgc/vidlyx/dashboard/src/pages/app/Settings.js`:
- Profile section (name, email, avatar)
- Account section (change password)
- Preferences section (theme toggle placeholder)
- Danger zone (delete account placeholder)

### 7. Create Common UI Components
Create these reusable components in `src/components/Common/`:

**Button.js:**
- Variants: primary, secondary, outline, danger
- Sizes: small, medium, large
- Loading state with spinner
- Disabled state

**Input.js:**
- Label support
- Error state and message
- Different types: text, email, password
- Icon support (prefix/suffix)

**Modal.js:**
- Overlay with click-outside to close
- Close button
- Title and content areas
- Footer with action buttons

**Toast.js (with context):**
- Success, error, warning, info variants
- Auto-dismiss after timeout
- Stack multiple toasts
- Close button

**Dropdown.js:**
- Trigger element
- Dropdown menu with items
- Click outside to close

### 8. Create Loading Components
Create `src/components/Common/Loading.js`:
- Spinner component
- Full page loading overlay
- Inline loading indicator

Create `src/components/Common/Skeleton.js`:
- Text skeleton
- Card skeleton
- Table row skeleton

### 9. Setup Layout CSS
Create `/home/pgc/vidlyx/dashboard/src/components/Layout/Layout.css`:
- Fixed header (height: 64px)
- Fixed sidebar (width: 240px)
- Main content with proper margins
- Responsive breakpoints

### 10. Update App.js Routes
Wrap authenticated routes with MainLayout:
```jsx
<Route path="/app" element={<MainLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="video/:id" element={<VideoAnalysis />} />
  <Route path="collection" element={<Collection />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

### 11. Create Toast Context
Create `/home/pgc/vidlyx/dashboard/src/contexts/ToastContext.js`:
- Manage toast notifications state
- Provide showToast function: `showToast(message, type)`
- Auto-remove toasts after 5 seconds

## Verification

### Visual Check:
- Navigate to /app after login
- Header should be fixed at top
- Sidebar should be visible on left
- Clicking sidebar links should navigate correctly
- User menu dropdown should work
- Logout should work

### Component Test:
- Import and render Button with different variants
- Show a toast notification
- Open and close a modal
- Test loading states

### Responsive Check:
- Resize window to tablet size
- Sidebar should collapse or hide
- Content should adjust

## Next Steps
Proceed to Task 1 - Subtask 8 (Setup Design System)

## Estimated Time
2-3 hours

## Notes
- Use CSS custom properties for theming (prepare for dark mode)
- Keep components simple and composable
- Use Phosphor Icons consistently
- Ensure keyboard accessibility (tab navigation, escape to close)
