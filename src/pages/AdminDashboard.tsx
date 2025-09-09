import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Tabs import - using custom navigation
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VirtualCardManager from "@/components/admin/VirtualCardManager";
import MerchantManager from "@/components/admin/MerchantManager";
import { AdminUserCreator } from "@/components/admin/AdminUserCreator";
import UserManager from "@/components/admin/UserManager";
import UserLoyaltyCardManager from "@/components/admin/UserLoyaltyCardManager";
import ReferralManager from "@/components/admin/ReferralManager";
import SubscriptionPlanManager from "@/components/admin/SubscriptionPlanManager";
import LoyaltyNetworkManager from "@/components/admin/LoyaltyNetworkManager";
import NFTManager from "@/components/admin/NFTManager";
import { CreditCard, Users, Package, TrendingUp, Shield, UserCheck, Gift, Settings, Wallet, Link, Star } from "lucide-react";

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalCards: 0,
    totalMerchants: 0,
    activeMerchants: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cards');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setUser(user);
      setProfile(profile);
      setIsAdmin(true);
      // Only load stats after confirming admin privileges
      await loadStats();
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Initialize stats with defaults
      const newStats = {
        totalCards: 0,
        totalMerchants: 0,
        activeMerchants: 0,
        totalRevenue: 0
      };

      const [cardsResult, merchantsResult, activeResult] = await Promise.all([
        supabase.from("virtual_cards").select("id", { count: "exact" }),
        supabase.from("merchants").select("id", { count: "exact" }),
        supabase.from("merchants").select("id", { count: "exact" }).eq("status", "active")
      ]);

      // Update stats only for successful queries
      if (!cardsResult.error) {
        newStats.totalCards = cardsResult.count || 0;
      } else {
        console.error("Error loading virtual cards:", cardsResult.error);
      }

      if (!merchantsResult.error) {
        newStats.totalMerchants = merchantsResult.count || 0;
      } else {
        console.error("Error loading merchants:", merchantsResult.error);
      }

      if (!activeResult.error) {
        newStats.activeMerchants = activeResult.count || 0;
      } else {
        console.error("Error loading active merchants:", activeResult.error);
      }

      setStats(newStats);

      // Show error toast if all queries failed
      if (cardsResult.error && merchantsResult.error && activeResult.error) {
        toast({
          title: "Error Loading Statistics",
          description: "Unable to load dashboard statistics. Some data may be unavailable.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast({
        title: "Error Loading Statistics",
        description: "An unexpected error occurred while loading statistics.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name || profile?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">Admin</Badge>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCards}</div>
              <p className="text-xs text-muted-foreground">Virtual cards created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMerchants}</div>
              <p className="text-xs text-muted-foreground">Registered merchants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMerchants}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total subscription revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <div className="w-full">
          <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1 overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-1 min-w-max">
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'cards'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Virtual Cards</span>
                <span className="sm:hidden text-xs">Cards</span>
              </button>
              <button
                onClick={() => setActiveTab('merchants')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'merchants'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Merchants</span>
                <span className="sm:hidden text-xs">Merchants</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden text-xs">Users</span>
              </button>
              <button
                onClick={() => setActiveTab('loyalty-cards')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'loyalty-cards'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Loyalty Cards</span>
                <span className="sm:hidden text-xs">Loyalty</span>
              </button>
              <button
                onClick={() => setActiveTab('loyalty-networks')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'loyalty-networks'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Link className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Loyalty Networks</span>
                <span className="sm:hidden text-xs">Networks</span>
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Gift className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Referrals</span>
                <span className="sm:hidden text-xs">Refs</span>
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'plans'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Plans</span>
                <span className="sm:hidden text-xs">Plans</span>
              </button>
              <button
                onClick={() => setActiveTab('nft-management')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'nft-management'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Star className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">NFT Management</span>
                <span className="sm:hidden text-xs">NFTs</span>
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'admins'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Admin Users</span>
                <span className="sm:hidden text-xs">Admins</span>
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          {activeTab === "cards" && (
            <Card>
              <CardHeader>
                <CardTitle>Virtual Card Management</CardTitle>
                <CardDescription>
                  Create and manage virtual cards with different pricing models and features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VirtualCardManager onStatsUpdate={loadStats} />
              </CardContent>
            </Card>
          )}
          
          {activeTab === "merchants" && (
            <Card>
              <CardHeader>
                <CardTitle>Merchant Management</CardTitle>
                <CardDescription>
                  Manage merchant subscriptions and monitor their activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MerchantManager onStatsUpdate={loadStats} />
              </CardContent>
            </Card>
          )}

          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user profiles and subscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManager onStatsUpdate={loadStats} />
              </CardContent>
            </Card>
          )}

          {activeTab === "loyalty-cards" && (
            <Card>
              <CardHeader>
                <CardTitle>User Loyalty Cards</CardTitle>
                <CardDescription>
                  Create and manage loyalty cards for users to enable their participation in the loyalty program.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserLoyaltyCardManager onStatsUpdate={loadStats} />
              </CardContent>
            </Card>
          )}

          {activeTab === "loyalty-networks" && (
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Networks</CardTitle>
                <CardDescription>
                  Manage third-party loyalty networks and their conversion rates for point integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoyaltyNetworkManager onStatsUpdate={loadStats} />
              </CardContent>
            </Card>
          )}

          {activeTab === "referrals" && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Management</CardTitle>
                <CardDescription>
                  Monitor and manage user referrals and rewards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReferralManager />
              </CardContent>
            </Card>
          )}

          {activeTab === "plans" && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan Management</CardTitle>
                <CardDescription>
                  Create and manage subscription plans for merchants.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionPlanManager />
              </CardContent>
            </Card>
          )}

          {activeTab === "nft-management" && (
            <Card>
              <CardHeader>
                <CardTitle>NFT Management</CardTitle>
                <CardDescription>
                  Manage loyalty NFT types, minting controls, and user NFT ownership.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NFTManager />
              </CardContent>
            </Card>
          )}

          {activeTab === "admins" && (
            <Card>
              <CardHeader>
                <CardTitle>Admin User Management</CardTitle>
                <CardDescription>
                  Create and manage admin users with email or wallet-based authentication.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUserCreator />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;