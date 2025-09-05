import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/hooks/useSecureAuth';

/**
 * RoleBasedDashboard component that redirects users to the appropriate dashboard
 * based on their role (admin, merchant, customer/user)
 */
const RoleBasedDashboard = () => {
  const { user, profile, loading, isAdmin } = useSecureAuth();

  // Enhanced debugging for admin routing issues
  console.group('🔍 RoleBasedDashboard Debug');
  console.log('User:', user?.email);
  console.log('Profile:', profile);
  console.log('isAdmin flag:', isAdmin);
  console.log('Profile role:', profile?.role);
  console.log('Loading:', loading);
  console.groupEnd();

  // Show loading state while authentication is being checked
  if (loading) {
    console.log('RoleBasedDashboard: Still loading authentication...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    console.log('RoleBasedDashboard: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Priority 1: Check if user has admin privileges
  // This takes precedence over the role field in the profile
  if (isAdmin === true) {
    console.log('🎯 RoleBasedDashboard: Redirecting to admin panel (isAdmin flag is true)');
    return <Navigate to="/admin-panel" replace />;
  }

  // Priority 2: Check the role from profile
  const userRole = profile?.role?.toLowerCase();
  console.log('🔍 RoleBasedDashboard: Checking role-based routing');
  console.log('User role (lowercase):', userRole);
  
  // Also check for admin/administrator role variations in profile
  if (userRole === 'admin' || userRole === 'administrator') {
    console.log('🎯 RoleBasedDashboard: Redirecting to admin panel (role is admin/administrator)');
    return <Navigate to="/admin-panel" replace />;
  }
  
  // Handle other role variations
  switch (userRole) {
    case 'merchant':
      console.log('🎯 RoleBasedDashboard: Redirecting to merchant dashboard');
      return <Navigate to="/merchant" replace />;
    case 'customer':
    case 'user':
      console.log('🎯 RoleBasedDashboard: Redirecting to user dashboard');
      return <Navigate to="/user" replace />;
    default:
      // Default to user dashboard for any unknown roles
      console.log('⚠️ RoleBasedDashboard: Unknown role, redirecting to user dashboard (default)');
      console.log('Available data:', { 
        isAdmin, 
        userRole, 
        originalRole: profile?.role,
        userEmail: user?.email 
      });
      return <Navigate to="/user" replace />;
  }
};

export default RoleBasedDashboard;