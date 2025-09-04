import { useState } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { CreditCard, Activity, TrendingUp, User, Share2, Wallet } from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import TransactionsTab from "@/components/dashboard/TransactionsTab";
import PointsGraphTab from "@/components/dashboard/PointsGraphTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";

const Dashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const [activeTab, setActiveTab] = useState("loyalty");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              {isAdmin && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" asChild>
                <a href="/">Back to Home</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Loyalty Card</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Points Graph</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">Referrals</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loyalty" className="space-y-6">
            <LoyaltyCardTab />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="points" className="space-y-6">
            <PointsGraphTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <ReferralsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;