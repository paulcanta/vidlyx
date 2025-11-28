# Task 1 - Subtask 2: Initialize Git Repository

## Objective
Initialize a Git repository and make the first commit with the project structure.

## Prerequisites
- Task 1 - Subtask 1 completed (Project structure created)
- Git installed

## Instructions

### 1. Initialize Git Repository
Navigate to the project root and initialize Git:
```bash
cd /home/pgc/vidlyx
git init
```

### 2. Verify .gitignore
Ensure `.gitignore` file exists with proper exclusions (created in previous task).

### 3. Add All Files
Stage all files for the initial commit:
```bash
git add .
```

### 4. Create Initial Commit
Make the first commit:
```bash
git commit -m "Initial project structure for Vidlyx"
```

### 5. Create Main Branch
Ensure you're on the main branch:
```bash
git branch -M main
```

### 6. (Optional) Add Remote Repository
If you have a GitHub/GitLab repository:
```bash
git remote add origin <your-repository-url>
git push -u origin main
```

## Verification
Run the following to verify:
```bash
git status
git log --oneline
```

You should see:
- Clean working directory
- Initial commit in the log

## Next Steps
Proceed to Task 1 - Subtask 3 (Setup Backend Server Project)

## Estimated Time
10 minutes

## Notes
- Make commits after each completed task
- Use descriptive commit messages
- Consider using conventional commits format: `feat:`, `fix:`, `docs:`, etc.
