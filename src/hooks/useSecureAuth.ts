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
      
      // Method 1: Try is_admin RPC function with timeout
      try {
        console.log('🔄 Attempting admin RPC call: is_admin');
        
        // Add a timeout to the RPC call to prevent hanging
        const rpcPromise = supabase.rpc('is_admin');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('is_admin RPC call timeout after 5 seconds')), 5000)
        );
        
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        console.log('📊 Admin RPC response received');
        
        if (!error && data === true) {
          isAdmin = true;
          console.log('✅ Admin access confirmed via is_admin RPC');
          return true;
        } else {
          console.log('⚠️ is_admin RPC returned no data or error, trying alternative methods...');
        }
      } catch (rpcError) {
        console.log('⚠️ is_admin RPC timeout, trying alternative methods');
      }
      
      // Method 2: Try check_admin_access RPC function with timeout
      try {
        console.log('🔄 Attempting admin RPC call: check_admin_access');
        
        // Add a timeout to the RPC call to prevent hanging
        const rpcPromise = supabase.rpc('check_admin_access');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Admin RPC call timeout after 5 seconds')), 5000)
        );
        
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        console.log('📊 check_admin_access RPC response:', { data, error });
        
        if (!error && data === true) {
          isAdmin = true;
          console.log('✅ Admin access confirmed via check_admin_access RPC');
          return true;
        } else {
          console.log('⚠️ Admin RPC returned no data or error, trying direct profile check...');
        }
      } catch (rpcError) {
        console.log('⚠️ check_admin_access RPC timeout, trying direct profile check');
      }
      
      // Method 3: Direct profile table query as fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles' as any)
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!profileError && (profile as any)?.role === 'admin') {
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
        console.log('⚠️ Direct admin profile query failed');
      }
      
      console.log('Final admin check result:', isAdmin);
      return isAdmin;
    } catch (error) {
      console.log('⚠️ Admin access check failed, using fallback (false)');
      return false;
    }
  };

  const getCurrentUserProfile = async (user?: any): Promise<UserProfile | null> => {
    let currentUser: any = null;
    
    try {
      console.log('🔄 Fetching user profile...');
      
      // Method 1: Try get_current_user_profile RPC function with timeout
      try {
        console.log('🔄 Attempting RPC call: get_current_user_profile');
        
        // Add a timeout to the RPC call to prevent hanging
        const rpcPromise = supabase.rpc('get_current_user_profile');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC call timeout after 5 seconds')), 5000)
        );
        
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        console.log('📊 RPC response received');
        
        if (!error && data && data.length > 0) {
          const profile = data[0];
          console.log('✅ Profile fetched via RPC:', profile);
          return profile;
        } else {
          console.log('⚠️ RPC returned no data or error, trying direct query...');
        }
      } catch (rpcError) {
        // RPC timeout is expected, don't log as error
        console.log('⚠️ RPC timeout, using direct query fallback');
      }
      
      // Method 2: Direct profile table query as fallback
      try {
        console.log('🔄 Attempting direct profile query...');
        
        // Use the passed user data or get it from auth
        currentUser = user;
        if (!currentUser) {
          console.log('🔄 No user passed, getting from auth...');
          const getUserPromise = supabase.auth.getUser();
          const getUserTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getUser timeout after 5 seconds')), 5000)
          );
          
          const { data: { user: authUser } } = await Promise.race([getUserPromise, getUserTimeoutPromise]) as any;
          currentUser = authUser;
        }
        
        if (!currentUser) {
          console.log('❌ No authenticated user found');
          return null;
        }
        
        console.log('🔄 Attempting direct profile query for user:', currentUser.id);
        
        // Try to get profile from profiles table with timeout
        const profilePromise = supabase
          .from('profiles' as any)
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
          .eq('id', currentUser.id)
          .single();
        
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Direct profile query timeout after 5 seconds')), 5000)
        );
        
        const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
        console.log('📊 Direct query completed');
        
        if (!profileError && profile) {
          console.log('✅ Profile fetched via direct query:', profile);
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
        
        console.log('⚠️ Direct profile query timeout, using fallback profile');
        
        // Method 3: Create a minimal profile from auth user if none exists
        console.log('🔄 Creating fallback profile from auth user data');
        const fallbackProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: currentUser.user_metadata?.role || 'user',
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at || currentUser.created_at,
          totp_secret: null,
          mfa_enabled: false,
          backup_codes: [],
          mfa_setup_completed_at: null
        };
        console.log('✅ Created fallback profile:', fallbackProfile);
        return fallbackProfile;
      } catch (directError) {
        console.log('⚠️ Direct query failed, creating emergency fallback profile');
        // Create a minimal profile as last resort using the passed user data
        if (currentUser) {
          const fallbackProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            role: currentUser.user_metadata?.role || 'user',
            created_at: currentUser.created_at,
            updated_at: currentUser.updated_at || currentUser.created_at,
            totp_secret: null,
            mfa_enabled: false,
            backup_codes: [],
            mfa_setup_completed_at: null
          };
          console.log('✅ Created emergency fallback profile:', fallbackProfile);
          return fallbackProfile;
        }
        return null;
      }
    } catch (error) {
      console.log('⚠️ Profile fetch failed, returning null');
      return null;
    }
  };

  const checkUserType = async (userId: string): Promise<{ canUseMFA: boolean; isWalletUser: boolean }> => {
    try {
      console.log('🔄 Checking user type for:', userId);
      
      // Add timeout to canUserUseMFA call
      const canUsePromise = canUserUseMFA(userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User type check timeout after 5 seconds')), 5000)
      );
      
      const canUse = await Promise.race([canUsePromise, timeoutPromise]) as boolean;
      console.log('✅ User type check completed:', { canUseMFA: canUse, isWalletUser: !canUse });
      
      return {
        canUseMFA: canUse,
        isWalletUser: !canUse
      };
    } catch (error) {
      console.log('⚠️ User type check timeout, using fallback values');
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

      // Fetch user profile, admin status, and user type in parallel with timeout
      console.log('🔄 Starting parallel fetch of profile, admin status, and user type...');
      
      const parallelFetchPromise = Promise.all([
        getCurrentUserProfile(session.user),
        robustAdminCheck(), // Use the robust admin check instead
        checkUserType(session.user.id),
      ]);
      
      const parallelTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Parallel fetch timeout after 10 seconds')), 10000)
      );
      
      try {
        const [profile, isAdmin, userType] = await Promise.race([parallelFetchPromise, parallelTimeoutPromise]) as any;

        console.log('✅ All parallel fetches completed!');
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
      } catch (parallelError) {
        console.log('⚠️ Parallel fetch timeout, using fallback auth state');
        
        // Use fallback values if parallel fetch fails
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role: session.user.user_metadata?.role || 'user',
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
          totp_secret: null,
          mfa_enabled: false,
          backup_codes: [],
          mfa_setup_completed_at: null
        };
        
        setAuthState({
          user: session.user,
          session,
          profile: fallbackProfile,
          isAdmin: false, // Safe fallback
          loading: false,
          error: null,
          canUseMFA: false, // Safe fallback
          mfaEnabled: false,
          isWalletUser: true, // Safe fallback
        });
      }
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
            
            // Handle signout event - redirect to home page
            if (event === 'SIGNED_OUT') {
              // Use React Router navigation instead of window.location.href to prevent page reload
              // The RoleBasedDashboard component will handle the redirect to home page
              console.log('🔄 User signed out, auth state will trigger redirect');
            }
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
      
      // Clear any cached auth state
      setAuthState({
        user: null,
        session: null,
        profile: null,
        isAdmin: false,
        loading: false,
        error: null,
        isWalletUser: false,
        canUseMFA: false,
        mfaEnabled: false,
      });
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