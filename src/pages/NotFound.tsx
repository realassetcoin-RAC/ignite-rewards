import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    setIsLoaded(true);
  }, [location.pathname]);

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

      <div className="relative z-10 text-center text-white max-w-md mx-auto p-8 card-gradient border-primary/20 backdrop-blur-md rounded-lg">
        <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-primary-foreground animate-pulse" />
        </div>
        <h1 className={`text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent ${
          isLoaded ? 'animate-fade-in-up' : 'opacity-0'
        }`}>
          404
        </h1>
        <p className={`text-xl text-white/80 mb-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
        }`}>
          Oops! Page not found
        </p>
        <p className={`text-sm text-white/60 mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className={`inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-primary-foreground px-6 py-3 rounded-lg transform hover:scale-105 transition-all duration-300 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
