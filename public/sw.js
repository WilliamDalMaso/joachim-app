// Version constant - bump this on every deploy to force iOS updates
const CACHE_VERSION = 'v1.2.5';
const CACHE_NAME = `english-on-the-go-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - Force immediate activation for iOS
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => {
        // Force the new worker to take control immediately
        return self.skipWaiting();
      })
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

// Activate event - Claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
});