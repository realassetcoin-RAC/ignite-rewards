import { UserProfile } from '@/hooks/useSecureAuth';

/**
 * Determines the appropriate dashboard URL based on user authentication state
 * @param isAdmin - Whether the user has admin privileges
 * @param profile - User profile containing role information
 * @returns The appropriate dashboard URL path
 */
export const getDashboardUrl = (isAdmin: boolean, profile: UserProfile | null): string => {
  // Log for debugging
  console.group('Dashboard Routing Decision');
  console.log('isAdmin flag:', isAdmin);
  console.log('Profile:', profile);
  console.log('Role from profile:', profile?.role);
  
  // Priority 1: Check if user has admin privileges
  // This takes precedence over the role field in the profile
  if (isAdmin === true) {
    console.log('Decision: Admin dashboard (isAdmin flag is true)');
    console.groupEnd();
    return '/admin-panel';
  }

  // Priority 2: Check the role from profile
  const userRole = profile?.role?.toLowerCase();
  
  // Also check for admin/administrator role variations in profile
  if (userRole === 'admin' || userRole === 'administrator') {
    console.log('Decision: Admin dashboard (role is admin/administrator)');
    console.groupEnd();
    return '/admin-panel';
  }
  
  // Handle other role variations
  switch (userRole) {
    case 'merchant':
      console.log('Decision: Merchant dashboard');
      console.groupEnd();
      return '/merchant';
    case 'customer':
    case 'user':
      console.log('Decision: User dashboard');
      console.groupEnd();
      return '/user';
    default:
      // Default to user dashboard for any unknown roles
      console.log('Decision: User dashboard (default)');
      console.groupEnd();
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