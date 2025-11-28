# Task 1 - Subtask 1: Create Project Structure

## Objective
Set up the complete folder structure for the Vidlyx project.

## Prerequisites
- Access to /home/pgc/vidlyx directory
- Terminal access

## Instructions

### 1. Create Main Project Directories
Create the following directory structure:
```
vidlyx/
├── server/            # Backend API (Node.js/Express)
├── dashboard/         # React frontend
├── database/          # SQL schemas and migrations
├── python/            # Python scripts for video analysis
└── docs/              # Documentation
```

### 2. Create Server Subdirectories
Inside `server/` folder, create:
- `src/` - Main source code
  - `src/routes/` - API route handlers
  - `src/services/` - Business logic services
  - `src/middleware/` - Express middleware
  - `src/utils/` - Utility functions
  - `src/jobs/` - Background job processors
- `uploads/` - Temporary file storage (add to .gitignore)
- `frames/` - Extracted video frames (add to .gitignore)
- `logs/` - Application logs (add to .gitignore)

### 3. Create Dashboard Subdirectories
Inside `dashboard/` folder, create:
- `src/` - Main source code
  - `src/pages/` - Page components
  - `src/components/` - Reusable React components
  - `src/services/` - API service calls
  - `src/utils/` - Utility functions
  - `src/contexts/` - React contexts
  - `src/hooks/` - Custom React hooks
  - `src/styles/` - CSS files
- `public/` - Static files

### 4. Create Database Subdirectories
Inside `database/` folder, create:
- `migrations/` - Database migration files
- `seeds/` - Seed data for testing

### 5. Create Python Subdirectories
Inside `python/` folder, create:
- `scripts/` - Python analysis scripts
- `requirements.txt` will go here

### 6. Create Root-Level Files
In the root `/home/pgc/vidlyx/` directory, create:
- `.gitignore` - Git ignore file with:
  ```
  # Dependencies
  node_modules/

  # Environment
  .env
  *.env.local

  # Logs
  logs/
  *.log

  # Uploads and generated files
  server/uploads/
  server/frames/

  # Build
  dashboard/build/

  # Python
  __pycache__/
  *.pyc
  venv/

  # IDE
  .vscode/
  .idea/

  # OS
  .DS_Store
  Thumbs.db
  ```
- `README.md` - Project documentation

## Verification
After completion, verify the structure by running:
```bash
tree -L 3 /home/pgc/vidlyx
```

You should see all directories created properly.

## Next Steps
Proceed to Task 1 - Subtask 2 (Initialize Git Repository)

## Estimated Time
15 minutes
