import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { canUserUseMFA } from '@/lib/mfa';
import { robustAdminCheck, diagnoseAdminIssues } from '@/utils/adminVerification';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  totp_secret?: string | null;
  mfa_enabled?: boolean;
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
}

export const useSecureAuth = () => {
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
  });

  // Track window focus state to prevent unnecessary auth updates
  const isWindowFocused = useRef(true);
  const lastAuthUpdate = useRef<number>(0);

  const checkAdminAccess = async (): Promise<boolean> => {
    try {
      console.log('Checking admin access...');
      
      // Use the enhanced admin check from the fix utility
      try {
        const { enhancedAdminCheck } = await import('@/utils/adminDashboardFix');
        const result = await enhancedAdminCheck();
        if (result) {
          console.log('Admin access confirmed via enhanced admin check');
          return true;
        }
      } catch (importError) {
        console.warn('Enhanced admin check not available, using fallback methods:', importError);
      }
      
      // Fallback: Try multiple methods to check admin access for maximum compatibility
      let isAdmin = false;
      
      // Method 1: Try is_admin RPC function
      try {
        const { data, error } = await supabase.rpc('is_admin');
        console.log('is_admin RPC response:', { data, error });
        
        if (!error && data === true) {
          isAdmin = true;
          console.log('Admin access confirmed via is_admin RPC');
          return true;
        }
      } catch (rpcError) {
        console.warn('is_admin RPC failed, trying alternative methods:', rpcError);
      }
      
      // Method 2: Try check_admin_access RPC function
      try {
        const { data, error } = await supabase.rpc('check_admin_access');
        console.log('check_admin_access RPC response:', { data, error });
        
        if (!error && data === true) {
          isAdmin = true;
          console.log('Admin access confirmed via check_admin_access RPC');
          return true;
        }
      } catch (rpcError) {
        console.warn('check_admin_access RPC failed, trying direct profile check:', rpcError);
      }
      
      // Method 3: Direct profile table query as fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profile?.role === 'admin') {
            isAdmin = true;
            console.log('Admin access confirmed via direct profile query');
            return true;
          }
          
          // Fallback: Check for known admin email
          if (user.email === 'realassetcoin@gmail.com') {
            isAdmin = true;
            console.log('Admin access confirmed via known admin email');
            return true;
          }
        }
      } catch (directError) {
        console.warn('Direct profile query failed:', directError);
      }
      
      console.log('Final admin check result:', isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('Admin access check completely failed:', error);
      return false;
    }
  };

  const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    try {
      console.log('Fetching user profile...');
      
      // Method 1: Try get_current_user_profile RPC function
      try {
        const { data, error } = await supabase.rpc('get_current_user_profile');
        console.log('get_current_user_profile RPC response:', { data, error });
        
        if (!error && data && data.length > 0) {
          const profile = data[0];
          console.log('Profile fetched via RPC:', profile);
          return profile;
        }
      } catch (rpcError) {
        console.warn('get_current_user_profile RPC failed, trying direct query:', rpcError);
      }
      
      // Method 2: Direct profile table query as fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found');
          return null;
        }
        
        console.log('Attempting direct profile query for user:', user.id);
        
        // Try to get profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at,
            totp_secret,
            mfa_enabled,
            backup_codes,
            mfa_setup_completed_at
          `)
          .eq('id', user.id)
          .single();
        
        if (!profileError && profile) {
          console.log('Profile fetched via direct query:', profile);
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            totp_secret: profile.totp_secret,
            mfa_enabled: profile.mfa_enabled || false,
            backup_codes: profile.backup_codes || [],
            mfa_setup_completed_at: profile.mfa_setup_completed_at
          };
        }
        
        console.warn('Direct profile query failed:', profileError);
        
        // Method 3: Create a minimal profile from auth user if none exists
        console.log('Creating fallback profile from auth user data');
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'user',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          totp_secret: null,
          mfa_enabled: false,
          backup_codes: [],
          mfa_setup_completed_at: null
        };
      } catch (directError) {
        console.error('Direct profile query failed:', directError);
        return null;
      }
    } catch (error) {
      console.error('Profile fetch completely failed:', error);
      return null;
    }
  };

  const checkUserType = async (userId: string): Promise<{ canUseMFA: boolean; isWalletUser: boolean }> => {
    try {
      const canUse = await canUserUseMFA(userId);
      return {
        canUseMFA: canUse,
        isWalletUser: !canUse
      };
    } catch (error) {
      console.error('Error checking user type:', error);
      return {
        canUseMFA: false,
        isWalletUser: true
      };
    }
  };

  const updateAuthState = async (session: Session | null, forceUpdate = false) => {
    // Don't set loading to true if this is just a session refresh and we already have a user
    const shouldShowLoading = forceUpdate || !authState.user;
    
    if (shouldShowLoading) {
      setAuthState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));
    }

    try {
      if (!session?.user) {
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
        });
        return;
      }

      // If we already have the same user and session, don't refetch everything
      if (authState.user?.id === session.user.id && authState.session?.access_token === session.access_token && !forceUpdate) {
        // Just update the session token if it changed
        setAuthState(prev => ({
          ...prev,
          session,
          loading: false,
        }));
        return;
      }

      console.log('🔐 Updating auth state for user:', session.user.email);

      // Fetch user profile, admin status, and user type in parallel
      const [profile, isAdmin, userType] = await Promise.all([
        getCurrentUserProfile(),
        robustAdminCheck(), // Use the robust admin check instead
        checkUserType(session.user.id),
      ]);

      console.log('🔍 Auth state results:', {
        profile: profile?.email,
        isAdmin,
        userType,
        role: profile?.role
      });

      setAuthState({
        user: session.user,
        session,
        profile,
        isAdmin,
        loading: false,
        error: null,
        canUseMFA: userType.canUseMFA,
        mfaEnabled: profile?.mfa_enabled || false,
        isWalletUser: userType.isWalletUser,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  useEffect(() => {
    // Note: Window focus/blur handling is now managed by useRefreshPrevention hook
    // to avoid conflicts and ensure proper refresh prevention
    // We'll use a simple flag that gets updated by the refresh prevention hook

    // Set up auth state listener with smart update logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastAuthUpdate.current;
        
        // Smart auth updates - allow updates but prevent excessive refreshes
        const shouldUpdate = 
          timeSinceLastUpdate > 5000 || // 5 seconds debounce
          ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event);

        if (shouldUpdate) {
          lastAuthUpdate.current = now;
          // Use setTimeout to prevent potential deadlocks
          setTimeout(() => {
            // Only force update for significant events, not token refreshes
            const forceUpdate = ['SIGNED_IN', 'SIGNED_OUT'].includes(event);
            updateAuthState(session, forceUpdate);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session, true); // Force update on initial load
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshAuth = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });
  };

  return {
    ...authState,
    signOut,
    refreshAuth,
  };
};