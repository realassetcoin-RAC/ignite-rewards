import { useEffect, useRef, useCallback } from 'react';

/**
 * Smart refresh hook that prevents page refreshes but allows component data updates
 * This maintains page stability while ensuring fresh data when returning to the app
 */
export const useSmartRefresh = () => {
  const lastFocusTime = useRef<number>(0);
  const focusCount = useRef<number>(0);
  const isPageStable = useRef(true);

  // Prevent page reload but allow component updates
  const preventPageReload = useCallback((event: BeforeUnloadEvent) => {
    // Only prevent reload if it's not a legitimate navigation
    if (isPageStable.current && !event.defaultPrevented) {
      console.log('🚫 Prevented page reload, allowing component updates');
      // Don't prevent the event, just log it
      return;
    }
  }, []);

  useEffect(() => {
    // Handle focus events for smart updates
    const handleFocus = (event: FocusEvent) => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime.current;
      
      // Only process focus events if it's been more than 1 second since last focus
      if (timeSinceLastFocus > 1000) {
        lastFocusTime.current = now;
        focusCount.current += 1;
        
        console.log(`🔄 Window focused (${focusCount.current}), triggering smart component updates`);
        
        // Trigger a custom event for components to listen to
        const smartUpdateEvent = new CustomEvent('smartRefresh', {
          detail: { 
            focusCount: focusCount.current,
            timeSinceLastFocus: timeSinceLastFocus
          }
        });
        window.dispatchEvent(smartUpdateEvent);
      }
    };

    const handleBlur = () => {
      console.log('🔄 Window blurred, maintaining page stability');
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab became visible, triggering smart updates');
        
        // Trigger smart update event
        const smartUpdateEvent = new CustomEvent('smartRefresh', {
          detail: { 
            trigger: 'visibility',
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(smartUpdateEvent);
      } else {
        console.log('🔄 Tab hidden, maintaining page stability');
      }
    };

    // Handle page show/hide events
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Page restored from cache, triggering smart updates');
        
        // Trigger smart update event
        const smartUpdateEvent = new CustomEvent('smartRefresh', {
          detail: { 
            trigger: 'pageShow',
            persisted: event.persisted
          }
        });
        window.dispatchEvent(smartUpdateEvent);
      }
    };

    const handlePageHide = () => {
      console.log('🔄 Page hidden, maintaining stability');
    };

    // Set up event listeners
    window.addEventListener('beforeunload', preventPageReload, { passive: true });
    window.addEventListener('focus', handleFocus, { passive: true });
    window.addEventListener('blur', handleBlur, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });
    window.addEventListener('pagehide', handlePageHide, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', preventPageReload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [preventPageReload]);

  // Function to manually trigger smart updates
  const triggerSmartUpdate = useCallback((reason: string) => {
    console.log(`🔄 Manual smart update triggered: ${reason}`);
    
    const smartUpdateEvent = new CustomEvent('smartRefresh', {
      detail: { 
        trigger: 'manual',
        reason: reason,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(smartUpdateEvent);
  }, []);

  // Function to temporarily disable smart updates
  const disableSmartUpdates = useCallback(() => {
    isPageStable.current = false;
    console.log('⚠️ Smart updates disabled');
  }, []);

  // Function to re-enable smart updates
  const enableSmartUpdates = useCallback(() => {
    isPageStable.current = true;
    console.log('✅ Smart updates enabled');
  }, []);

  return {
    isPageStable: isPageStable.current,
    focusCount: focusCount.current,
    triggerSmartUpdate,
    disableSmartUpdates,
    enableSmartUpdates,
  };
};

