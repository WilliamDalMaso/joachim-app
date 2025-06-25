import { useState, useEffect } from 'react';

interface ServiceWorkerState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
  isOnline: boolean;
  cacheVersion: string | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isUpdateAvailable: false,
    isUpdating: false,
    registration: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    cacheVersion: null,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleUpdateFound = () => {
      const registration = state.registration;
      if (!registration) return;

      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setState(prev => ({ ...prev, isUpdateAvailable: true }));
        }
      });
    };

    const handleControllerChange = () => {
      setState(prev => ({ ...prev, isUpdating: true }));
      // Optionally reload the page
      window.location.reload();
    };

    const handleOnlineStatusChange = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    // Get existing registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setState(prev => ({ ...prev, registration }));
        
        // Check for updates
        registration.update();
        
        // Listen for updates
        registration.addEventListener('updatefound', handleUpdateFound);
        
        // Listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        
        // Get cache version from service worker
        if (registration.active) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            if (event.data && event.data.version) {
              setState(prev => ({ ...prev, cacheVersion: event.data.version }));
            }
          };
          registration.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
        }
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      if (state.registration) {
        state.registration.removeEventListener('updatefound', handleUpdateFound);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const updateApp = () => {
    if (state.registration && state.registration.waiting) {
      // Send message to waiting service worker to skip waiting
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback to page reload
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    setState(prev => ({ ...prev, isUpdateAvailable: false }));
  };

  const checkForUpdates = () => {
    if (state.registration) {
      state.registration.update();
    }
  };

  return {
    ...state,
    updateApp,
    dismissUpdate,
    checkForUpdates,
  };
}; 