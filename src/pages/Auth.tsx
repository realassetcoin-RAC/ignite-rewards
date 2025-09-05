import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";

const Auth = () => {
  const { user, loading } = useSecureAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and user is authenticated, redirect to /user
    if (!loading && user) {
      navigate('/user', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, they will be redirected by the useEffect
  // This component should not render anything for authenticated users
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">
          This page is no longer available. Please use the authentication modal on the main page instead.
        </p>
        <button 
          onClick={() => navigate('/', { replace: true })}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
        >
          Go to Home Page
        </button>
      </div>
    </div>
  );
};

export default Auth;