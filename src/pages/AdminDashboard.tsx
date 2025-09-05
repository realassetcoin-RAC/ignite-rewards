import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VirtualCardManager from "@/components/admin/VirtualCardManager";
import MerchantManager from "@/components/admin/MerchantManager";
import AdminUserCreator from "@/components/admin/AdminUserCreator";
import { CreditCard, Users, Package, TrendingUp, Shield } from "lucide-react";

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCards: 0,
    totalMerchants: 0,
    activeMerchants: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
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
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [cardsResult, merchantsResult, activeResult] = await Promise.all([
        supabase.from("virtual_cards").select("id", { count: "exact" }),
        supabase.from("merchants").select("id", { count: "exact" }),
        supabase.from("merchants").select("id", { count: "exact" }).eq("status", "active")
      ]);

      setStats({
        totalCards: cardsResult.count || 0,
        totalMerchants: merchantsResult.count || 0,
        activeMerchants: activeResult.count || 0,
        totalRevenue: 0 // Calculate based on subscriptions
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
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
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cards">Virtual Cards</TabsTrigger>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="admins">Admin Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards">
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
          </TabsContent>
          
          <TabsContent value="merchants">
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
          </TabsContent>

          <TabsContent value="admins">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;