import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseInactivityLogoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onLogout?: () => void;
}

export const useInactivityLogout = (options: UseInactivityLogoutOptions = {}) => {
  const {
    timeoutMinutes = 5,
    warningMinutes = 4,
    onLogout
  } = options;

  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        toast({
          title: "Session Timeout Warning",
          description: `You will be logged out in ${timeoutMinutes - warningMinutes} minute(s) due to inactivity.`,
          variant: "destructive",
          duration: 10000,
        });
      }
    }, warningMs);

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut({
          scope: 'local' // This prevents redirect and keeps the sign out local
        });
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          variant: "destructive",
        });
        onLogout?.();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }, timeoutMs);
  }, [timeoutMinutes, warningMinutes, timeoutMs, warningMs, toast, onLogout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Add event listeners for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

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
  }, [handleActivity, resetTimer]);

  // Return manual controls
  return {
    resetTimer,
    getTimeRemaining: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeoutMs - elapsed);
    },
    isWarningShown: warningShownRef.current
  };
};
