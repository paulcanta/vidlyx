# Task 1 - Subtask 6: Implement Authentication System

## Objective
Build complete user authentication with registration, login, logout, and session management.

## Prerequisites
- Task 1 - Subtask 5 completed (React frontend setup)
- Database schema created with users and sessions tables
- Backend server running

## Instructions

### 1. Backend: Create Auth Routes
Create `/home/pgc/vidlyx/server/src/routes/authRoutes.js`:

**Endpoints to implement:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user session

### 2. Backend: Create Auth Service
Create `/home/pgc/vidlyx/server/src/services/authService.js`:

**Functions to implement:**
- `createUser(email, password, firstName, lastName)` - Hash password with bcrypt, insert user
- `findUserByEmail(email)` - Query user by email
- `findUserById(id)` - Query user by ID
- `validatePassword(plainPassword, hashedPassword)` - Compare with bcrypt
- `updateLastLogin(userId)` - Update last_login_at timestamp

### 3. Backend: Setup Session Middleware
In `app.js`, configure express-session with PostgreSQL store:

```javascript
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

app.use(session({
  store: new pgSession({
    pool: require('./services/db'),
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  }
}));
```

### 4. Backend: Create Auth Middleware
Create `/home/pgc/vidlyx/server/src/middleware/auth.js`:

**Middleware functions:**
- `requireAuth` - Check if user is logged in (req.session.userId exists)
- `requireAdmin` - Check if user has admin role
- `optionalAuth` - Attach user to request if logged in, but don't require it

### 5. Backend: Register Endpoint Logic
`POST /api/auth/register`:
- Validate email format and password strength
- Check if email already exists
- Hash password with bcrypt (rounds: 10)
- Create user with status: 'active' (skip email verification for MVP)
- Create session
- Return user object (without password)

### 6. Backend: Login Endpoint Logic
`POST /api/auth/login`:
- Find user by email
- Validate password with bcrypt.compare
- Check user status is 'active'
- Update last_login_at
- Create session (req.session.userId = user.id)
- Return user object

### 7. Backend: Logout Endpoint Logic
`POST /api/auth/logout`:
- Destroy session (req.session.destroy())
- Clear cookie
- Return success

### 8. Backend: Get Current User Logic
`GET /api/auth/me`:
- Check if session exists
- Fetch user by session.userId
- Return user object or null

### 9. Frontend: Create Auth Service
Create `/home/pgc/vidlyx/dashboard/src/services/authService.js`:

```javascript
import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};
```

### 10. Frontend: Implement Auth Context
Update `src/contexts/AuthContext.js`:

**State:**
- user (null or user object)
- loading (boolean)
- error (string or null)

**Functions:**
- login(email, password) - Call API, set user state
- register(email, password, firstName, lastName) - Call API, set user state
- logout() - Call API, clear user state
- checkAuth() - Call /me endpoint on mount

### 11. Frontend: Create Login Page
Create `/home/pgc/vidlyx/dashboard/src/pages/auth/Login.js`:
- Email input
- Password input
- Submit button
- Link to register page
- Error display
- Redirect to /app on success

### 12. Frontend: Create Register Page
Create `/home/pgc/vidlyx/dashboard/src/pages/auth/Register.js`:
- First name, Last name inputs
- Email input
- Password input (with strength indicator)
- Confirm password input
- Submit button
- Link to login page
- Redirect to /app on success

### 13. Apply Auth Middleware to Routes
In `app.js`, protect routes:
```javascript
app.use('/api/videos', requireAuth, videoRoutes);
app.use('/api/saves', requireAuth, saveRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);
```

## Verification

### Test Registration:
```bash
curl -X POST http://localhost:4051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

### Test Login:
```bash
curl -X POST http://localhost:4051/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Get Me:
```bash
curl http://localhost:4051/api/auth/me -b cookies.txt
```

### Frontend Test:
- Navigate to /register, create account
- Should redirect to /app
- Refresh page, should stay logged in
- Click logout, should redirect to /login

## Next Steps
Proceed to Task 1 - Subtask 7 (Build Core Layout Components)

## Estimated Time
2-3 hours

## Notes
- Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Sessions stored in PostgreSQL for persistence
- Cookie is httpOnly for security
- CORS must be configured with credentials: true
