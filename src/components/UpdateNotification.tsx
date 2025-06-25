import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const UpdateNotification: React.FC = () => {
  const { isUpdateAvailable, updateApp, dismissUpdate } = useServiceWorker();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-top-2 duration-300">
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
  );
};

export { UpdateNotification };
export default UpdateNotification; 