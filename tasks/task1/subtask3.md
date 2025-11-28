# Task 1 - Subtask 3: Setup Backend Server Project

## Objective
Initialize the Node.js backend server with all necessary dependencies.

## Prerequisites
- Task 1 - Subtask 2 completed (Git initialized)
- Node.js v22+ installed
- npm available

## Instructions

### 1. Create package.json
Navigate to the server directory and create `package.json`:
```bash
cd /home/pgc/vidlyx/server
```

Create a package.json file with:
- Name: "vidlyx-server"
- Version: "1.0.0"
- Main: "src/app.js"
- Scripts:
  - start: "node src/app.js"
  - dev: "nodemon src/app.js"

### 2. Define Dependencies
Add the following dependencies:
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.16.3",
    "cors": "^2.8.5",
    "helmet": "^8.1.0",
    "dotenv": "^17.2.2",
    "uuid": "^13.0.0",
    "bcrypt": "^6.0.0",
    "express-session": "^1.18.2",
    "connect-pg-simple": "^10.0.0",
    "express-rate-limit": "^8.2.1",
    "socket.io": "^4.7.5",
    "sharp": "^0.33.5",
    "python-shell": "^5.0.0",
    "fluent-ffmpeg": "^2.1.2",
    "@google/generative-ai": "^0.21.0",
    "bull": "^4.16.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

### 3. Install Dependencies
Run:
```bash
npm install
```

### 4. Create .env.example File
Create `.env.example` in `/home/pgc/vidlyx/server/` with:

```env
# Server Configuration
NODE_ENV=development
PORT=4051

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vidlyx_dev
DB_USER=postgres
DB_PASSWORD=your_password_here

# Session Configuration
SESSION_SECRET=your-session-secret-here-min-32-chars

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4050

# Frontend URL
FRONTEND_URL=http://localhost:4050

# Google Gemini API (FREE tier)
GEMINI_API_KEY=your-gemini-api-key

# Frame Extraction
FRAMES_DIR=./frames
UPLOADS_DIR=./uploads

# Redis (for Bull queues - optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Create .env File
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in actual values (DO NOT commit .env to git).

### 6. Create Basic Server File
Create `/home/pgc/vidlyx/server/src/app.js` with:
- Import required modules (express, cors, helmet, dotenv)
- Load environment variables
- Setup middleware (cors, helmet, json parsing)
- Create basic health check endpoint: `GET /health`
- Create API router mount point: `/api`
- Setup error handling middleware
- Start server on PORT 4051

### 7. Create Database Connection File
Create `/home/pgc/vidlyx/server/src/services/db.js`:
- Import pg Pool
- Create pool with environment variables
- Export pool for use in other files

## Verification
Test the server setup:
```bash
npm run dev
```

Server should start without errors. Test health endpoint:
```bash
curl http://localhost:4051/health
```

Expected response:
```json
{"status": "ok", "timestamp": "..."}
```

## Next Steps
Proceed to Task 1 - Subtask 4 (Setup Database Schema)

## Estimated Time
30 minutes

## Notes
- Port 4051 is used for the backend (frontend will use 4050)
- Gemini API key can be obtained free from Google AI Studio
- Bull queues are optional but recommended for background jobs
