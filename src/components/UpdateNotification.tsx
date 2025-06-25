import React from 'react';
import { RefreshCw, X, Wifi, WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const UpdateNotification: React.FC = () => {
  const { isUpdateAvailable, updateApp, dismissUpdate, isOnline, cacheVersion } = useServiceWorker();

  if (!isUpdateAvailable && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Update Available Notification */}
      {isUpdateAvailable && (
        <div className="bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                New version available
              </p>
              <p className="text-xs text-white/60 mt-1">
                Tap to refresh and get the latest features
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={updateApp}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
              >
                Refresh
              </button>
              
              <button
                onClick={dismissUpdate}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status Notification */}
      {!isOnline && (
        <div className="bg-orange-500/95 backdrop-blur-sm border border-orange-400/20 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                You're offline
              </p>
              <p className="text-xs text-white/80 mt-1">
                Some features may be limited
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cache Version Info (only in development) */}
      {process.env.NODE_ENV === 'development' && cacheVersion && (
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/20 rounded-lg shadow-lg p-3 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Wifi className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300">
                Cache: {cacheVersion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { UpdateNotification };
export default UpdateNotification; 