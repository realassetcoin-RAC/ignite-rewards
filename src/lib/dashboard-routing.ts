import { UserProfile } from '@/hooks/useSecureAuth';

/**
 * Determines the appropriate dashboard URL based on user authentication state
 * @param isAdmin - Whether the user has admin privileges
 * @param profile - User profile containing role information
 * @returns The appropriate dashboard URL path
 */
export const getDashboardUrl = (isAdmin: boolean, profile: UserProfile | null): string => {
  // Priority 1: Check if user has admin privileges
  // This takes precedence over the role field in the profile
  if (isAdmin) {
    return '/admin-panel';
  }

  // Priority 2: Check the role from profile
  const userRole = profile?.role?.toLowerCase();
  
  // Handle different role variations
  switch (userRole) {
    case 'merchant':
      return '/merchant';
    case 'customer':
    case 'user':
      return '/user';
    case 'admin':
      // This is a fallback in case isAdmin flag is false but role is admin
      // This shouldn't happen in normal circumstances
      console.warn('User has admin role but isAdmin flag is false');
      return '/admin-panel';
    default:
      // Default to user dashboard for any unknown roles
      return '/user';
  }
};

/**
 * Debug helper to log routing decisions
 */
export const debugDashboardRouting = (
  isAdmin: boolean, 
  profile: UserProfile | null,
  result: string
): void => {
  console.group('Dashboard Routing Debug');
  console.log('isAdmin:', isAdmin);
  console.log('Profile:', profile);
  console.log('Role:', profile?.role);
  console.log('Result URL:', result);
  console.groupEnd();
};