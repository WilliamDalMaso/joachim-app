import { useState, useEffect } from 'react';

interface ServiceWorkerState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isUpdateAvailable: false,
    isUpdating: false,
    registration: null,
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
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
        }
      });

      return () => {
        if (state.registration) {
          state.registration.removeEventListener('updatefound', handleUpdateFound);
        }
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
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

  return {
    ...state,
    updateApp,
    dismissUpdate,
  };
}; 