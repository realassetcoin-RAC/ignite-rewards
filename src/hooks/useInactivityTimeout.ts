import { useEffect, useRef, useCallback } from 'react';
import { useSecureAuth } from './useSecureAuth';
import { useToast } from './use-toast';

/**
 * ✅ IMPLEMENT REQUIREMENT: Account logout after 5 minutes of inactivity
 * Hook to handle automatic logout after specified minutes of inactivity
 */
export const useInactivityTimeout = (timeoutMinutes: number = 5) => {
  const { signOut, user } = useSecureAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timeout if user is logged in
    if (!user) return;

    // Show warning at 4 minutes (1 minute before timeout)
    warningTimeoutRef.current = setTimeout(() => {
      toast({
        title: "Session Expiring Soon",
        description: "You will be logged out in 1 minute due to inactivity. Move your mouse or click to stay logged in.",
        variant: "destructive",
      });
    }, (timeoutMinutes - 1) * 60 * 1000);

    // Auto logout after specified minutes
    timeoutRef.current = setTimeout(() => {
      console.log('🔒 Auto-logout due to inactivity');
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      signOut();
    }, timeoutMinutes * 60 * 1000);
  }, [user, signOut, toast, timeoutMinutes]);

  const handleActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Only track activity if user is logged in
    if (!user) {
      // Clear timeouts if user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Start the timeout
    resetTimeout();

    // Add event listeners for activity detection
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, handleActivity, resetTimeout]);

  // Return function to manually reset timeout (useful for API calls, etc.)
  return {
    resetTimeout: handleActivity,
    timeRemaining: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, Math.floor(remaining / 1000)); // Return seconds remaining
    }
  };
};
