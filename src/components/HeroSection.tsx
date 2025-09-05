import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import pointbridgeLogo from "@/assets/pointbridge-logo.png";
import AuthModal from "@/components/AuthModal";
import CustomerSignupModal from "@/components/CustomerSignupModal";
import MerchantSignupModal from "@/components/MerchantSignupModal";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { LogOut, User, Settings, Shield } from "lucide-react";

/**
 * Hero section component that displays the main landing page content
 * Features user authentication status, call-to-action buttons, and key statistics
 * @returns {JSX.Element} The hero section component
 */
const HeroSection = () => {
  // Modal state management
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);
  
  // Authentication hook
  const { user, signOut, profile, isAdmin } = useSecureAuth();

  /**
   * Handle user sign out with error handling
   */
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  /**
   * Get user initials for avatar display
   * @returns {string} First letters of name or email
   */
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };
  return (
    <section className="relative overflow-hidden">
      <div className="hero-gradient absolute inset-0 opacity-90" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center text-white">
          {/* Enhanced Authentication UI */}
          <div className="absolute top-4 right-6 z-20 flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Welcome Message */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-white">
                    Welcome back!
                  </span>
                  <span className="text-xs text-white/70">
                    {profile?.full_name || user.email}
                  </span>
                </div>
                
                {/* User Status Badge */}
                <Badge 
                  variant="outline" 
                  className="border-primary/40 text-primary bg-primary/10 backdrop-blur-sm"
                >
                  {isAdmin ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Member
                    </>
                  )}
                </Badge>

                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 transition-smooth"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-56 bg-card/95 backdrop-blur-sm border-border/50"
                    align="end"
                    forceMount
                  >
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="/user">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Dashboard</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Sign In Button for Unauthenticated Users */
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth font-medium"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </Button>
            )}
          </div>
          <div className="flex items-center justify-center mb-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 mr-4">
              <img 
                src={pointbridgeLogo} 
                alt="PointBridge Logo" 
                className="h-12 lg:h-16"
              />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <span className="text-primary">Point</span>Bridge
            </h1>
          </div>
          
          <h2 className="text-2xl lg:text-4xl font-bold mb-6 leading-tight">
            The Future of Value <span className="text-primary">Is Here</span>
          </h2>
          
          <p className="text-xl lg:text-2xl mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
            Join our decentralized rewards ecosystem where your engagement earns $RAC tokens, 
            unlock passive income opportunities, and become a stakeholder in the future of loyalty programs.
          </p>
          
          {/* Enhanced Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex gap-3">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-4 h-auto font-semibold"
                onClick={() => setCustomerModalOpen(true)}
              >
                Join as Customer
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 h-auto border-primary/40 text-primary hover:bg-primary/10 backdrop-blur-sm transition-smooth font-semibold"
                onClick={() => setMerchantModalOpen(true)}
              >
                Partner with Us
              </Button>
            </div>
            <a href="#how-it-works">
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-lg px-6 py-4 h-auto text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
              >
                Learn More
              </Button>
            </a>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm opacity-80">Active Stakeholders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2M+</div>
              <div className="text-sm opacity-80">$RAC Tokens Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm opacity-80">Partner Merchants</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Authentication and Signup Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CustomerSignupModal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} />
      <MerchantSignupModal isOpen={merchantModalOpen} onClose={() => setMerchantModalOpen(false)} />
    </section>
  );
};

export default HeroSection;