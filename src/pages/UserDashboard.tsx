import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate, Link } from "react-router-dom";
import { CreditCard, Activity, TrendingUp, Share2, Wallet, Sparkles, ArrowLeft } from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";

const UserDashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'loyalty' | 'referrals'>('overview');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
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
      <header className="relative z-10 border-b bg-background/80 backdrop-blur-md border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className={`text-2xl font-bold text-foreground ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}>
                  Welcome
                </h1>
              </div>
              {isAdmin && (
                <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <Card onClick={() => setActiveSection('loyalty')} className="cursor-pointer card-gradient border-primary/20 backdrop-blur-md hover:scale-105 hover:shadow-xl transition-all duration-300 group">
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

          <Card onClick={() => setActiveSection('referrals')} className="cursor-pointer card-gradient border-primary/20 backdrop-blur-md hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4 group-hover:animate-bounce" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Share your code and track rewards</div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 group-hover:animate-pulse" />
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
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Your latest points and transactions will appear here.</div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
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
          <div className={`space-y-6 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <LoyaltyCardTab />
          </div>
        )}

        {activeSection === 'referrals' && (
          <div className={`space-y-6 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <ReferralsTab />
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;

