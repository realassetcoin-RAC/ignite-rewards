import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { canUserUseMFA } from '@/lib/mfa';
import { robustAdminCheck } from '@/utils/adminVerification';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { SecurityService } from '@/lib/securityService';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  totp_secret?: string | null;
  backup_codes?: string[];
  mfa_setup_completed_at?: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  canUseMFA: boolean;
  mfaEnabled: boolean;
  isWalletUser: boolean;
  isEmailVerified: boolean;
  needsEmailVerification: boolean;
}

export const useSecureAuthFixed = () => {
  const logger = createModuleLogger('useSecureAuth');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    loading: true,
    error: null,
    canUseMFA: false,
    mfaEnabled: false,
    isWalletUser: false,
    isEmailVerified: false,
    needsEmailVerification: false,
  });

  const lastAuthUpdate = useRef<number>(0);
  const isUpdating = useRef<boolean>(false);

  const getCurrentUserProfile = async (user?: User): Promise<UserProfile | null> => {
    try {
      if (!user) return null;

      // Mock profile for development
      const mockProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: user.email === 'realassetcoin@gmail.com' ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return mockProfile;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  };

  const checkUserType = async (userId: string): Promise<{ isWalletUser: boolean; canUseMFA: boolean; mfaEnabled: boolean }> => {
    try {
      // Mock user type check
      const canMFA = await canUserUseMFA(userId).catch(() => false);
      
      return {
        isWalletUser: false,
        canUseMFA: canMFA,
        mfaEnabled: false,
      };
    } catch (error) {
      logger.error('Error checking user type:', error);
      return {
        isWalletUser: false,
        canUseMFA: false,
        mfaEnabled: false,
      };
    }
  };

  const updateAuthState = useCallback(async (session: Session | null, forceUpdate = false) => {
    // Prevent concurrent updates
    if (isUpdating.current && !forceUpdate) {
      logger.debug('Auth update already in progress, skipping');
      return;
    }

    // Throttle updates to prevent loops
    const now = Date.now();
    if (!forceUpdate && now - lastAuthUpdate.current < 1000) {
      logger.debug('Auth update throttled');
      return;
    }

    isUpdating.current = true;
    lastAuthUpdate.current = now;

    try {
      if (!session?.user) {
        logger.debug('No session, clearing auth state');
        setAuthState({
          user: null,
          session: null,
          profile: null,
          isAdmin: false,
          loading: false,
          error: null,
          canUseMFA: false,
          mfaEnabled: false,
          isWalletUser: false,
          isEmailVerified: false,
          needsEmailVerification: false,
        });
        return;
      }

      logger.debug('Updating auth state for user:', session.user.email);

      // Set loading state
      setAuthState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      // Fetch user data with timeout
      const fetchPromise = Promise.all([
        getCurrentUserProfile(session.user),
        robustAdminCheck().catch(() => false),
        checkUserType(session.user.id),
      ]);

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth fetch timeout')), 30000)
      );

      try {
        const [profile, isAdmin, userType] = await Promise.race([fetchPromise, timeoutPromise]);

        // Check email verification
        const isEmailVerified = session.user.email_confirmed_at != null;
        const needsEmailVerification = !isEmailVerified && !session.user.app_metadata?.provider;

        setAuthState({
          user: session.user,
          session,
          profile,
          isAdmin: Boolean(isAdmin),
          loading: false,
          error: null,
          canUseMFA: userType.canUseMFA,
          mfaEnabled: userType.mfaEnabled,
          isWalletUser: userType.isWalletUser,
          isEmailVerified,
          needsEmailVerification,
        });

        logger.debug('Auth state updated successfully');
      } catch (error) {
        logger.error('Error fetching auth data:', error);
        
        // Set basic auth state even if profile fetch fails
        setAuthState({
          user: session.user,
          session,
          profile: null,
          isAdmin: false,
          loading: false,
          error: 'Failed to load user profile',
          canUseMFA: false,
          mfaEnabled: false,
          isWalletUser: false,
          isEmailVerified: session.user.email_confirmed_at != null,
          needsEmailVerification: false,
        });
      }
    } catch (error) {
      logger.error('Error in updateAuthState:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Authentication error',
      }));
    } finally {
      isUpdating.current = false;
    }
  }, []); // Empty dependency array to prevent loops

  useEffect(() => {
    logger.debug('Setting up auth state listener');

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state change event:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          // Clear auth state immediately
          setAuthState({
            user: null,
            session: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: null,
            canUseMFA: false,
            mfaEnabled: false,
            isWalletUser: false,
            isEmailVerified: false,
            needsEmailVerification: false,
          });
          logger.debug('Auth state cleared after SIGNED_OUT event');
        }
      }
    );

    // Check for existing session with timeout
    const initAuth = async () => {
      try {
        logger.debug('Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting session:', error);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to get session',
          }));
          return;
        }

        await updateAuthState(session, true);
      } catch (error) {
        logger.error('Error initializing auth:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    // Add a small delay to prevent rapid state changes
    const timer = setTimeout(initAuth, 100);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array

  const signOut = async () => {
    try {
      logger.debug('Starting sign out process');
      
      // Clear security context
      SecurityService.clearSecurityContext();
      
      // Clear auth state immediately
      setAuthState({
        user: null,
        session: null,
        profile: null,
        isAdmin: false,
        loading: false,
        error: null,
        canUseMFA: false,
        mfaEnabled: false,
        isWalletUser: false,
        isEmailVerified: false,
        needsEmailVerification: false,
      });
      
      // Clear localStorage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        logger.warn('Could not clear localStorage:', error);
      }
      
      // Call Supabase signOut with local scope to prevent redirect
      const { error } = await supabase.auth.signOut({
        scope: 'local' // This prevents redirect and keeps the sign out local
      });
      if (error) {
        logger.error('Supabase signOut error:', error);
        // Don't throw error since we've already cleared local state
      }
      
      logger.debug('Sign out completed');
    } catch (error) {
      logger.error('Sign out error:', error);
      // Don't throw error to ensure user appears signed out
    }
  };

  const refreshAuth = useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session, true);
    });
  }, [updateAuthState]);

  return {
    ...authState,
    signOut,
    refreshAuth,
  };
};
