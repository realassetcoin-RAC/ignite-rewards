import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
// Removed Tabs import - using custom navigation
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate, Link } from "react-router-dom";
import { CreditCard, Activity, TrendingUp, User, Share2, Wallet, Sparkles, ArrowLeft } from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import TransactionsTab from "@/components/dashboard/TransactionsTab";
import PointsGraphTab from "@/components/dashboard/PointsGraphTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const [activeTab, setActiveTab] = useState("loyalty");
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
                  Dashboard
                </h1>
              </div>
              {isAdmin && (
                <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm text-muted-foreground ${
                isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
              }`}>
                Welcome, {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
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

      {/* Dashboard Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className={`w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1 overflow-x-auto ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 min-w-max">
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'loyalty'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">Loyalty Card</span>
                <span className="md:hidden text-xs">Card</span>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">Transactions</span>
                <span className="md:hidden text-xs">Txns</span>
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'points'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">Points Graph</span>
                <span className="md:hidden text-xs">Points</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">Profile</span>
                <span className="md:hidden text-xs">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">Referrals</span>
                <span className="md:hidden text-xs">Refs</span>
              </button>
            </div>
          </div>

          {/* Loyalty Tab */}
          {activeTab === 'loyalty' && (
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <ErrorBoundary>
                <LoyaltyCardTab />
              </ErrorBoundary>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <ErrorBoundary>
                <TransactionsTab />
              </ErrorBoundary>
            </div>
          )}

          {/* Points Tab */}
          {activeTab === 'points' && (
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <ErrorBoundary>
                <PointsGraphTab />
              </ErrorBoundary>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <ErrorBoundary>
                <ProfileTab />
              </ErrorBoundary>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <ErrorBoundary>
                <ReferralsTab />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;