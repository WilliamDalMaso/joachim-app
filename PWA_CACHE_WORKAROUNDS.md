# iOS PWA Cache Workarounds

This project implements several techniques to work around iOS's "frozen" PWA cache behavior, ensuring users receive updates without having to manually clear site data.

## Implemented Solutions

### 1. Force Immediate Service Worker Activation

**File:** `public/sw.js`

```javascript
// Install event - Force immediate activation for iOS
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => {
        // Force the new worker to take control immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - Claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Clean up old caches
      // ...
    ])
  );
});
```

### 2. Version Bumping for Byte-Diff Detection

**File:** `public/sw.js`

```javascript
// Version constant - bump this on every deploy to force iOS updates
const CACHE_VERSION = 'v1.2.3';
const CACHE_NAME = `english-on-the-go-${CACHE_VERSION}`;
```

**Automated Bumping:** `scripts/bump-version.js`
```bash
npm run bump-version
```

### 3. Programmatic Update Checking

**File:** `index.html`

```javascript
// Programmatically check for updates on load (iOS workaround)
registration.update();

// Listen for updates and show refresh prompt
registration.addEventListener('updatefound', () => {
  const newWorker = registration.installing;
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      showUpdatePrompt();
    }
  });
});
```

### 4. React-Based Update Management

**Hook:** `src/hooks/useServiceWorker.ts`
- Manages service worker state
- Provides update detection
- Handles programmatic updates

**Component:** `src/components/UpdateNotification.tsx`
- Displays update notifications
- Provides refresh and dismiss actions
- Integrates with the app's design system

### 5. Message-Based Update Control

**Service Worker:** `public/sw.js`
```javascript
// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

**App Integration:** `src/hooks/useServiceWorker.ts`
```javascript
const updateApp = () => {
  if (state.registration && state.registration.waiting) {
    // Send message to waiting service worker to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // Fallback to page reload
    window.location.reload();
  }
};
```

## Usage

### Development

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test service worker updates:**
   - Make changes to the service worker
   - Bump version: `npm run bump-version`
   - Reload the app to see update detection

### Deployment

1. **Automatic deployment with version bump:**
   ```bash
   npm run deploy
   ```

2. **Manual version bump:**
   ```bash
   npm run bump-version
   ```

## How It Works

1. **Version Detection:** iOS detects byte-differences in the service worker file
2. **Immediate Activation:** `skipWaiting()` and `clients.claim()` bypass normal waiting
3. **Update Notification:** Users see a non-intrusive update prompt
4. **Seamless Refresh:** Users can update without losing data

## Benefits

- ✅ **No manual cache clearing required**
- ✅ **Immediate update detection**
- ✅ **User-friendly update prompts**
- ✅ **Preserves user data during updates**
- ✅ **Works reliably on iOS Safari**
- ✅ **Automated version management**

## Browser Support

- ✅ iOS Safari (Primary target)
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop)

## Troubleshooting

### Update Not Detected
1. Ensure version number was bumped
2. Check service worker registration in browser dev tools
3. Verify `registration.update()` is being called

### Update Prompt Not Showing
1. Check if `UpdateNotification` component is rendered
2. Verify `useServiceWorker` hook is working
3. Check browser console for errors

### Service Worker Not Activating
1. Verify `skipWaiting()` and `clients.claim()` are called
2. Check for syntax errors in service worker
3. Ensure service worker file is accessible

## References

- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [iOS PWA Cache Issues](https://github.com/PWA-POLICE/pwa-bugs)
- [Workbox Skip Waiting](https://developers.google.com/web/tools/workbox/modules/workbox-core#skipwaiting) 