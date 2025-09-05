import { useState } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { CreditCard, Activity, TrendingUp, Share2, Wallet } from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";

const UserDashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'loyalty' | 'referrals'>('overview');

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
              <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
              {isAdmin && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card onClick={() => setActiveSection('loyalty')} className="cursor-pointer hover:shadow-md transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Loyalty Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">View your loyalty number and Web3 wallet</div>
            </CardContent>
          </Card>

          <Card onClick={() => setActiveSection('referrals')} className="cursor-pointer hover:shadow-md transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Share your code and track rewards</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Manage your Solana wallet connection in Loyalty</div>
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Your latest points and transactions will appear here.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Points Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View detailed analytics in the full dashboard.</div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'loyalty' && (
          <div className="space-y-6">
            <LoyaltyCardTab />
          </div>
        )}

        {activeSection === 'referrals' && (
          <div className="space-y-6">
            <ReferralsTab />
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;

