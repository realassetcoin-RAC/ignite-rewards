import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { canUserUseMFA } from '@/lib/mfa';

interface UserProfile {
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

  const checkAdminAccess = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin access:', error);
        return false;
      }
      return data === true;
    } catch (error) {
      console.error('Admin access check failed:', error);
      return false;
    }
  };

  const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data?.[0] || null;
    } catch (error) {
      console.error('Profile fetch failed:', error);
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

  const updateAuthState = async (session: Session | null) => {
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

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

      // Fetch user profile, admin status, and user type in parallel
      const [profile, isAdmin, userType] = await Promise.all([
        getCurrentUserProfile(),
        checkAdminAccess(),
        checkUserType(session.user.id),
      ]);

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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use setTimeout to prevent potential deadlocks
        setTimeout(() => {
          updateAuthState(session);
        }, 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
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