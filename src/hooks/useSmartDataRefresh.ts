import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for components to listen to smart refresh events and update their data
 * This allows components to refresh data without causing page refreshes
 */
export const useSmartDataRefresh = (refreshCallback: () => void | Promise<void>, options?: {
  debounceMs?: number;
  enabled?: boolean;
  dependencies?: any[];
}) => {
  const {
    debounceMs = 1000,
    enabled = true,
    dependencies = []
  } = options || {};

  const lastRefreshTime = useRef<number>(0);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced refresh function
  const debouncedRefresh = useCallback(async () => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastRefreshTime.current < debounceMs) {
      console.log('🔄 Smart refresh debounced, too soon since last refresh');
      return;
    }

    lastRefreshTime.current = now;
    
    try {
      console.log('🔄 Executing smart data refresh');
      await refreshCallback();
    } catch (error) {
      console.error('🔄 Smart refresh failed:', error);
    }
  }, [refreshCallback, debounceMs, enabled, ...dependencies]);

  useEffect(() => {
    if (!enabled) return;

    // Listen for smart refresh events
    const handleSmartRefresh = (event: CustomEvent) => {
      console.log('🔄 Smart refresh event received:', event.detail);
      
      // Clear any existing timeout
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      
      // Debounce the refresh
      refreshTimeout.current = setTimeout(() => {
        debouncedRefresh();
      }, 100); // Small delay to batch multiple events
    };

    // Add event listener
    window.addEventListener('smartRefresh', handleSmartRefresh as EventListener);

    return () => {
      window.removeEventListener('smartRefresh', handleSmartRefresh as EventListener);
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, [debouncedRefresh, enabled]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    console.log('🔄 Manual data refresh triggered');
    debouncedRefresh();
  }, [debouncedRefresh]);

  return {
    manualRefresh,
    lastRefreshTime: lastRefreshTime.current,
  };
};

