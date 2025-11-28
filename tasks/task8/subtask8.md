# Task 8 - Subtask 8: Performance Optimization

## Objective
Optimize application performance for fast loading and smooth interactions.

## Prerequisites
- Task 8 - Subtask 7 completed (Animations)

## Instructions

### 1. Implement Code Splitting
Update `/home/pgc/vidlyx/dashboard/src/App.js`:

```jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Spinner from './components/Loading/Spinner';
import AppLayout from './components/Layout/AppLayout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const VideoAnalysis = lazy(() => import('./pages/app/VideoAnalysis'));
const NewVideo = lazy(() => import('./pages/app/NewVideo'));
const Collection = lazy(() => import('./pages/app/Collection'));
const SaveView = lazy(() => import('./pages/app/SaveView'));
const Settings = lazy(() => import('./pages/app/Settings'));

// Page loader component
function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="large" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewVideo />} />
          <Route path="video/:videoId" element={<VideoAnalysis />} />
          <Route path="collection" element={<Collection />} />
          <Route path="collection/save/:saveId" element={<SaveView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
```

### 2. Implement Virtual List for Large Data
Create `/home/pgc/vidlyx/dashboard/src/components/VirtualList/VirtualList.js`:

```jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import './VirtualList.css';

function VirtualList({
  items,
  itemHeight,
  windowHeight,
  renderItem,
  overscan = 3
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="virtual-list"
      style={{ height: windowHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
```

### 3. Implement Image Lazy Loading
Create `/home/pgc/vidlyx/dashboard/src/components/LazyImage/LazyImage.js`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import './LazyImage.css';

function LazyImage({ src, alt, className = '', placeholder, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`lazy-image-wrapper ${className}`}>
      {!isLoaded && (
        <div className="lazy-image-placeholder">
          {placeholder || <div className="lazy-image-skeleton" />}
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
}

export default LazyImage;
```

### 4. Implement Request Caching
Create `/home/pgc/vidlyx/dashboard/src/utils/cache.js`:

```javascript
class RequestCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  generateKey(url, params) {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  get(url, params) {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(url, params, data) {
    const key = this.generateKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(urlPattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const requestCache = new RequestCache();
```

### 5. Implement Debounce and Throttle Utilities
Create `/home/pgc/vidlyx/dashboard/src/utils/debounce.js`:

```javascript
export function debounce(func, wait) {
  let timeout;

  const debounced = function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

export function throttle(func, limit) {
  let inThrottle;

  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### 6. Optimize React Rendering
Create `/home/pgc/vidlyx/dashboard/src/hooks/useOptimizedList.js`:

```javascript
import { useMemo, useCallback } from 'react';

export function useOptimizedList(items, sortBy, filterFn) {
  const filteredItems = useMemo(() => {
    if (!filterFn) return items;
    return items.filter(filterFn);
  }, [items, filterFn]);

  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      if (typeof sortBy === 'function') {
        return sortBy(a, b);
      }
      return a[sortBy] > b[sortBy] ? 1 : -1;
    });
  }, [filteredItems, sortBy]);

  return sortedItems;
}

// Memoized item renderer wrapper
export function useMemoizedRenderItem(renderItem, deps = []) {
  return useCallback(renderItem, deps);
}
```

### 7. Backend Query Optimization
Update `/home/pgc/vidlyx/backend/services/videoService.js`:

```javascript
// Add pagination and field selection
async function getVideos(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    fields = ['id', 'title', 'thumbnail_url', 'created_at', 'status'],
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;

  // Only select needed fields
  const selectedFields = fields.map(f => `v.${f}`).join(', ');

  const query = `
    SELECT ${selectedFields}
    FROM videos v
    WHERE v.user_id = $1
    ORDER BY v.${sortBy} ${sortOrder}
    LIMIT $2 OFFSET $3
  `;

  const result = await db.query(query, [userId, limit, offset]);
  return result.rows;
}

// Add database indexes for common queries
// Run as migration:
// CREATE INDEX CONCURRENTLY idx_videos_user_created ON videos(user_id, created_at DESC);
// CREATE INDEX CONCURRENTLY idx_saves_user_created ON saves(user_id, created_at DESC);
// CREATE INDEX CONCURRENTLY idx_frames_video_timestamp ON frames(video_id, timestamp_seconds);
```

### 8. Image Optimization
Create `/home/pgc/vidlyx/backend/utils/imageOptimizer.js`:

```javascript
const sharp = require('sharp');
const path = require('path');

async function optimizeImage(inputPath, options = {}) {
  const {
    width = 800,
    quality = 80,
    format = 'webp'
  } = options;

  const outputPath = inputPath.replace(
    path.extname(inputPath),
    `.optimized.${format}`
  );

  await sharp(inputPath)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .toFormat(format, { quality })
    .toFile(outputPath);

  return outputPath;
}

async function generateThumbnail(inputPath, options = {}) {
  const { width = 320, height = 180 } = options;

  const outputPath = inputPath.replace(
    path.extname(inputPath),
    '.thumb.webp'
  );

  await sharp(inputPath)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .toFormat('webp', { quality: 70 })
    .toFile(outputPath);

  return outputPath;
}

module.exports = { optimizeImage, generateThumbnail };
```

Install sharp:
```bash
cd /home/pgc/vidlyx/backend
npm install sharp
```

### 9. Add Compression Middleware
Update `/home/pgc/vidlyx/backend/server.js`:

```javascript
const compression = require('compression');

// Add compression for responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Add caching headers for static assets
app.use('/frames', express.static('uploads/frames', {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
```

Install compression:
```bash
cd /home/pgc/vidlyx/backend
npm install compression
```

### 10. Frontend Build Optimization
Update `/home/pgc/vidlyx/dashboard/package.json`:

```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build",
    "analyze": "source-map-explorer 'build/static/js/*.js'"
  }
}
```

Create `/home/pgc/vidlyx/dashboard/craco.config.js` (if using CRACO):

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Split chunks for better caching
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      };

      return webpackConfig;
    }
  }
};
```

## Verification
1. Pages load via code splitting
2. Large lists scroll smoothly
3. Images lazy load on scroll
4. Network requests are cached
5. Build size is optimized
6. API responses are compressed

## Next Steps
Task 8 Complete! Application is ready for deployment.

## Estimated Time
3-4 hours

## Notes
- Monitor Core Web Vitals (LCP, FID, CLS)
- Use Chrome DevTools Performance tab
- Consider implementing Service Worker for offline support
- Add monitoring (e.g., Sentry) for production errors
