import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import HomeNavigation from "./HomeNavigation";
import UserNavigation from "./UserNavigation";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showNavigation?: boolean;
  className?: string;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true,
  showNavigation = true,
  className = ""
}: PageHeaderProps) => {
  const { user } = useSecureAuth();

  return (
    <header className={`relative z-50 border-b bg-background/80 backdrop-blur-xl border-border/50 ${className}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src="/bridgepoint-logo.jpg" 
                  alt="BridgePoint Logo" 
                  className="w-12 h-12 rounded-lg object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider bg-gradient-to-b from-orange-400 via-yellow-400 to-purple-600 bg-clip-text text-transparent drop-shadow-lg" style={{
                  textShadow: '0 0 20px rgba(255, 165, 0, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)',
                  filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.4))',
                  fontFamily: '"Orbitron", "Briza BC", "Briza", system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.15em',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}>
                  {title || "PointBridge"}
                </h1>
                {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
              </div>
            </Link>
          </div>

          {/* Right side - Navigation */}
          <div className="flex items-center space-x-4">
            {showNavigation && (
              <>
                {user && <HomeNavigation variant="home" showText={true} />}
                <UserNavigation />
              </>
            )}
            {showBackButton && !user && (
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="group transform hover:scale-105 transition-all duration-300"
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;

