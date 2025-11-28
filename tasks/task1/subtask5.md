# Task 1 - Subtask 5: Setup React Frontend Project

## Objective
Initialize the React frontend application with routing and basic configuration.

## Prerequisites
- Task 1 - Subtask 4 completed (Database setup)
- Node.js v22+ installed
- npm available

## Instructions

### 1. Create React App
Navigate to the dashboard directory and create the React app:
```bash
cd /home/pgc/vidlyx
npx create-react-app dashboard
```

Or if dashboard folder already exists:
```bash
cd /home/pgc/vidlyx/dashboard
npx create-react-app .
```

### 2. Install Additional Dependencies
```bash
cd /home/pgc/vidlyx/dashboard
npm install react-router-dom@^7.9.3 axios@^1.12.2 @phosphor-icons/react@^2.1.7 socket.io-client@^4.7.5
```

### 3. Create .env File
Create `/home/pgc/vidlyx/dashboard/.env`:
```env
REACT_APP_API_URL=http://localhost:4051/api
REACT_APP_WS_URL=ws://localhost:4051
REACT_APP_NAME=Vidlyx
PORT=4050
```

### 4. Setup Directory Structure
Ensure these directories exist in `dashboard/src/`:
- `pages/` - Page components
  - `pages/auth/` - Login, Register pages
  - `pages/app/` - Main app pages
  - `pages/admin/` - Admin pages
  - `pages/public/` - Landing page
- `components/` - Reusable components
  - `components/Layout/` - Header, Sidebar, etc.
  - `components/Video/` - Video player components
  - `components/Transcript/` - Transcript components
  - `components/Frames/` - Frame gallery components
  - `components/Save/` - Save-related components
  - `components/Collection/` - Collection components
  - `components/Common/` - Buttons, Inputs, Modals
- `contexts/` - React contexts
- `services/` - API services
- `hooks/` - Custom hooks
- `styles/` - CSS files
- `utils/` - Utility functions

### 5. Setup React Router
Update `src/App.js` with React Router:

Routes to configure:
- `/` - Landing page (public)
- `/login` - Login page
- `/register` - Register page
- `/app` - Dashboard (protected)
- `/app/video/:id` - Video analysis page
- `/app/collection` - Collection view
- `/app/collection/folder/:id` - Folder contents
- `/app/collection/save/:id` - Save detail view
- `/app/settings` - User settings
- `/admin/*` - Admin routes (admin only)

### 6. Create Auth Context
Create `src/contexts/AuthContext.js`:
- Manage user authentication state
- Provide login, logout, register functions
- Check session on app load
- Export useAuth hook

### 7. Create API Service
Create `src/services/api.js`:
- Create axios instance with base URL
- Configure credentials (withCredentials: true)
- Add response interceptor for auth errors
- Export configured instance

### 8. Create Basic Layout Components
Create shell components (will be styled later):
- `components/Layout/MainLayout.js` - App layout wrapper
- `components/Layout/Header.js` - Top navigation
- `components/Layout/Sidebar.js` - Side navigation

### 9. Create Protected Route Component
Create `src/components/guards/AuthGuard.js`:
- Check if user is authenticated
- Redirect to login if not
- Show loading state while checking

### 10. Update package.json Scripts
Ensure scripts are correct:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## Verification
Start the development server:
```bash
cd /home/pgc/vidlyx/dashboard
npm start
```

The app should:
- Start on http://localhost:4050
- Show the landing page at root
- Navigate to /login shows login page
- Protected routes redirect to login

Test API connection (after backend is running):
- Open browser console
- Check network tab for API calls

## Next Steps
Proceed to Task 1 - Subtask 6 (Implement Authentication System)

## Estimated Time
30 minutes

## Notes
- Port 4050 is configured for frontend
- CORS must be configured on backend to allow port 4050
- Use Phosphor Icons for consistent iconography
- Socket.io client will be used for real-time updates
