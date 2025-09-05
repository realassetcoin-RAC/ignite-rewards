import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import AuthModal from "./AuthModal";
import CustomerSignupModal from "./CustomerSignupModal";
import MerchantSignupModal from "./MerchantSignupModal";
import { 
  Star, 
  TrendingUp, 
  Users, 
  Wallet, 
  LogOut, 
  User, 
  Settings, 
  Sparkles, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  Play,
  CheckCircle,
  Gift,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getDashboardUrl } from "@/lib/dashboard-routing";

const EnhancedHeroSection = () => {
  const { user, profile, isAdmin, signOut } = useSecureAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    setIsLoaded(true);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  // Use centralized dashboard routing logic
  const dashboardUrl = getDashboardUrl(isAdmin, profile);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/70 to-background/90" />
        
        {/* Interactive Mouse-Following Elements */}
        <div 
          className="absolute w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 200,
            top: mousePosition.y - 200,
            transform: isLoaded ? 'scale(1)' : 'scale(0)',
          }}
        />
        
        {/* Animated Background Elements with Enhanced Effects */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-primary/70 rounded-full animate-bounce animation-delay-7000"></div>
      </div>

      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PointBridge</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
                      <Settings className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-w-[90vw]" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none min-w-0">
                          <p className="font-medium text-sm truncate">{profile?.full_name || "User"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => {
                          console.log('Navigating to dashboard:', dashboardUrl);
                          console.log('isAdmin:', isAdmin);
                          console.log('profile:', profile);
                          navigate(dashboardUrl);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        My Dashboard
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => navigate('/admin-panel')}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('Sign In button clicked');
                    setAuthModalOpen(true);
                  }}
                  className="pointer-events-auto cursor-pointer"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-24">
        <div className="space-y-8">
          {/* Hero Badge with Animation */}

          {/* Main Headline with Enhanced Typography */}
          <div className="space-y-6">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight ${
              isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
            }`}>
              <span className="block mb-2">Bridge Your{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x inline-block">
                  Loyalty
                </span>
              </span>
              <span className="block">
                to{" "}
                <span className="bg-gradient-to-r from-blue-500 via-primary to-purple-500 bg-clip-text text-transparent animate-gradient-x-reverse inline-block">
                  Web3 Rewards
                </span>
              </span>
            </h1>
            <p className={`text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4 ${
              isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
            }`}>
              Earn cryptocurrency rewards, manage NFT loyalty cards, and unlock exclusive benefits 
              across a growing network of merchants. The future of loyalty is here.
            </p>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-8 px-4 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <Button 
              size="lg" 
              className="group text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
              onClick={() => setCustomerModalOpen(true)}
            >
              <Wallet className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-bounce" />
              Start Earning Rewards
              <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="group text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-background/60 backdrop-blur-md hover:bg-background/80 transform hover:scale-105 transition-all duration-300 border-primary/30 hover:border-primary/50 w-full sm:w-auto"
              onClick={() => setMerchantModalOpen(true)}
            >
              <TrendingUp className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
              Join as Merchant
              <Globe className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>

          {/* Enhanced Learn More Section */}
          <div className={`pt-6 ${isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'}`}>
            <div className="flex flex-col items-center space-y-4">
              <Button variant="ghost" asChild className="group relative z-20">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
                  <Play className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                  Watch Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  No Setup Fees
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-blue-500" />
                  Secure & Private
                </div>
                <div className="flex items-center">
                  <Gift className="h-4 w-4 mr-1 text-purple-500" />
                  Instant Rewards
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <div className={`mt-16 sm:mt-20 ${isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-background/30 to-background/10 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-300">
                  <Users className="h-8 w-8 text-primary group-hover:animate-bounce" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">10,000+</div>
              <div className="text-sm text-muted-foreground font-medium">Active Members</div>
              <div className="text-xs text-primary/70 mt-1">Growing daily</div>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-background/30 to-background/10 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                  <Star className="h-8 w-8 text-purple-500 group-hover:animate-pulse" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-muted-foreground font-medium">Partner Merchants</div>
              <div className="text-xs text-purple-500/70 mt-1">Worldwide network</div>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-background/30 to-background/10 backdrop-blur-md border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-primary/20 group-hover:from-blue-500/30 group-hover:to-primary/30 transition-all duration-300">
                  <Coins className="h-8 w-8 text-blue-500 group-hover:animate-spin" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">$2M+</div>
              <div className="text-sm text-muted-foreground font-medium">Rewards Distributed</div>
              <div className="text-xs text-blue-500/70 mt-1">And counting</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CustomerSignupModal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} />
      <MerchantSignupModal isOpen={merchantModalOpen} onClose={() => setMerchantModalOpen(false)} />
    </div>
  );
};

export default EnhancedHeroSection;