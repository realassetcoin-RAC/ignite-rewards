import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import VirtualCardManager from "@/components/admin/VirtualCardManager";
import MerchantManager from "@/components/admin/MerchantManager";
import ReferralCampaignManager from "@/components/admin/ReferralCampaignManager";
import ReferralManager from "@/components/admin/ReferralManager";
import SubscriptionPlanManager from "@/components/admin/SubscriptionPlanManager";
import UserManager from "@/components/admin/UserManager";
import AdminDashboardWrapper from "@/components/AdminDashboardWrapper";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { checkRateLimit, sanitizeErrorMessage } from "@/utils/validation";
import ErrorBoundary from "@/components/ErrorBoundary";
// Import the fix utilities (makes them available globally)
import "@/utils/adminAuthFix";
import "@/utils/testAdminAccess";
import "@/utils/adminDashboardFix";
import "@/utils/adminDashboardLoadingFix";
import { 
  Shield, 
  CreditCard, 
  Store, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Home,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ArrowLeft
} from "lucide-react";

const AdminPanel = () => {
  const { user, profile, isAdmin, loading, error, signOut } = useSecureAuth();
  const [stats, setStats] = useState({
    totalCards: 0,
    activeMerchants: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Only load stats if we have admin access - the wrapper handles auth checks
    if (!loading && user && isAdmin) {
      loadStats();
    }
    setIsLoaded(true);
  }, [user, isAdmin, loading]);

  // Rate limiting for stats loading
  const loadStats = async () => {
    if (!checkRateLimit('loadStats', 5, 60000)) {
      toast({
        title: "Rate Limited",
        description: "Too many requests. Please wait before trying again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get virtual cards count
      const { count: cardsCount, error: cardsError } = await supabase
        .from('virtual_cards')
        .select('*', { count: 'exact', head: true });

      if (cardsError) throw cardsError;

      // Get active merchants count
      const { count: merchantsCount, error: merchantsError } = await supabase
        .from('merchants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (merchantsError) throw merchantsError;

      // Get total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      setStats({
        totalCards: cardsCount || 0,
        activeMerchants: merchantsCount || 0,
        totalUsers: usersCount || 0,
        totalRevenue: 12450 // Placeholder - would come from real revenue calculation
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error Loading Statistics",
        description: sanitizeErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Sign Out Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  return (
    <AdminDashboardWrapper>
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className={`text-lg sm:text-2xl font-bold text-foreground truncate ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}>
                  PointBridge Admin
                </h1>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary hidden sm:inline-flex animate-pulse">
                Administrator
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
                }`}
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name || user?.email}
          </h2>
          <p className="text-xl text-muted-foreground">
            Manage your PointBridge ecosystem from this central dashboard.
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Role: {isAdmin ? 'admin' : (profile?.role || 'user')}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600">
              Secure Session Active
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Virtual Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{stats.totalCards}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
              <Store className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">{stats.activeMerchants}</div>
              <p className="text-xs text-muted-foreground">+5 from last month</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+12 from last month</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="cards" className="flex items-center space-x-1 px-2 py-1.5">
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Virtual Cards</span>
              <span className="sm:hidden text-xs">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="merchants" className="flex items-center space-x-1 px-2 py-1.5">
              <Store className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Merchants</span>
              <span className="sm:hidden text-xs">Shops</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center space-x-1 px-2 py-1.5">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Referrals</span>
              <span className="sm:hidden text-xs">Refs</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-1 px-2 py-1.5">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-1 px-2 py-1.5">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden text-xs">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1 px-2 py-1.5">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden text-xs">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Virtual Card Management</h3>
              <p className="text-muted-foreground mb-6">
                Create and manage virtual cards with different pricing tiers and features.
              </p>
              <ErrorBoundary>
                <VirtualCardManager onStatsUpdate={loadStats} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="merchants" className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Merchant Management</h3>
              <p className="text-muted-foreground mb-6">
                Manage merchant partnerships and subscription plans.
              </p>
              <div className="space-y-6">
                <ErrorBoundary>
                  <MerchantManager onStatsUpdate={loadStats} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <SubscriptionPlanManager />
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Referral Programs</h3>
              <p className="text-muted-foreground mb-6">
                Create and manage referral campaigns and rewards.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ErrorBoundary>
                  <ReferralCampaignManager />
                </ErrorBoundary>
                <ErrorBoundary>
                  <ReferralManager />
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">User Management</h3>
              <p className="text-muted-foreground mb-6">
                View and manage user accounts and subscriptions.
              </p>
              <ErrorBoundary>
                <UserManager onStatsUpdate={loadStats} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="card-gradient border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Platform Analytics</span>
                </CardTitle>
                <CardDescription>
                  Detailed insights into platform performance and user engagement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">Analytics Dashboard</h4>
                  <p className="text-muted-foreground">
                    Advanced analytics and reporting features will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="card-gradient border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>System Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure platform settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">System Configuration</h4>
                  <p className="text-muted-foreground">
                    Platform settings and configuration options will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </AdminDashboardWrapper>
  );
};

export default AdminPanel;