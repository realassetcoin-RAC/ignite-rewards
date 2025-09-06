import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to maintain session persistence and prevent auth state loss
 * when switching between applications
 */
export const useSessionPersistence = () => {
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheck = useRef<number>(0);

  useEffect(() => {
    // Function to check and maintain session
    const checkSession = async () => {
      const now = Date.now();
      
      // Only check session every 30 seconds to avoid excessive calls
      if (now - lastSessionCheck.current < 30000) {
        return;
      }
      
      lastSessionCheck.current = now;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session check error:', error);
          return;
        }
        
        // If we have a session, ensure it's still valid
        if (session) {
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          
          // If session expires in less than 5 minutes, refresh it
          if (expiresAt - now < 300) {
            console.log('Session expiring soon, refreshing...');
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.warn('Session persistence check failed:', error);
      }
    };

    // Set up periodic session check
    sessionCheckInterval.current = setInterval(checkSession, 60000); // Check every minute

    // Note: Window focus handling is now managed by useRefreshPrevention hook
    // to avoid conflicts and ensure proper refresh prevention

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  return {
    checkSession: () => {
      lastSessionCheck.current = 0; // Force immediate check
    }
  };
};
