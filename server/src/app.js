// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const pool = require('./services/db');
const ocrService = require('./services/ocrService');
const { closeQueues } = require('./jobs/queue');

const app = express();
const PORT = process.env.PORT || 4051;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:4050',
  credentials: true
}));

// Compression middleware - compress all responses
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9, default is 6)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'vidlyx-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  }
}));

// Static file serving with caching headers
// Note: Frames are served through API routes with authentication,
// but we can add general static file serving with caching here if needed
const setStaticCacheHeaders = (res, filePath) => {
  // Cache static assets for 1 year (images, videos)
  if (filePath.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache CSS/JS for 1 day
  else if (filePath.match(/\.(css|js)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  // Don't cache HTML
  else if (filePath.match(/\.html$/i)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
};

// Serve frames directory with caching (if accessed directly)
// Note: In production, frames should be served via API routes with auth
const framesPath = path.join(__dirname, '..', 'frames');
app.use('/frames', express.static(framesPath, {
  setHeaders: setStaticCacheHeaders,
  maxAge: '1y', // Default max age
  immutable: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const frameRoutes = require('./routes/frameRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const folderRoutes = require('./routes/folderRoutes');
const tagRoutes = require('./routes/tagRoutes');
const saveRoutes = require('./routes/saveRoutes');
const exportRoutes = require('./routes/exportRoutes');
const searchRoutes = require('./routes/searchRoutes');
const regenerationRoutes = require('./routes/regenerationRoutes');
const homeRoutes = require('./routes/homeRoutes');
const { usageRouter, publicRouter: publicFrameRouter } = require('./routes/frameRoutes');

app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/videos', frameRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/saves', saveRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', regenerationRoutes);
// Public frame image serving MUST come before protected frameRoutes
app.use('/api/frames', publicFrameRouter);
app.use('/api', frameRoutes); // For /api/frames/* routes (protected)
app.use('/api', usageRouter); // For /api/usage route

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Vidlyx server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Initialize OCR workers
  try {
    await ocrService.initWorkers();
    console.log('OCR service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OCR service:', error.message);
  }

  // Initialize frame extraction worker
  try {
    require('./jobs/frameExtractionWorker');
    console.log('Frame extraction worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize frame extraction worker:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await ocrService.terminateWorkers();
    await closeQueues();
  } catch (error) {
    console.error('Error during graceful shutdown:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  try {
    await ocrService.terminateWorkers();
    await closeQueues();
  } catch (error) {
    console.error('Error during graceful shutdown:', error.message);
  }
  process.exit(0);
});

module.exports = app;
