import { useState } from "react";
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
import { Star, TrendingUp, Users, Wallet, LogOut, User, Settings, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EnhancedHeroSection = () => {
  const { user, profile, isAdmin, signOut } = useSecureAuth();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);

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

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background with Animated Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/80 to-background/95" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
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
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">{profile?.full_name || "User"}</p>
                          <p className="w-[200px] truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="/user" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          My Dashboard
                        </a>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <a href="/admin-panel" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </a>
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
                <Button variant="outline" onClick={() => setAuthModalOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Hero Badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className="px-4 py-2 text-sm bg-background/50 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Next-Generation Loyalty Platform
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Bridge Your{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Loyalty
              </span>
              <br />
              to Web3 Rewards
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Earn cryptocurrency rewards, manage NFT loyalty cards, and unlock exclusive benefits 
              across a growing network of merchants. The future of loyalty is here.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg" 
              className="text-base px-8 py-3 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-200"
              onClick={() => setCustomerModalOpen(true)}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Start Earning Rewards
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-8 py-3 bg-background/50 backdrop-blur-sm hover:bg-background/80 transform hover:scale-105 transition-all duration-200"
              onClick={() => setMerchantModalOpen(true)}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Join as Merchant
            </Button>
          </div>

          {/* Learn More Link */}
          <div className="pt-4">
            <Button variant="ghost" asChild>
              <a href="#features" className="text-muted-foreground hover:text-foreground">
                Learn More About Features ↓
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-background/20 backdrop-blur-sm border border-border/50">
              <div className="flex justify-center mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">10,000+</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-background/20 backdrop-blur-sm border border-border/50">
              <div className="flex justify-center mb-3">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Partner Merchants</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-background/20 backdrop-blur-sm border border-border/50">
              <div className="flex justify-center mb-3">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">$2M+</div>
              <div className="text-sm text-muted-foreground">Rewards Distributed</div>
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