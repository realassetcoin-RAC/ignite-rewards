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
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
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
            try {
              await supabase.auth.refreshSession();
            } catch (refreshError) {
              console.warn('Session refresh failed:', refreshError);
            }
          }
        }
      } catch (error) {
        console.warn('Session persistence check failed:', error);
        // Don't let session errors break the app
      }
    };

    // Set up periodic session check
    sessionCheckInterval.current = setInterval(checkSession, 30000); // Check every 30 seconds

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
