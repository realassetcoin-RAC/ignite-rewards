import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/hooks/useSecureAuth';

/**
 * RoleBasedDashboard component that redirects users to the appropriate dashboard
 * based on their role (admin, merchant, customer/user)
 */
const RoleBasedDashboard = () => {
  const { user, profile, loading } = useSecureAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on user role
  const userRole = profile?.role;
  
  switch (userRole) {
    case 'admin':
      return <Navigate to="/admin-panel" replace />;
    case 'merchant':
      return <Navigate to="/merchant" replace />;
    case 'customer':
    case 'user':
    default:
      return <Navigate to="/user" replace />;
  }
};

export default RoleBasedDashboard;