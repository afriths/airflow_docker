/**
 * Offline Support Hook
 * Manages offline state, cached data, and provides offline-aware functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';

export interface OfflineSupportConfig {
  enableNotifications?: boolean;
  enableCaching?: boolean;
  cachePrefix?: string;
  maxCacheAge?: number; // in milliseconds
}

export interface CachedData {
  data: any;
  timestamp: number;
  key: string;
}

export interface OfflineSupportReturn {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  cachedDataCount: number;
  getCachedData: (key: string) => CachedData | null;
  setCachedData: (key: string, data: any) => void;
  clearCachedData: (key?: string) => void;
  getCachedDataAge: (key: string) => number | null;
  isCacheStale: (key: string, maxAge?: number) => boolean;
  retryConnection: () => void;
}

const DEFAULT_CONFIG: Required<OfflineSupportConfig> = {
  enableNotifications: true,
  enableCaching: true,
  cachePrefix: 'airflow_cache_',
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const useOfflineSupport = (
  config: OfflineSupportConfig = {}
): OfflineSupportReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [cachedDataCount, setCachedDataCount] = useState(0);

  // Update cached data count
  const updateCachedDataCount = useCallback(() => {
    if (!finalConfig.enableCaching) {
      setCachedDataCount(0);
      return;
    }

    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(finalConfig.cachePrefix)) {
        count++;
      }
    }
    setCachedDataCount(count);
  }, [finalConfig.cachePrefix, finalConfig.enableCaching]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());

      if (finalConfig.enableNotifications) {
        dispatch(addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: 'You\'re back online. Data will be refreshed automatically.',
          duration: 3000,
        }));
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setIsOnline(false);

      if (finalConfig.enableNotifications) {
        dispatch(addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You\'re now offline. Showing cached data when available.',
          duration: 5000,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count update
    updateCachedDataCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch, queryClient, finalConfig, updateCachedDataCount]);

  // Cache management functions
  const getCachedData = useCallback((key: string): CachedData | null => {
    if (!finalConfig.enableCaching) return null;

    try {
      const cachedItem = localStorage.getItem(`${finalConfig.cachePrefix}${key}`);
      if (!cachedItem) return null;

      const parsed = JSON.parse(cachedItem);
      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        key,
      };
    } catch (error) {
      console.warn(`Failed to retrieve cached data for key: ${key}`, error);
      return null;
    }
  }, [finalConfig.enableCaching, finalConfig.cachePrefix]);

  const setCachedData = useCallback((key: string, data: any) => {
    if (!finalConfig.enableCaching) return;

    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(
        `${finalConfig.cachePrefix}${key}`,
        JSON.stringify(cacheItem)
      );
      
      updateCachedDataCount();
    } catch (error) {
      console.warn(`Failed to cache data for key: ${key}`, error);
      
      // If storage is full, try to clear old items
      if (error instanceof DOMException && error.code === 22) {
        clearOldCachedData();
        // Try again after clearing
        try {
          const cacheItem = {
            data,
            timestamp: Date.now(),
          };
          
          localStorage.setItem(
            `${finalConfig.cachePrefix}${key}`,
            JSON.stringify(cacheItem)
          );
          
          updateCachedDataCount();
        } catch (retryError) {
          console.error('Failed to cache data after clearing old items', retryError);
        }
      }
    }
  }, [finalConfig.enableCaching, finalConfig.cachePrefix, updateCachedDataCount]);

  const clearCachedData = useCallback((key?: string) => {
    if (!finalConfig.enableCaching) return;

    try {
      if (key) {
        // Clear specific key
        localStorage.removeItem(`${finalConfig.cachePrefix}${key}`);
      } else {
        // Clear all cached data
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey?.startsWith(finalConfig.cachePrefix)) {
            keysToRemove.push(storageKey);
          }
        }
        
        keysToRemove.forEach(storageKey => {
          localStorage.removeItem(storageKey);
        });
      }
      
      updateCachedDataCount();
    } catch (error) {
      console.warn('Failed to clear cached data', error);
    }
  }, [finalConfig.enableCaching, finalConfig.cachePrefix, updateCachedDataCount]);

  // Clear old cached data based on max age
  const clearOldCachedData = useCallback(() => {
    if (!finalConfig.enableCaching) return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(finalConfig.cachePrefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const age = now - parsed.timestamp;
            
            if (age > finalConfig.maxCacheAge) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse the item, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      updateCachedDataCount();
      console.log(`Cleared ${keysToRemove.length} old cached items`);
    }
  }, [finalConfig.enableCaching, finalConfig.cachePrefix, finalConfig.maxCacheAge, updateCachedDataCount]);

  // Get age of cached data
  const getCachedDataAge = useCallback((key: string): number | null => {
    const cached = getCachedData(key);
    if (!cached) return null;
    
    return Date.now() - cached.timestamp;
  }, [getCachedData]);

  // Check if cached data is stale
  const isCacheStale = useCallback((key: string, maxAge?: number): boolean => {
    const age = getCachedDataAge(key);
    if (age === null) return true;
    
    const threshold = maxAge ?? finalConfig.maxCacheAge;
    return age > threshold;
  }, [getCachedDataAge, finalConfig.maxCacheAge]);

  // Retry connection (mainly for UI feedback)
  const retryConnection = useCallback(() => {
    // Force a network request to check connectivity
    fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
    })
      .then(() => {
        if (!navigator.onLine) {
          // Manually trigger online event if navigator.onLine is wrong
          setIsOnline(true);
          setLastOnline(new Date());
          
          if (finalConfig.enableNotifications) {
            dispatch(addNotification({
              type: 'success',
              title: 'Connection Restored',
              message: 'Connection test successful. Refreshing data...',
              duration: 3000,
            }));
          }
          
          queryClient.invalidateQueries();
        }
      })
      .catch(() => {
        if (finalConfig.enableNotifications) {
          dispatch(addNotification({
            type: 'error',
            title: 'Still Offline',
            message: 'Unable to establish connection. Please check your internet.',
            duration: 4000,
          }));
        }
      });
  }, [dispatch, queryClient, finalConfig.enableNotifications]);

  // Cleanup old cache periodically
  useEffect(() => {
    const interval = setInterval(clearOldCachedData, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [clearOldCachedData]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    cachedDataCount,
    getCachedData,
    setCachedData,
    clearCachedData,
    getCachedDataAge,
    isCacheStale,
    retryConnection,
  };
};

export default useOfflineSupport;