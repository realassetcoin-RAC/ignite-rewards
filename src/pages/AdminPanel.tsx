import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import ApiHealthTab from "@/components/admin/ApiHealthTab";
import ErrorDashboard from "@/components/admin/ErrorDashboard";
import RewardsManager from "@/components/admin/RewardsManager";
import MarketplaceManager from "@/components/admin/MarketplaceManager";
import LoyaltyProvidersManager from "@/components/admin/LoyaltyProvidersManager";
import DAOManager from "@/components/admin/DAOManager";
import TestDataManager from "@/components/admin/TestDataManager";
import TestRunner from "@/components/admin/TestRunner";
import AdminDashboardWrapper from "@/components/AdminDashboardWrapper";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { checkRateLimit, sanitizeErrorMessage } from "@/utils/validation";
import ErrorBoundary from "@/components/ErrorBoundary";
import UserNavigation from "@/components/UserNavigation";
import HomeNavigation from "@/components/HomeNavigation";
// Dev-only: load fix utilities for diagnostics without exposing in production
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
  ArrowLeft,
  Bug,
  Coins,
  Vote,
  Building2
} from "lucide-react";

const AdminPanel = () => {
  const { user, profile, isAdmin, loading, error, signOut } = useSecureAuth();
  const [stats, setStats] = useState({
    totalCards: 0,
    activeMerchants: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [revenueRange, setRevenueRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [revenueStats, setRevenueStats] = useState<{
    rangeRevenue: number;
    allTimeRevenue: number;
    topMerchants: Array<{ merchant_id: string; name: string; total: number }>;
  }>({ rangeRevenue: 0, allTimeRevenue: 0, topMerchants: [] });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState<{
    totalTransactions: number;
    totalVolume: number;
    averageValue: number;
    activeUsers: number;
    activeMerchants: number;
  }>({ totalTransactions: 0, totalVolume: 0, averageValue: 0, activeUsers: 0, activeMerchants: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('cards');
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasLoadedStatsRef = useRef(false);
  const hasShownWarningRef = useRef(false);

  // Dev-only: load fix utilities without exposing them in production builds
  useEffect(() => {
    if (import.meta?.env?.DEV) {
      (async () => {
        try {
          await Promise.all([
            import('@/utils/adminAuthFix'),
            import('@/utils/testAdminAccess'),
            import('@/utils/adminDashboardFix'),
            import('@/utils/adminDashboardLoadingFix'),
            import('@/utils/enhancedAdminLoading')
          ]);
        } catch (e) {
          console.warn('Dev fix utilities failed to load', e);
        }
      })();
    }
  }, []);

  useEffect(() => {
    // Only load stats if we have admin access - the wrapper handles auth checks
    if (!loading && user && isAdmin) {
      if (!hasLoadedStatsRef.current) {
        hasLoadedStatsRef.current = true;
        loadStats();
      }
      setIsLoaded(true);
      // Initialize revenue default range to last 30 days
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];
      setRevenueRange({ from: fromStr, to: toStr });
      setAnalyticsRange({ from: fromStr, to: toStr });
      // Preload revenue stats
      loadRevenueStats(fromStr, toStr);
      // Preload analytics stats
      loadAnalyticsStats(fromStr, toStr);
    } else if (!loading) {
      setIsLoaded(true);
    }
  }, [user?.id, isAdmin, loading]);

  // Smart data refresh - refreshes admin panel data when returning to app
  const refreshAdminData = async () => {
    console.log('🔄 Refreshing admin panel data...');
    if (user && isAdmin) {
      await loadStats();
    }
  };

  const loadRevenueStats = async (fromISODate: string, toISODate: string) => {
    try {
      setRevenueLoading(true);
      // Transactions within range
      const { data: rangeRows, error: rangeErr } = await supabase
        .from('loyalty_transactions')
        .select('transaction_amount, merchant_id, transaction_date')
        .gte('transaction_date', `${fromISODate}T00:00:00.000Z`)
        .lte('transaction_date', `${toISODate}T23:59:59.999Z`);
      if (rangeErr) {
        console.error('Error loading range revenue:', rangeErr);
      }
      const rangeRevenue = (rangeRows || []).reduce((sum: number, r: any) => sum + (Number(r.transaction_amount) || 0), 0);
      // Top merchants by revenue in range
      const byMerchant = new Map<string, number>();
      (rangeRows || []).forEach((r: any) => {
        const id = r.merchant_id;
        const amt = Number(r.transaction_amount) || 0;
        byMerchant.set(id, (byMerchant.get(id) || 0) + amt);
      });
      const top = Array.from(byMerchant.entries())
        .map(([merchant_id, total]) => ({ merchant_id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      // Fetch merchant names
      let namedTop: Array<{ merchant_id: string; name: string; total: number }> = top.map(t => ({ merchant_id: t.merchant_id, name: t.merchant_id?.slice(-8) || 'Merchant', total: t.total }));
      if (top.length > 0) {
        const ids = top.map(t => t.merchant_id);
        const { data: merchants, error: mErr } = await supabase
          .from('merchants')
          .select('id, business_name')
          .in('id', ids);
        if (!mErr && merchants) {
          const nameMap = new Map(merchants.map((m: any) => [m.id, m.business_name]));
          namedTop = top.map(t => ({ merchant_id: t.merchant_id, name: nameMap.get(t.merchant_id) || t.merchant_id?.slice(-8) || 'Merchant', total: t.total }));
        }
      }
      // All-time revenue
      const { data: allRows, error: allErr } = await supabase
        .from('loyalty_transactions')
        .select('transaction_amount');
      if (allErr) {
        console.error('Error loading all-time revenue:', allErr);
      }
      const allTimeRevenue = (allRows || []).reduce((sum: number, r: any) => sum + (Number(r.transaction_amount) || 0), 0);
      setRevenueStats({
        rangeRevenue: Math.round(rangeRevenue * 100) / 100,
        allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
        topMerchants: namedTop
      });
    } catch (e) {
      console.error('Unexpected error computing revenue stats:', e);
    } finally {
      setRevenueLoading(false);
    }
  };

  const loadAnalyticsStats = async (fromISODate: string, toISODate: string) => {
    try {
      setAnalyticsLoading(true);
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('user_id, merchant_id, transaction_amount, transaction_date')
        .gte('transaction_date', `${fromISODate}T00:00:00.000Z`)
        .lte('transaction_date', `${toISODate}T23:59:59.999Z`);
      if (error) throw error;
      const rows = data || [];
      const totalTransactions = rows.length;
      const totalVolume = rows.reduce((s: number, r: any) => s + (Number(r.transaction_amount) || 0), 0);
      const averageValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      const activeUsers = new Set(rows.map((r: any) => r.user_id).filter(Boolean)).size;
      const activeMerchants = new Set(rows.map((r: any) => r.merchant_id).filter(Boolean)).size;
      setAnalyticsStats({ totalTransactions, totalVolume, averageValue, activeUsers, activeMerchants });
    } catch (e) {
      console.error('Error loading analytics stats:', e);
      toast({ title: 'Error', description: 'Failed to load analytics stats', variant: 'destructive' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useSmartDataRefresh(refreshAdminData, {
    debounceMs: 3000, // 3 second debounce for admin data
    enabled: !loading && isAdmin,
    dependencies: [user?.id, isAdmin] // Refresh when user or admin status changes
  });

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
      // Initialize stats with defaults
      const newStats = {
        totalCards: 0,
        activeMerchants: 0,
        totalUsers: 0,
        totalRevenue: 0
      };

      // Get virtual cards count
      const { count: cardsCount, error: cardsError } = await supabase
        .from('virtual_cards')
        .select('*', { count: 'exact', head: true });

      if (cardsError) {
        console.error('Error loading virtual cards count:', cardsError);
      } else {
        newStats.totalCards = cardsCount || 0;
      }

      // Get active merchants count
      const { count: merchantsCount, error: merchantsError } = await supabase
        .from('merchants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (merchantsError) {
        console.error('Error loading merchants count:', merchantsError);
      } else {
        newStats.activeMerchants = merchantsCount || 0;
      }

      // Get total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error loading users count:', usersError);
      } else {
        newStats.totalUsers = usersCount || 0;
      }

      // Calculate revenue (placeholder for now)
      newStats.totalRevenue = 12450;

      // Update stats even if some queries failed
      setStats(newStats);
      
      // Show warning if some queries failed
      const failedQueries = [];
      if (cardsError) failedQueries.push('virtual cards');
      if (merchantsError) failedQueries.push('merchants');
      if (usersError) failedQueries.push('users');
      
      if (failedQueries.length > 0 && !hasShownWarningRef.current) {
        hasShownWarningRef.current = true;
        toast({
          title: "Warning",
          description: `Some statistics could not be loaded (${failedQueries.join(', ')}). Please check your permissions.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Unexpected error loading stats:', error);
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
    <div className="min-h-screen hero-gradient relative">
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
                  PointBridge
                </h1>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary hidden sm:inline-flex animate-pulse">
                Administrator
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <HomeNavigation variant="home" showText={true} />
              <UserNavigation />
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
          {/* Revenue Date Range */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Revenue From</span>
              <Input
                type="date"
                value={revenueRange.from}
                onChange={(e) => setRevenueRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">To</span>
              <Input
                type="date"
                value={revenueRange.to}
                onChange={(e) => setRevenueRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                onClick={() => revenueRange.from && revenueRange.to && loadRevenueStats(revenueRange.from, revenueRange.to)}
                disabled={revenueLoading || !revenueRange.from || !revenueRange.to}
                className="w-full sm:w-auto"
              >
                {revenueLoading ? 'Updating…' : 'Apply Revenue Range'}
              </Button>
            </div>
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
              <CardTitle className="text-sm font-medium">Revenue (Selected Range)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${revenueStats.rangeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>
        {/* All-time revenue and Top merchants */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="card-gradient border-primary/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-time Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${revenueStats.allTimeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Sum of all completed transactions</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 card-gradient border-primary/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Merchants (Selected Range)</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueStats.topMerchants.length === 0 ? (
                <div className="text-sm text-muted-foreground">No transactions in the selected range.</div>
              ) : (
                <div className="space-y-2">
                  {revenueStats.topMerchants.map((m) => (
                    <div key={m.merchant_id} className="flex items-center justify-between p-2 rounded-md bg-background/60 border border-primary/10">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{m.name}</span>
                        <Badge variant="outline" className="text-xs">…{m.merchant_id.slice(-6)}</Badge>
                      </div>
                      <div className="font-semibold">${m.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <div className="space-y-6">
          <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1" style={{overflowX: 'hidden', maxWidth: '100%'}}>
            <div className="flex flex-wrap w-full" style={{maxWidth: '100%'}}>
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'cards'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Virtual Cards</span>
                <span className="sm:hidden text-xs">Cards</span>
              </button>
              <button
                onClick={() => setActiveTab('merchants')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'merchants'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Store className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Merchants</span>
                <span className="sm:hidden text-xs">Shops</span>
              </button>
              <button
                onClick={() => setActiveTab('solana')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'solana'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Coins className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Rewards</span>
                <span className="sm:hidden text-xs">Rewards</span>
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Referrals</span>
                <span className="sm:hidden text-xs">Refs</span>
              </button>
              <button
                onClick={() => setActiveTab('dao')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'dao'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Vote className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">DAO</span>
                <span className="sm:hidden text-xs">DAO</span>
              </button>
              <button
                onClick={() => setActiveTab('test-data')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'test-data'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Test Data</span>
                <span className="sm:hidden text-xs">Test</span>
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'marketplace'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Marketplace</span>
                <span className="sm:hidden text-xs">Market</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Users</span>
                <span className="sm:hidden text-xs">Users</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Analytics</span>
                <span className="sm:hidden text-xs">Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'health'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Health</span>
                <span className="sm:hidden text-xs">Health</span>
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'errors'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Bug className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Errors</span>
                <span className="sm:hidden text-xs">Debug</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Settings</span>
                <span className="sm:hidden text-xs">Config</span>
              </button>
            </div>
          </div>

          {/* Cards Tab */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Virtual Card Management</h3>
                <p className="text-muted-foreground mb-6">
                  Create and manage virtual cards with different pricing tiers and features.
                </p>
                <ErrorBoundary>
                  <VirtualCardManager onStatsUpdate={loadStats} />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Merchants Tab */}
          {activeTab === 'merchants' && (
            <div className="space-y-6">
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
            </div>
          )}

          {/* Solana Rewards Tab */}
          {activeTab === 'solana' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Rewards Management</h3>
                <p className="text-muted-foreground mb-6">
                  Manage Solana contract features, rewards configuration, and anonymous user analytics.
                </p>
                <ErrorBoundary>
                  <RewardsManager />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
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
            </div>
          )}

          {/* DAO Tab */}
          {activeTab === 'dao' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">DAO Management</h3>
                <p className="text-muted-foreground mb-6">
                  Create and manage DAO organizations, proposals, and voting systems.
                </p>
                <ErrorBoundary>
                  <DAOManager />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Test Data Tab */}
          {activeTab === 'test-data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Test Data Management</h3>
                <p className="text-muted-foreground mb-6">
                  Generate comprehensive test data for all application models to enable thorough testing.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ErrorBoundary>
                    <TestDataManager />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <TestRunner />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Marketplace Management</h3>
                <p className="text-muted-foreground mb-6">
                  Manage tokenized assets, initiatives, and investment opportunities.
                </p>
                <ErrorBoundary>
                  <MarketplaceManager onStatsUpdate={loadStats} />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">User Management</h3>
              <p className="text-muted-foreground mb-6">
                View and manage user accounts and subscriptions.
              </p>
              <div className="space-y-6">
              <ErrorBoundary>
                <UserManager onStatsUpdate={loadStats} />
              </ErrorBoundary>
                <ErrorBoundary>
                  <LoyaltyProvidersManager />
                </ErrorBoundary>
              </div>
            </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
            <Card className="card-gradient border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Platform Analytics</span>
                </CardTitle>
                <CardDescription>
                  Transactions and engagement across the platform for the selected range.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From</span>
                    <Input type="date" value={analyticsRange.from} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, from: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">To</span>
                    <Input type="date" value={analyticsRange.to} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, to: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 flex items-center">
                    <Button
                      onClick={() => analyticsRange.from && analyticsRange.to && loadAnalyticsStats(analyticsRange.from, analyticsRange.to)}
                      disabled={analyticsLoading || !analyticsRange.from || !analyticsRange.to}
                    >
                      {analyticsLoading ? 'Updating…' : 'Apply'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Transactions</div><div className="text-2xl font-bold">{analyticsStats.totalTransactions}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Volume</div><div className="text-2xl font-bold">${analyticsStats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Avg Value</div><div className="text-2xl font-bold">${analyticsStats.averageValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Active Users</div><div className="text-2xl font-bold">{analyticsStats.activeUsers}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Active Merchants</div><div className="text-2xl font-bold">{analyticsStats.activeMerchants}</div></CardContent></Card>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">API Health</h3>
              <p className="text-muted-foreground mb-6">
                Live status of core APIs, RPCs, and database tables.
              </p>
              <ErrorBoundary>
                <ApiHealthTab />
              </ErrorBoundary>
            </div>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div className="space-y-6">
            <ErrorBoundary>
              <ErrorDashboard />
            </ErrorBoundary>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </main>
    </div>
    </AdminDashboardWrapper>
  );
};

export default AdminPanel;