import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Activity, 
  TrendingUp, 
  Share2, 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  LogOut,
  Star,
  Zap,
  Crown,
  Gift,
  Users,
  Award,
  Target
} from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import RewardsTracker from "@/components/solana/RewardsTracker";
import ThemeSelector from "@/components/ThemeSelector";
import BackgroundSelector, { BackgroundType } from "@/components/backgrounds/BackgroundSelector";
import BackgroundRenderer from "@/components/backgrounds/BackgroundRenderer";

const UserDashboardWithBackgrounds = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const { toast } = useToast();
  const { currentTheme, themes } = useTheme();
  const [activeSection, setActiveSection] = useState<'overview' | 'loyalty' | 'referrals' | 'rewards'>('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<BackgroundType>('cosmic');

  const theme = themes[currentTheme];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      // Force redirect to home page after signout
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      // Still redirect even if there's an error
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  // Smart data refresh - refreshes component data when returning to app
  const refreshDashboardData = async () => {
    console.log('🔄 Refreshing dashboard data...');
    setIsLoaded(false);
    setTimeout(() => setIsLoaded(true), 100);
  };

  useSmartDataRefresh(refreshDashboardData, {
    debounceMs: 2000,
    enabled: true,
    dependencies: [user?.id]
  });

  useEffect(() => {
    setIsLoaded(true);
    // Load saved background preference
    const savedBackground = localStorage.getItem('user-background') as BackgroundType;
    if (savedBackground) {
      setCurrentBackground(savedBackground);
    }
  }, []);

  const handleBackgroundChange = (background: BackgroundType) => {
    setCurrentBackground(background);
    localStorage.setItem('user-background', background);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-r-blue-500/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <BackgroundRenderer backgroundType={currentBackground} />
      
      {/* Header */}
      <header className="relative z-50 border-b bg-black/20 backdrop-blur-xl border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    PointBridge
                  </h1>
                  <p className="text-sm text-gray-400">Your Digital Rewards Hub</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Information */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Welcome,</span>
                  <span className="font-medium text-white">{user?.email}</span>
                </div>
              </div>
              
              <BackgroundSelector 
                currentBackground={currentBackground}
                onBackgroundChange={handleBackgroundChange}
              />
              
              <ThemeSelector />
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300"
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300"
              >
                <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Fixed Loyalty Card Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Loyalty Card - Fixed Position */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Loyalty Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">
                    Your digital loyalty card
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">1,250</span>
                    <span className="text-sm text-gray-300">points</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Progress to Gold</span>
                      <span className="text-gray-300">75%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-300">Total Points</p>
                        <p className="text-lg font-bold text-white">1,250</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-300">This Month</p>
                        <p className="text-lg font-bold text-white">+320</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Welcome to Your Dashboard
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Discover, earn, and redeem rewards across your favorite merchants
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'referrals', label: 'Referrals', icon: Share2 },
                { id: 'rewards', label: 'Rewards', icon: Coins }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeSection === tab.id ? "default" : "outline"}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`flex items-center space-x-2 ${
                    activeSection === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      : "bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/15"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* Main Content */}
            <div>
              {activeSection === 'overview' && (
                <div className="space-y-8">
                  <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Earned 50 points at Coffee Shop</p>
                            <p className="text-gray-300 text-sm">2 hours ago</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            +50 pts
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                            <Gift className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Redeemed free coffee</p>
                            <p className="text-gray-300 text-sm">Yesterday</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Redeemed
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Referred a friend</p>
                            <p className="text-gray-300 text-sm">3 days ago</p>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            +100 pts
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'referrals' && <ReferralsTab />}
              {activeSection === 'rewards' && user && <RewardsTracker userId={user.id} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboardWithBackgrounds;
