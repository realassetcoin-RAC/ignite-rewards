import React, { useState, useEffect } from "react";
import { useSecureAuthFixed as useSecureAuth } from "@/hooks/useSecureAuthFixed";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createModuleLogger } from "@/utils/consoleReplacer";
import { 
  CreditCard, 
  TrendingUp, 
  Share2, 
  Sparkles, 
  Coins, 
  Crown,
  Gift,
  Users,
  Building2,
  Vote,
  Menu,
  X,
  Home,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Shield,
  Zap,
  Target
} from "lucide-react";

// Import existing components
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTabImproved from "@/components/dashboard/ReferralsTabImproved";
import RewardsTrackerImproved from "@/components/solana/RewardsTrackerImproved";
import LoyaltyAccountLinkingFixed from "@/components/LoyaltyAccountLinkingFixed";
import PointConversionSystem from "@/components/PointConversionSystem";
import MarketplaceMainFixed from "@/components/marketplace/MarketplaceMainFixed";
import UserNFTManager from "@/components/UserNFTManager";
import LoyaltyCardHeader from "@/components/LoyaltyCardHeader";
import NFTManagementPanel from "@/components/nft/NFTManagementPanel";
import DAOGovernancePanel from "@/components/dao/DAOGovernancePanel";
import { AssetInitiativeSelector } from "@/components/AssetInitiativeSelector";
import { WalletAddressDisplay } from "@/components/WalletAddressDisplay";
import { SeedPhraseManager } from "@/components/SeedPhraseManager";
import { ReferralStats } from "@/components/ReferralStats";

interface DashboardStats {
  totalPoints: number;
  totalEarned: number;
  activeRewards: number;
  referralCount: number;
  nftCount: number;
  stakingRewards: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  shadowColor: string;
  count?: number;
  countLabel?: string;
  badge?: string;
  onClick: () => void;
}

