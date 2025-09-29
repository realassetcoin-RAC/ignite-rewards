import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const { user, loading } = useSecureAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Auto-redirect to home page after a short delay
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    // If not loading and user is authenticated, redirect to /user
    if (!loading && user) {
      navigate('/user', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

        <div className="relative z-10 text-center text-white">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, they will be redirected by the useEffect
  // This component should not render anything for authenticated users
  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      <div className="relative z-10 text-center text-white max-w-md mx-auto p-6 card-gradient border-primary/20 backdrop-blur-md rounded-lg">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className={`text-2xl font-bold mb-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
        }`}>
          Authentication Required
        </h1>
        <p className={`mb-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          Please sign in to access your account. You can use the sign-in button on the main page.
        </p>
        <button 
          onClick={() => navigate('/', { replace: true })}
          className={`px-6 py-2 rounded-lg border transform hover:scale-105 transition-all duration-300 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}
        >
          Go to Home Page
        </button>
        <p className={`text-sm mt-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          Redirecting automatically in 3 seconds...
        </p>
      </div>
    </div>
  );
};

export default Auth;