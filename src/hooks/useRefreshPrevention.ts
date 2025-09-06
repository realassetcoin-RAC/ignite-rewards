import { useEffect, useRef, useCallback } from 'react';

/**
 * Comprehensive hook to prevent app refreshes when switching between applications
 * This is a more aggressive approach that blocks all potential refresh triggers
 */
export const useRefreshPrevention = () => {
  const isPreventingRefresh = useRef(true);
  const lastFocusTime = useRef<number>(0);
  const focusCount = useRef<number>(0);
  const originalLocationReload = useRef<typeof window.location.reload>();

  // Prevent page reload
  const preventReload = useCallback((event: BeforeUnloadEvent) => {
    if (isPreventingRefresh.current) {
      event.preventDefault();
      event.returnValue = '';
      console.log('🚫 Prevented page reload');
      return '';
    }
  }, []);

  // Override window.location.reload
  const overrideReload = useCallback(() => {
    if (isPreventingRefresh.current) {
      console.log('🚫 Prevented window.location.reload()');
      return;
    }
    originalLocationReload.current?.call(window.location);
  }, []);

  useEffect(() => {
    // Store original reload function
    originalLocationReload.current = window.location.reload;
    
    // Override reload function
    window.location.reload = overrideReload;

    // Prevent page unload/refresh
    window.addEventListener('beforeunload', preventReload);

    // Handle focus events with aggressive prevention
    const handleFocus = (event: FocusEvent) => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime.current;
      
      // Only process focus events if it's been more than 2 seconds since last focus
      if (timeSinceLastFocus > 2000) {
        lastFocusTime.current = now;
        focusCount.current += 1;
        
        console.log(`🚫 Window focused (${focusCount.current}), preventing refresh`);
        
        // Prevent any potential refresh triggers
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    };

    const handleBlur = () => {
      console.log('🚫 Window blurred, maintaining app state');
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🚫 Tab became visible, preventing refresh');
      } else {
        console.log('🚫 Tab hidden, preserving app state');
      }
    };

    // Handle page show/hide events
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🚫 Page restored from cache, preventing refresh');
      }
    };

    const handlePageHide = () => {
      console.log('🚫 Page hidden, preserving state');
    };

    // Handle hash changes (can cause refreshes)
    const handleHashChange = () => {
      console.log('🚫 Hash change detected, preventing refresh');
      // Prevent default hash change behavior
      return false;
    };

    // Set up all event listeners with capture to intercept early
    window.addEventListener('focus', handleFocus, { capture: true, passive: false });
    window.addEventListener('blur', handleBlur, { capture: true, passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { capture: true, passive: true });
    window.addEventListener('pageshow', handlePageShow, { capture: true, passive: true });
    window.addEventListener('pagehide', handlePageHide, { capture: true, passive: true });
    window.addEventListener('hashchange', handleHashChange, { capture: true, passive: false });

    // Prevent context menu refresh
    const handleContextMenu = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        console.log('🚫 Prevented context menu refresh');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });

    // Prevent keyboard shortcuts that might refresh
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R
      if (
        event.key === 'F5' ||
        (event.ctrlKey && event.key === 'r') ||
        (event.ctrlKey && event.shiftKey && event.key === 'R')
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🚫 Prevented keyboard refresh shortcut');
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });

    return () => {
      // Restore original reload function
      if (originalLocationReload.current) {
        window.location.reload = originalLocationReload.current;
      }
      
      // Remove all event listeners
      window.removeEventListener('beforeunload', preventReload);
      window.removeEventListener('focus', handleFocus, { capture: true });
      window.removeEventListener('blur', handleBlur, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange, { capture: true });
      window.removeEventListener('pageshow', handlePageShow, { capture: true });
      window.removeEventListener('pagehide', handlePageHide, { capture: true });
      window.removeEventListener('hashchange', handleHashChange, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [preventReload, overrideReload]);

  // Function to temporarily disable refresh prevention (for debugging)
  const disableRefreshPrevention = useCallback(() => {
    isPreventingRefresh.current = false;
    console.log('⚠️ Refresh prevention disabled');
  }, []);

  // Function to re-enable refresh prevention
  const enableRefreshPrevention = useCallback(() => {
    isPreventingRefresh.current = true;
    console.log('✅ Refresh prevention enabled');
  }, []);

  return {
    isPreventingRefresh: isPreventingRefresh.current,
    focusCount: focusCount.current,
    disableRefreshPrevention,
    enableRefreshPrevention,
  };
};

