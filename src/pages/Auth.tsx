import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const { user, loading } = useSecureAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    setIsLoaded(true);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // If not loading and user is authenticated, redirect to /user
    if (!loading && user) {
      navigate('/user', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Dynamic Background - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/70 to-background/90" />
          
          {/* Animated Gradient Orbs */}
          <div 
            className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)`,
              filter: 'blur(60px)',
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            }}
          />
          <div 
            className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary-glow) / 0.2) 0%, transparent 70%)`,
              filter: 'blur(80px)',
              transform: `translate(${-mousePosition.x * 0.03}px, ${-mousePosition.y * 0.03}px)`,
            }}
          />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        </div>

        <div className="relative z-10 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-all duration-500 ${
            isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
            boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.5)',
          }}>
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`text-lg font-medium text-foreground ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, they will be redirected by the useEffect
  // This component should not render anything for authenticated users
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Dynamic Background - matching home page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/70 to-background/90" />
        
        {/* Animated Gradient Orbs */}
        <div 
          className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary-glow) / 0.2) 0%, transparent 70%)`,
            filter: 'blur(80px)',
            transform: `translate(${-mousePosition.x * 0.03}px, ${-mousePosition.y * 0.03}px)`,
          }}
        />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4">
          <div className={`w-3 h-3 rounded-full bg-primary/40 ${isLoaded ? 'animate-float' : 'opacity-0'}`} />
        </div>
        <div className="absolute top-3/4 right-1/4">
          <div className={`w-2 h-2 rounded-full bg-primary-glow/50 ${isLoaded ? 'animate-float animation-delay-2000' : 'opacity-0'}`} />
        </div>
        <div className="absolute bottom-1/4 left-3/4">
          <div className={`w-4 h-4 rounded-full bg-primary/30 ${isLoaded ? 'animate-float animation-delay-4000' : 'opacity-0'}`} />
        </div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto p-8">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-all duration-500 ${
            isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
            boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.5)',
          }}>
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className={`text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent ${
            isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
          }`}>
            Access Denied
          </h1>
          
          <p className={`text-muted-foreground mb-8 ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
            This page is no longer available. Please use the authentication modal on the main page instead.
          </p>
          
          <button 
            onClick={() => navigate('/', { replace: true })}
            className={`relative px-8 py-3 font-medium rounded-xl overflow-hidden group transition-all duration-300 transform hover:scale-105 ${
              isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
            }`}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
            }}
          >
            <span className="relative z-10 text-primary-foreground">Go to Home Page</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;