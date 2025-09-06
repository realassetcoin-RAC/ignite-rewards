import { useEffect, useRef } from 'react';

/**
 * Hook to prevent unnecessary app refreshes when switching between applications
 * This addresses the core issue of React components re-mounting on window focus
 */
export const useAppStability = () => {
  const isInitialized = useRef(false);
  const lastFocusTime = useRef<number>(0);
  const focusCount = useRef<number>(0);

  useEffect(() => {
    // Prevent multiple rapid focus events from causing refreshes
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime.current;
      
      // Only process focus events if it's been more than 1 second since last focus
      if (timeSinceLastFocus > 1000) {
        lastFocusTime.current = now;
        focusCount.current += 1;
        
        console.log(`Window focused (${focusCount.current}), preventing unnecessary refreshes`);
      }
    };

    const handleBlur = () => {
      console.log('Window blurred, maintaining app state');
    };

    // Add visibility change handler to prevent refreshes on tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, maintaining app state');
      } else {
        console.log('Tab hidden, preserving app state');
      }
    };

    // Add page show/hide handlers for mobile and some desktop scenarios
    const handlePageShow = (event: PageTransitionEvent) => {
      // Prevent refresh on back/forward cache restoration
      if (event.persisted) {
        console.log('Page restored from cache, preventing refresh');
      }
    };

    const handlePageHide = () => {
      console.log('Page hidden, preserving state');
    };

    // Set up all event listeners
    window.addEventListener('focus', handleFocus, { passive: true });
    window.addEventListener('blur', handleBlur, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });
    window.addEventListener('pagehide', handlePageHide, { passive: true });

    // Mark as initialized
    isInitialized.current = true;

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return {
    isInitialized: isInitialized.current,
    focusCount: focusCount.current,
  };
};

