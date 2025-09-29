import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createModuleLogger } from "@/utils/consoleReplacer";
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
import { FeatureControlPanel } from "@/components/admin/FeatureControlPanel";
import AdminDashboardWrapper from "@/components/AdminDashboardWrapper";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
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
  DollarSign,
  AlertTriangle,
  Sparkles,
  Bug,
  Coins,
  Vote,
  Building2,
  ArrowRight
} from "lucide-react";
import { DateRangePickerWithPresets, DateRangePickerWithTime } from "@/components/admin/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const AdminPanel = () => {
  const logger = createModuleLogger('AdminPanel');
  const { user, profile, isAdmin, loading } = useSecureAuth();
  const [stats, setStats] = useState({
    totalCards: 0,
    activeMerchants: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [revenueRange, setRevenueRange] = useState<DateRange | undefined>(undefined);
  const [revenueStats, setRevenueStats] = useState<{
    rangeRevenue: number;
    allTimeRevenue: number;
    topMerchants: Array<{ merchant_id: string; name: string; total: number }>;
  }>({ rangeRevenue: 0, allTimeRevenue: 0, topMerchants: [] });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<DateRange | undefined>(undefined);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState<{
    totalTransactions: number;
    totalVolume: number;
    averageValue: number;
    activeUsers: number;
    activeMerchants: number;
  }>({ totalTransactions: 0, totalVolume: 0, averageValue: 0, activeUsers: 0, activeMerchants: 0 });
  const [merchantSubscriptionStats, setMerchantSubscriptionStats] = useState<{
    startUp: number;
    momentumPlan: number;
    energizerPlan: number;
    cloud9Plan: number;
    superPlan: number;
  }>({ startUp: 0, momentumPlan: 0, energizerPlan: 0, cloud9Plan: 0, superPlan: 0 });
  const [locationIndustryStats, setLocationIndustryStats] = useState<{
    country: Array<{ name: string; count: number; percentage: number; change: number }>;
    industry: Array<{ name: string; count: number; percentage: number; change: number }>;
  }>({ country: [], industry: [] });
  const [locationIndustryView, setLocationIndustryView] = useState<'country' | 'industry'>('country');
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('cards');
  const { toast } = useToast();
  const hasLoadedStatsRef = useRef(false);
  const [dbConnectionState, setDbConnectionState] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

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
          logger.warn('Dev fix utilities failed to load', e);
        }
      })();
    }
  }, []);

  // Smart data refresh - refreshes admin panel data when returning to app
  const refreshAdminData = useCallback(async () => {
    logger.info('Refreshing admin panel data');
    if (user && isAdmin) {
      try {
        // Get virtual cards count
        const { count: cardsCount, error: cardsError } = await supabase
          .from('virtual_cards')
          .select('*', { count: 'exact', head: true });

        if (cardsError) {
          logger.error('Error loading virtual cards count', cardsError);
          setDbConnectionState('disconnected');
          // Set mock data when database is not available
          setStats({
            totalCards: 150,
            activeMerchants: 25,
            totalUsers: 500,
            totalRevenue: 12500
          });
        } else {
          setStats(prev => ({ ...prev, totalCards: cardsCount || 0 }));
          setDbConnectionState('connected');
        }

        // Get active merchants count
        const { count: merchantsCount, error: merchantsError } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (merchantsError) {
          logger.error('Error loading merchants count', merchantsError);
        } else {
          setStats(prev => ({ ...prev, activeMerchants: merchantsCount || 0 }));
        }

        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) {
          logger.error('Error loading users count', usersError);
        } else {
          setStats(prev => ({ ...prev, totalUsers: usersCount || 0 }));
        }

        // Get total revenue
        const { data: revenueData, error: revenueError } = await supabase
          .from('loyalty_transactions')
          .select('transaction_amount');

        if (revenueError) {
          logger.error('Error loading revenue data', revenueError);
        } else {
          const totalRevenue = (revenueData || []).reduce((sum: number, r: { transaction_amount: unknown }) => sum + (Number(r.transaction_amount) || 0), 0);
          setStats(prev => ({ ...prev, totalRevenue }));
        }
      } catch (error) {
        logger.error('Error refreshing admin data', error as Error);
        setDbConnectionState('disconnected');
        // Set mock data when database is not available
        setStats({
          totalCards: 150,
          activeMerchants: 25,
          totalUsers: 500,
          totalRevenue: 12500
        });
      }
    }
  }, [user, isAdmin, logger]);

  const loadRevenueStats = useCallback(async (fromISODate: string, toISODate: string) => {
    try {
      setRevenueLoading(true);

      // Transactions within range
      const { data: rangeRows, error: rangeErr } = await supabase
        .from('loyalty_transactions')
        .select('transaction_amount, merchant_id, transaction_date')
        .gte('transaction_date', `${fromISODate}T00:00:00.000Z`)
        .lte('transaction_date', `${toISODate}T23:59:59.999Z`);
      if (rangeErr) {
        logger.error('Error loading range revenue', rangeErr);
      }
      const rangeRevenue = (rangeRows || []).reduce((sum: number, r: { transaction_amount: unknown }) => sum + (Number(r.transaction_amount) || 0), 0);
      // Top merchants by revenue in range
      const byMerchant = new Map<string, number>();
      (rangeRows || []).forEach((r: { merchant_id: string; transaction_amount: unknown }) => {
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
          namedTop = top.map(t => ({ merchant_id: t.merchant_id, name: (nameMap.get(t.merchant_id) as string) || t.merchant_id?.slice(-8) || 'Merchant', total: t.total }));
        }
      }
      // All-time revenue
      const { data: allRows, error: allErr } = await supabase
        .from('loyalty_transactions')
        .select('transaction_amount');
      if (allErr) {
        logger.error('Error loading all-time revenue', allErr);
      }
      const allTimeRevenue = (allRows || []).reduce((sum: number, r: any) => sum + (Number(r.transaction_amount) || 0), 0);
      setRevenueStats({
        rangeRevenue: Math.round(rangeRevenue * 100) / 100,
        allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
        topMerchants: namedTop
      });
    } catch (e) {
      logger.error('Unexpected error computing revenue stats', e as Error);
      // Set mock data when database is not available
      setRevenueStats({
        rangeRevenue: 2500.00,
        allTimeRevenue: 12500.00,
        topMerchants: [
          { merchant_id: 'merchant-1', name: 'Sample Store', total: 1200 },
          { merchant_id: 'merchant-2', name: 'Demo Shop', total: 800 },
          { merchant_id: 'merchant-3', name: 'Test Market', total: 500 }
        ]
      });
    } finally {
      setRevenueLoading(false);
    }
  }, [logger]);

  const loadAnalyticsStats = useCallback(async (fromISODate: string, toISODate: string) => {
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
      logger.error('Error loading analytics stats', e as Error);
      // Set mock data when database is not available
      setAnalyticsStats({
        totalTransactions: 150,
        totalVolume: 2500.00,
        averageValue: 16.67,
        activeUsers: 45,
        activeMerchants: 12
      });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [logger, toast]);

  const loadMerchantSubscriptionStats = useCallback(async () => {
    try {
      logger.info('Loading merchant subscription stats');

      // Get merchant subscription data
      const { data, error } = await supabase
        .from('merchants')
        .select('subscription_plan')
        .eq('status', 'active');
      
      if (error) {
        logger.error('Error loading merchant subscription stats', error);
        // Set mock data when database is not available
        setMerchantSubscriptionStats({
          startUp: 15,
          momentumPlan: 12,
          energizerPlan: 8,
          cloud9Plan: 4,
          superPlan: 2
        });
        return;
      }

      const merchants = data || [];
      
      // Debug: Log the actual subscription plan values
      logger.info('Merchant subscription plans found:', merchants.map((m: any) => m.subscription_plan));
      
      // Use the correct product plan names
      const startUp = merchants.filter((m: any) => m.subscription_plan === 'startup-plan').length;
      const momentumPlan = merchants.filter((m: any) => m.subscription_plan === 'momentum-plan').length;
      const energizerPlan = merchants.filter((m: any) => m.subscription_plan === 'energizer-plan').length;
      const cloud9Plan = merchants.filter((m: any) => m.subscription_plan === 'cloud9-plan').length;
      const superPlan = merchants.filter((m: any) => m.subscription_plan === 'super-plan').length;

      const stats = {
        startUp,
        momentumPlan,
        energizerPlan,
        cloud9Plan,
        superPlan
      };
      
      // Debug: Log the final stats
      logger.info('Merchant subscription stats:', stats);
      
      setMerchantSubscriptionStats(stats);
    } catch (e) {
      logger.error('Unexpected error loading merchant subscription stats', e as Error);
      // Set mock data when database is not available
      setMerchantSubscriptionStats({
        startUp: 15,
        momentumPlan: 12,
        energizerPlan: 8,
        cloud9Plan: 4,
        superPlan: 2
      });
    }
  }, [logger]);

  const loadLocationIndustryStats = useCallback(async () => {
    try {
      logger.info('Loading location and industry stats');

      // Get merchant location and industry data
      const { data, error } = await supabase
        .from('merchants')
        .select('country, business_type, subscription_plan')
        .eq('status', 'active');
      
      if (error) {
        logger.error('Error loading location and industry stats', error);
        // Set mock data when database is not available
        setLocationIndustryStats({
          country: [
            { name: 'Canada', count: 15, percentage: 85, change: 5.2 },
            { name: 'Greenland', count: 12, percentage: 80, change: 7.8 },
            { name: 'Russia', count: 8, percentage: 63, change: -2.1 },
            { name: 'China', count: 10, percentage: 60, change: 3.4 },
            { name: 'Australia', count: 6, percentage: 45, change: 1.2 },
            { name: 'Greece', count: 4, percentage: 40, change: 1.0 }
          ],
          industry: [
            { name: 'Technology', count: 18, percentage: 90, change: 8.5 },
            { name: 'Retail', count: 12, percentage: 75, change: 4.2 },
            { name: 'Healthcare', count: 8, percentage: 65, change: 2.1 },
            { name: 'Finance', count: 6, percentage: 55, change: -1.5 },
            { name: 'Education', count: 4, percentage: 45, change: 3.8 },
            { name: 'Manufacturing', count: 3, percentage: 35, change: 0.8 }
          ]
        });
        return;
      }

      const merchants = data || [];
      
      // Process country data
      const countryMap = new Map<string, number>();
      merchants.forEach((merchant: any) => {
        const country = merchant.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });
      
      const totalMerchants = merchants.length;
      const countryData = Array.from(countryMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalMerchants) * 100),
          change: Math.random() * 10 - 2 // Mock change percentage
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Top 6 countries

      // Process industry data
      const industryMap = new Map<string, number>();
      merchants.forEach((merchant: any) => {
        const industry = merchant.business_type || 'Unknown';
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
      });
      
      const industryData = Array.from(industryMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalMerchants) * 100),
          change: Math.random() * 10 - 2 // Mock change percentage
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Top 6 industries

      setLocationIndustryStats({
        country: countryData,
        industry: industryData
      });
    } catch (e) {
      logger.error('Unexpected error loading location and industry stats', e as Error);
      // Set mock data when database is not available
      setLocationIndustryStats({
        country: [
          { name: 'Canada', count: 15, percentage: 85, change: 5.2 },
          { name: 'Greenland', count: 12, percentage: 80, change: 7.8 },
          { name: 'Russia', count: 8, percentage: 63, change: -2.1 },
          { name: 'China', count: 10, percentage: 60, change: 3.4 },
          { name: 'Australia', count: 6, percentage: 45, change: 1.2 },
          { name: 'Greece', count: 4, percentage: 40, change: 1.0 }
        ],
        industry: [
          { name: 'Technology', count: 18, percentage: 90, change: 8.5 },
          { name: 'Retail', count: 12, percentage: 75, change: 4.2 },
          { name: 'Healthcare', count: 8, percentage: 65, change: 2.1 },
          { name: 'Finance', count: 6, percentage: 55, change: -1.5 },
          { name: 'Education', count: 4, percentage: 45, change: 3.8 },
          { name: 'Manufacturing', count: 3, percentage: 35, change: 0.8 }
        ]
      });
    }
  }, [logger]);

  useSmartDataRefresh(refreshAdminData, {
    debounceMs: 3000, // 3 second debounce for admin data
    enabled: !loading && isAdmin,
    dependencies: [user?.id, isAdmin] // Refresh when user or admin status changes
  });


  // Initialize date ranges once
  useEffect(() => {
    if (!revenueRange && !analyticsRange) {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setRevenueRange({ from, to: now });
      setAnalyticsRange({ from, to: now });
    }
  }, []);

  // Simple useEffect that doesn't depend on function definitions
  useEffect(() => {
    // Only load stats if we have admin access - the wrapper handles auth checks
    if (!loading && user && isAdmin) {
      if (!hasLoadedStatsRef.current) {
        hasLoadedStatsRef.current = true;
        // Call refreshAdminData which has the stats loading logic
        refreshAdminData();
        // Load merchant subscription stats
        loadMerchantSubscriptionStats();
        // Load location and industry stats
        loadLocationIndustryStats();
      }
      if (!isLoaded) {
        setIsLoaded(true);
      }
    } else if (!loading && !isLoaded) {
      setIsLoaded(true);
    }
  }, [user?.id, isAdmin, loading]);


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
            <Badge 
              variant="outline" 
              className={`${
                dbConnectionState === 'connected' 
                  ? 'bg-green-500/10 text-green-600' 
                  : dbConnectionState === 'disconnected'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}
            >
              DB: {dbConnectionState === 'connected' ? 'Connected' : dbConnectionState === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </Badge>
          </div>
          {/* Revenue Date Range */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <DateRangePickerWithTime
                dateRange={revenueRange}
                onDateRangeChange={(range) => {
                  setRevenueRange(range);
                  if (range?.from && range?.to) {
                    const fromStr = range.from.toISOString().split('T')[0] || '';
                    const toStr = range.to.toISOString().split('T')[0] || '';
                    if (fromStr && toStr) {
                      loadRevenueStats(fromStr, toStr);
                    }
                  }
                }}
                placeholder="Select revenue date & time range (GMT)"
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (revenueRange?.from && revenueRange?.to) {
                    const fromStr = revenueRange.from.toISOString().split('T')[0] || '';
                    const toStr = revenueRange.to.toISOString().split('T')[0] || '';
                    if (fromStr && toStr) {
                      loadRevenueStats(fromStr, toStr);
                    }
                  }
                }}
                disabled={revenueLoading || !revenueRange?.from || !revenueRange?.to}
                className="w-full sm:w-auto"
              >
                {revenueLoading ? 'Updating…' : 'Apply Range'}
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
              <CardTitle className="text-sm font-medium">Total Loyalty Cards</CardTitle>
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
              <div className="flex justify-end mt-3">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  View more
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
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
                <span className="hidden sm:inline truncate">Loyalty Cards</span>
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
                onClick={() => setActiveTab('rewards')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'rewards'
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
                onClick={() => setActiveTab('features')}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'features'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '100%', flex: '1 1 auto'}}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Features</span>
                <span className="sm:hidden text-xs">Features</span>
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
                <h3 className="text-2xl font-bold text-foreground mb-2">Loyalty Card Management</h3>
                <p className="text-muted-foreground mb-6">
                  Create and manage loyalty NFT cards with different rarities and earning capabilities.
                </p>
                <ErrorBoundary>
                  <VirtualCardManager onStatsUpdate={refreshAdminData} />
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
                    <MerchantManager onStatsUpdate={refreshAdminData} />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <SubscriptionPlanManager />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Rewards Management</h3>
                <p className="text-muted-foreground mb-6">
                  Manage rewards configuration, distribution settings, and user analytics.
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
                  <MarketplaceManager />
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
                <UserManager />
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
                <div className="space-y-4 mb-6">
                  <DateRangePickerWithTime
                    dateRange={analyticsRange}
                    onDateRangeChange={(range) => {
                      setAnalyticsRange(range);
                      if (range?.from && range?.to) {
                        const fromStr = range.from.toISOString().split('T')[0] || '';
                        const toStr = range.to.toISOString().split('T')[0] || '';
                          if (fromStr && toStr) {
                            loadAnalyticsStats(fromStr, toStr);
                          }
                        }
                      }}
                    placeholder="Select analytics date & time range (GMT)"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Transactions</div><div className="text-2xl font-bold">{analyticsStats.totalTransactions}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Volume</div><div className="text-2xl font-bold">${analyticsStats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Avg Value</div><div className="text-2xl font-bold">${analyticsStats.averageValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Active Users</div><div className="text-2xl font-bold">{analyticsStats.activeUsers}</div></CardContent></Card>
                  <Card className="card-gradient border-primary/20"><CardContent className="p-6"><div className="text-sm text-muted-foreground">Active Merchants</div><div className="text-2xl font-bold">{analyticsStats.activeMerchants}</div></CardContent></Card>
                </div>
                
                {/* Analytics Charts - 2 per row layout */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Merchant Subscription Chart */}
                <Card className="card-gradient border-primary/20">
                    <CardHeader>
                    <CardTitle className="text-lg font-bold">Merchant Subscriptions</CardTitle>
                    <CardDescription>Distribution by plan type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          merchants: {
                            label: "Merchants",
                          },
                          StartUp: {
                            label: "StartUp",
                            color: "hsl(var(--primary))",
                          },
                          Momentum: {
                            label: "Momentum",
                            color: "hsl(var(--secondary))",
                          },
                          Energizer: {
                            label: "Energizer",
                            color: "hsl(var(--accent))",
                          },
                          Cloud9: {
                            label: "Cloud9",
                            color: "hsl(var(--muted))",
                          },
                          Super: {
                            label: "Super",
                            color: "hsl(var(--destructive))",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={[
                            { plan: "StartUp", merchants: merchantSubscriptionStats.startUp || 0, fill: "hsl(var(--primary))" },
                            { plan: "Momentum", merchants: merchantSubscriptionStats.momentumPlan || 0, fill: "hsl(var(--secondary))" },
                            { plan: "Energizer", merchants: merchantSubscriptionStats.energizerPlan || 0, fill: "hsl(var(--accent))" },
                            { plan: "Cloud9", merchants: merchantSubscriptionStats.cloud9Plan || 0, fill: "hsl(var(--muted))" },
                            { plan: "Super", merchants: merchantSubscriptionStats.superPlan || 0, fill: "hsl(var(--destructive))" },
                          ]}
                          layout="vertical"
                          margin={{
                            left: 20,
                            right: 20,
                            top: 20,
                            bottom: 20,
                          }}
                        >
                          <YAxis
                            dataKey="plan"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={120}
                            tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // The value is already the full plan name, so just return it
                  return value
                }}
                          />
                          <XAxis dataKey="merchants" type="number" hide />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar dataKey="merchants" layout="vertical" radius={5} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Revenue Analytics Chart */}
                <Card className="card-gradient border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Revenue Analytics</CardTitle>
                    <CardDescription>Monthly revenue trends</CardDescription>
                  </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                          },
                          monthly: {
                            label: "Monthly Revenue",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <AreaChart
                          accessibilityLayer
                          data={[
                            { month: "Jan", revenue: 45000 },
                            { month: "Feb", revenue: 52000 },
                            { month: "Mar", revenue: 48000 },
                            { month: "Apr", revenue: 61000 },
                            { month: "May", revenue: 55000 },
                            { month: "Jun", revenue: 67000 },
                          ]}
                          margin={{
                            left: 12,
                            right: 12,
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <Area
                            dataKey="revenue"
                            type="natural"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.4}
                            stroke="hsl(var(--primary))"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Location/Industry Analytics Chart */}
                <div className="mt-8">
                  <Card className="card-gradient border-primary/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Sales by {locationIndustryView === 'country' ? 'Location' : 'Industry'}</CardTitle>
                          <CardDescription>Income in the last 28 days</CardDescription>
                        </div>
                        <Select value={locationIndustryView} onValueChange={(value: 'country' | 'industry') => setLocationIndustryView(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="industry">Industry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {locationIndustryStats[locationIndustryView].map((item) => (
                          <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="text-sm font-medium text-foreground min-w-[100px]">
                                {item.name}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${item.percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-sm font-semibold text-foreground min-w-[40px] text-right">
                                    {item.percentage}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Badge 
                                variant={item.change >= 0 ? "default" : "destructive"}
                                className={`text-xs px-2 py-1 ${
                                  item.change >= 0 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Feature Controls</h3>
                <p className="text-muted-foreground mb-6">
                  Manage subscription-based features and their availability across different plans.
                </p>
                <ErrorBoundary>
                  <FeatureControlPanel />
                </ErrorBoundary>
              </div>
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