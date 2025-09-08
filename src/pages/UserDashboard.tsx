import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
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
  Target,
  Building2
} from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import RewardsTracker from "@/components/solana/RewardsTracker";
import LoyaltyAccountLinking from "@/components/LoyaltyAccountLinking";
import PointConversionSystem from "@/components/PointConversionSystem";
import MarketplaceMain from "@/components/marketplace/MarketplaceMain";

const UserDashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'loyalty' | 'loyalty-networks' | 'referrals' | 'rewards' | 'marketplace'>('overview');
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Smart data refresh - refreshes component data when returning to app
  const refreshDashboardData = async () => {
    console.log('🔄 Refreshing dashboard data...');
    // Here you would typically refetch data from APIs
    // For now, we'll just log the refresh
    setIsLoaded(false);
    setTimeout(() => setIsLoaded(true), 100); // Simulate data refresh
  };

  useSmartDataRefresh(refreshDashboardData, {
    debounceMs: 2000, // 2 second debounce
    enabled: true,
    dependencies: [user?.id] // Refresh when user changes
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full animate-float-delayed-2 pointer-events-none"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Ambient Light Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b bg-black/20 backdrop-blur-xl border-white/10">
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
                  <h1 className={`text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}>
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
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
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
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'
                }`}
              >
                <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className={`text-center space-y-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Welcome to Your Dashboard
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover, earn, and redeem rewards across your favorite merchants
          </p>
        </div>

        {/* Quick Actions - Enhanced Design */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <Card 
            onClick={() => setActiveSection('loyalty')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                Loyalty Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Manage your digital loyalty cards and track your progress
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">1,250</span>
                <span className="text-sm text-gray-400">points</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('loyalty-networks')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  Link & Convert
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-orange-200 transition-colors">
                Loyalty Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Link your third-party loyalty accounts and convert points
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">0</span>
                <span className="text-sm text-gray-400">linked</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('referrals')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                  Earn More
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Invite friends and earn bonus rewards together
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">12</span>
                <span className="text-sm text-gray-400">referrals</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('rewards')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  Available
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors">
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Browse and redeem your earned rewards
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">8</span>
                <span className="text-sm text-gray-400">available</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('marketplace')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                  Invest
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
                Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Invest in tokenized assets and earn passive income
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">3</span>
                <span className="text-sm text-gray-400">opportunities</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-white">1,250</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">+320</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="text-2xl font-bold text-white">Gold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Streak</p>
                  <p className="text-2xl font-bold text-white">7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
        }`}>
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
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
                        <p className="text-gray-400 text-sm">2 hours ago</p>
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
                        <p className="text-gray-400 text-sm">Yesterday</p>
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
                        <p className="text-gray-400 text-sm">3 days ago</p>
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

          {activeSection === 'loyalty' && <LoyaltyCardTab />}
          {activeSection === 'loyalty-networks' && (
            <div className="space-y-8">
              <LoyaltyAccountLinking />
              <PointConversionSystem />
            </div>
          )}
          {activeSection === 'referrals' && <ReferralsTab />}
          {activeSection === 'rewards' && user && <RewardsTracker userId={user.id} />}
          {activeSection === 'marketplace' && <MarketplaceMain />}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;

