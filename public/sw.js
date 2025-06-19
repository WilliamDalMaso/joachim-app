const CACHE_NAME = 'english-on-the-go-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - Simple strategy: cache static assets, never cache API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache API calls, WebRTC, or dynamic content
  if (shouldSkipCache(event.request, url)) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Cache-first strategy for static assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Helper function to determine if request should skip cache
function shouldSkipCache(request, url) {
  // Skip WebRTC connections
  if (url.protocol === 'wss:' || url.protocol === 'ws:') {
    return true;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return true;
  }
  
  // Skip API endpoints
  if (url.pathname.startsWith('/session') || 
      url.hostname === 'api.openai.com' ||
      url.hostname === 'localhost' && url.port === '3001') {
    return true;
  }
  
  // Skip dynamic content
  if (url.pathname.includes('?') || url.search) {
    return true;
  }
  
  return false;
}

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});