const UserDashboard = () => {
  const logger = createModuleLogger('UserDashboard');
  const { user, profile, signOut } = useSecureAuth();
  const { toast } = useToast();
  useSmartDataRefresh();
  useInactivityTimeout(5);
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats] = useState<DashboardStats>({
    totalPoints: 850,
    totalEarned: 2450,
    activeRewards: 8,
    referralCount: 3,
    nftCount: 1,
    stakingRewards: 125
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      logger.error('Error signing out', error as Error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview & Quick Actions' },
    { id: 'loyalty', label: 'Loyalty Cards', icon: CreditCard, description: 'Manage your loyalty cards' },
    { id: 'rewards', label: 'Rewards', icon: Gift, description: 'Browse & redeem rewards' },
    { id: 'nft-management', label: 'NFT Portfolio', icon: Crown, description: 'Manage NFTs & staking' },
    { id: 'referrals', label: 'Referrals', icon: Users, description: 'Invite friends & earn' },
    { id: 'marketplace', label: 'Marketplace', icon: Building2, description: 'Invest in tokenized assets' },
    { id: 'loyalty-networks', label: 'Networks', icon: Share2, description: 'Partner loyalty programs' },
    { id: 'dao', label: 'Governance', icon: Vote, description: 'DAO proposals & voting' },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'loyalty',
      title: 'Loyalty Cards',
      description: 'Manage your loyalty cards and track rewards',
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/25',
      count: 1,
      countLabel: 'active card',
      badge: 'Active',
      onClick: () => setActiveSection('loyalty')
    },
    {
      id: 'rewards',
      title: 'Available Rewards',
      description: 'Browse and redeem your earned rewards',
      icon: Gift,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/25',
      count: stats.activeRewards,
      countLabel: 'available',
      badge: 'New',
      onClick: () => setActiveSection('rewards')
    },
    {
      id: 'nft-management',
      title: 'NFT Portfolio',
      description: 'Manage NFTs, evolution, and auto-staking',
      icon: Crown,
      gradient: 'from-indigo-500 to-purple-500',
      shadowColor: 'shadow-indigo-500/25',
      count: stats.nftCount,
      countLabel: 'NFT owned',
      badge: 'Premium',
      onClick: () => setActiveSection('nft-management')
    },
    {
      id: 'referrals',
      title: 'Referral Program',
      description: 'Invite friends and earn bonus rewards',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/25',
      count: stats.referralCount,
      countLabel: 'referrals',
      badge: 'Earning',
      onClick: () => setActiveSection('referrals')
    },
    {
      id: 'marketplace',
      title: 'Investment Hub',
      description: 'Invest in tokenized assets and earn passive income',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      shadowColor: 'shadow-orange-500/25',
      count: 3,
      countLabel: 'opportunities',
      badge: 'Hot',
      onClick: () => setActiveSection('marketplace')
    },
    {
      id: 'dao',
      title: 'DAO Governance',
      description: 'Participate in governance and vote on proposals',
      icon: Vote,
      gradient: 'from-green-500 to-emerald-500',
      shadowColor: 'shadow-green-500/25',
      count: 5,
      countLabel: 'active proposals',
      badge: 'Vote',
      onClick: () => setActiveSection('dao')
    }
  ];

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderDashboardContent = () => {
    switch (activeSection) {
      case 'loyalty':
        return (
          <div className="space-y-6">
            <LoyaltyCardTab />
            <UserNFTManager />
          </div>
        );
      case 'rewards':
        return user && <RewardsTrackerImproved userId={user.id} />;
      case 'nft-management':
        return <NFTManagementPanel />;
      case 'referrals':
        return (
          <div className="space-y-6">
            <ReferralStats userId={user?.id || ''} className="bg-white/5 backdrop-blur-xl border-white/10" />
            <ReferralsTabImproved />
          </div>
        );
      case 'marketplace':
        return <MarketplaceMainFixed />;
      case 'loyalty-networks':
  return (
          <div className="space-y-8">
            <LoyaltyAccountLinkingFixed />
            <PointConversionSystem />
      </div>
        );
      case 'dao':
        return <DAOGovernancePanel />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20 backdrop-blur-xl border-white/10 overflow-hidden">
              <CardContent className="p-8">
          <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'User'}! 👋
                    </h2>
                    <p className="text-lg text-gray-300">
                      You have {stats.totalPoints} points ready to use and {stats.activeRewards} new rewards available.
                    </p>
                </div>
                  <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                      <p className="text-sm text-gray-300">Loyalty Level</p>
                      <div className="flex items-center space-x-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-xl font-bold text-white">Gold</span>
            </div>
          </div>
        </div>
              </div>
            </CardContent>
          </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
              <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Available Points</p>
                      <p className="text-2xl font-bold text-white">{stats.totalPoints.toLocaleString()}</p>
                      <p className="text-xs text-emerald-400 mt-1">+50 this week</p>
                </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                      <Coins className="w-6 h-6 text-white" />
              </div>
              </div>
            </CardContent>
          </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
              <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Earned</p>
                      <p className="text-2xl font-bold text-white">{stats.totalEarned.toLocaleString()}</p>
                      <p className="text-xs text-purple-400 mt-1">All time</p>
                </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
              </div>
              </div>
            </CardContent>
          </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
              <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Staking Rewards</p>
                      <p className="text-2xl font-bold text-white">{stats.stakingRewards}</p>
                      <p className="text-xs text-blue-400 mt-1">+12 this month</p>
                </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Zap className="w-6 h-6 text-white" />
              </div>
              </div>
            </CardContent>
          </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
              <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Active Referrals</p>
                      <p className="text-2xl font-bold text-white">{stats.referralCount}</p>
                      <p className="text-xs text-orange-400 mt-1">Earning rewards</p>
                </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
              </div>
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Loyalty Card Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-purple-400" />
                Your Loyalty Card
              </h3>
              <LoyaltyCardHeader />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action) => (
          <Card 
                    key={action.id}
                    onClick={action.onClick}
                    className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl shadow-lg ${action.shadowColor}`}>
                          <action.icon className="h-6 w-6 text-white" />
                </div>
                        {action.badge && (
                          <Badge className={`bg-gradient-to-r ${action.gradient} text-white border-0 text-xs`}>
                            {action.badge}
                </Badge>
                        )}
              </div>
                      <CardTitle className="text-lg font-semibold text-white group-hover:text-gray-200 transition-colors">
                        {action.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                        {action.description}
                      </p>
                      {action.count !== undefined && (
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-white">{action.count}</span>
                          <span className="text-sm text-gray-400">{action.countLabel}</span>
              </div>
                      )}
                      <Button 
                        size="sm" 
                        className={`w-full bg-gradient-to-r ${action.gradient} hover:opacity-90 text-white border-0 group-hover:shadow-lg transition-all duration-300`}
                      >
                        Get Started
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
            </CardContent>
          </Card>
                ))}
              </div>
        </div>

            {/* Wallet & Security Section */}
                <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-green-400" />
                Wallet & Security
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user && (
                  <>
                    <WalletAddressDisplay 
                      userId={user.id}
                    />
                    <SeedPhraseManager 
                      userId={user.id}
                    />
                  </>
                )}
                </div>
              </div>

            {/* Asset Initiative Selector */}
                <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-400" />
                Reward Preferences
              </h3>
              <AssetInitiativeSelector userId={user?.id || ''} />
                </div>
              </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.05),transparent_50%)]" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl rotate-45 animate-float" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg rotate-12 animate-float-slow" />
                </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-black/20 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
                <div>
                <p className="font-semibold text-white text-sm">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400">Gold Member</p>
                </div>
              </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
        </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${
                  activeSection === item.id ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'
                }`} />
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                {activeSection === item.id && (
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
                    </div>
                    </div>
                  </div>
                  
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-400">
                  {navigationItems.find(item => item.id === activeSection)?.description || 'Welcome to your dashboard'}
                </p>
              </div>
          </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
          </div>
        </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className={`max-w-7xl mx-auto transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {renderDashboardContent()}
          </div>
      </main>
      </div>
    </div>
  );
};

export default UserDashboard;