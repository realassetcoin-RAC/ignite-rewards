import { useEffect, useRef } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';

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
        // Add timeout to prevent hanging (reduced to 5 seconds)
        const sessionPromise = databaseAdapter.supabase.auth.getSession();
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
          
          // Check if session is expired
          if (expiresAt > 0 && expiresAt < now) {
            console.log('Session expired, clearing...');
            localStorage.removeItem('auth_session');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('google_user');
            localStorage.removeItem('google_access_token');
            return;
          }
          
          // If session expires in less than 5 minutes, refresh it
          if (expiresAt - now < 300) {
            console.log('Session expiring soon, refreshing...');
            try {
              await databaseAdapter.supabase.auth.refreshSession();
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

    // Listen for auth state changes (including OAuth callbacks)
    const handleAuthStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { event: authEvent, session } = customEvent.detail;
      
      console.log('Auth state changed:', authEvent, session ? 'Session exists' : 'No session');
      
      // Force a session check when auth state changes
      lastSessionCheck.current = 0;
    };

    // Listen for storage events (OAuth callbacks from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_session' || event.key === 'auth_user') {
        console.log('Auth storage changed, checking session...');
        lastSessionCheck.current = 0;
      }
    };

    window.addEventListener('auth-state-change', handleAuthStateChange);
    window.addEventListener('storage', handleStorageChange);

    // Set up periodic session check
    sessionCheckInterval.current = setInterval(checkSession, 30000); // Check every 30 seconds

    // Note: Window focus handling is now managed by useRefreshPrevention hook
    // to avoid conflicts and ensure proper refresh prevention

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      window.removeEventListener('auth-state-change', handleAuthStateChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    checkSession: () => {
      lastSessionCheck.current = 0; // Force immediate check
    }
  };
};
