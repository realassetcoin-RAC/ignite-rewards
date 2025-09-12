import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Activity, 
  TrendingUp, 
  Share2, 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  LogOut,
  Star,
  Zap,
  Crown,
  Gift,
  Users,
  Award,
  Target,
  Building2,
  Vote,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Hash,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Shield
} from "lucide-react";
import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import RewardsTracker from "@/components/solana/RewardsTracker";
import LoyaltyAccountLinking from "@/components/LoyaltyAccountLinking";
import PointConversionSystem from "@/components/PointConversionSystem";
import MarketplaceMain from "@/components/marketplace/MarketplaceMain";
import UserNFTManager from "@/components/UserNFTManager";
import { format } from 'date-fns';
import { 
  DAOOrganization, 
  DAOProposal, 
  DAOMember, 
  DAOStats, 
  ProposalStatus, 
  VotingType,
  PROPOSAL_CATEGORIES,
  VOTING_TYPES,
  MEMBER_ROLES
} from '@/types/dao';
import { DAOService } from '@/lib/daoService';

const UserDashboard = () => {
  const { user, isAdmin, loading } = useSecureAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'loyalty' | 'loyalty-networks' | 'referrals' | 'rewards' | 'marketplace' | 'dao'>('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // DAO state variables
  const [daoActiveTab, setDaoActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [members, setMembers] = useState<DAOMember[]>([]);
  const [daoStats, setDaoStats] = useState<DAOStats | null>(null);
  const [daoLoading, setDaoLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<DAOMember | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Smart data refresh - refreshes component data when returning to app
  const refreshDashboardData = async () => {
    console.log('🔄 Refreshing dashboard data...');
    // Here you would typically refetch data from APIs
    // For now, we'll just log the refresh
    setIsLoaded(false);
    setTimeout(() => setIsLoaded(true), 100); // Simulate data refresh
  };

  useSmartDataRefresh(refreshDashboardData, {
    debounceMs: 2000, // 2 second debounce
    enabled: true,
    dependencies: [user?.id] // Refresh when user changes
  });

  // DAO functions
  const loadDAOData = async () => {
    if (activeSection !== 'dao') return;
    
    try {
      setDaoLoading(true);
      
      // Load DAO organizations from database
      const organizations = await DAOService.getOrganizations();
      if (organizations.length === 0) {
        console.warn('No DAO organizations found');
        setProposals([]);
        setMembers([]);
        setDaoStats({
          total_members: 0,
          active_members: 0,
          total_proposals: 0,
          active_proposals: 0,
          total_treasury_value: 0,
          treasury_currency: 'SOL',
          participation_rate: 0,
          average_voting_power: 0
        });
        return;
      }

      const daoId = organizations[0].id;

      // Load proposals, members, and stats from database
      const [proposalsData, membersData, statsData] = await Promise.all([
        DAOService.getProposals(daoId),
        DAOService.getMembers(daoId),
        DAOService.getDAOStats(daoId)
      ]);

      setProposals(proposalsData);
      setMembers(membersData);
      setDaoStats(statsData);

      // Fallback to sample data if database is empty
      if (proposalsData.length === 0) {
        const sampleProposals: DAOProposal[] = [
          {
            id: crypto.randomUUID(),
            dao_id: daoId,
            title: 'Increase RAC token rewards for loyalty program',
            description: 'Proposal to increase RAC token rewards from 10% to 15% for all loyalty program participants.',
            category: 'treasury',
            status: 'active',
            voting_type: 'single_choice',
            choices: ['Yes', 'No', 'Abstain'],
            votes: { 'Yes': 45, 'No': 12, 'Abstain': 3 },
            total_votes: 60,
            voting_power_required: 1000,
            voting_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            voting_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            execution_delay: 24,
            proposer_id: 'user-1',
            proposer_name: 'DAO Member',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setProposals(sampleProposals);
      }

    } catch (error) {
      console.error('Error loading DAO data:', error);
    } finally {
      setDaoLoading(false);
    }
  };

  const checkUserMembership = async () => {
    if (activeSection !== 'dao') return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      // Get DAO organizations to find the user's membership
      const organizations = await DAOService.getOrganizations();
      if (organizations.length > 0) {
        const daoId = organizations[0].id;
        const membership = await DAOService.getUserMembership(daoId, user.id);
        
        if (membership) {
          setUserMembership(membership);
        } else {
          // User is not a member, create a default membership for display
          const defaultMembership: DAOMember = {
            id: `member-${user.id}`,
            dao_id: daoId,
            user_id: user.id,
            wallet_address: 'Not connected',
            role: 'member',
            governance_tokens: 0,
            voting_power: 0,
            joined_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            is_active: false,
            user_email: user.email,
            user_full_name: user.user_metadata?.full_name || 'DAO Member'
          };
          setUserMembership(defaultMembership);
        }
      }
    } catch (error) {
      console.error('Error checking user membership:', error);
    }
  };

  const castVote = async (proposalId: string, choice: string, reason?: string) => {
    try {
      if (!userMembership) {
        toast({
          title: "Membership Required",
          description: "You must be a DAO member to vote on proposals.",
          variant: "destructive",
        });
        return;
      }

      await DAOService.castVote(proposalId, currentUser.id, choice, userMembership.voting_power, reason);

      toast({
        title: "Vote Cast Successfully",
        description: `Your vote for "${choice}" has been recorded.`,
      });

      // Refresh the proposals to show updated vote counts
      await loadDAOData();
    } catch (error) {
      console.error('Voting error:', error);
      toast({
        title: "Voting Failed",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Load DAO data when DAO section is active
  useEffect(() => {
    if (activeSection === 'dao') {
      loadDAOData();
      checkUserMembership();
    }
  }, [activeSection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-r-blue-500/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full animate-float-delayed-2 pointer-events-none"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Ambient Light Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b bg-black/20 backdrop-blur-xl border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}>
                  PointBridge
                </h1>
                  <p className="text-sm text-gray-400">Your Digital Rewards Hub</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Information */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Welcome,</span>
                  <span className="font-medium text-white">{user?.email}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'
                }`}
              >
                <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className={`text-center space-y-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Welcome to Your Dashboard
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover, earn, and redeem rewards across your favorite merchants
          </p>
        </div>

        {/* Quick Actions - Enhanced Design */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <Card 
            onClick={() => setActiveSection('loyalty')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                Loyalty NFT Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Manage your loyalty NFT cards, track progress, and upgrade benefits
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-white">1,250</span>
                <span className="text-sm text-gray-400">points</span>
              </div>
              <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Upgrade Card
              </Button>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('loyalty-networks')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  Link & Convert
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-orange-200 transition-colors">
                Loyalty Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Connect your loyalty accounts and instantly convert your points into our tokens to unlock exclusive benefits on our platform
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-white">0</span>
                <span className="text-sm text-gray-400">linked</span>
              </div>
              <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Convert Points
              </Button>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('referrals')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                  Earn More
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Invite friends and earn bonus rewards together
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">12</span>
                <span className="text-sm text-gray-400">referrals</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('rewards')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  Available
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors">
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Browse and redeem your earned rewards
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">8</span>
                <span className="text-sm text-gray-400">available</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('marketplace')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                  Invest
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
                Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Invest in tokenized assets and earn passive income
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">3</span>
                <span className="text-sm text-gray-400">opportunities</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('dao')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Vote className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  Govern
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors">
                DAO Governance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Participate in decentralized governance and vote on proposals
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">{proposals.length}</span>
                <span className="text-sm text-gray-400">proposals</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Enhanced Metrics Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg shadow-emerald-500/25">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Available Points</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">850</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg shadow-blue-500/25">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">1,250</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg shadow-lg shadow-orange-500/25">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Lifetime Points</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">3,420</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
        }`}>
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <span>Recent Activity</span>
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Earned 50 points at Coffee Shop</p>
                        <p className="text-gray-400 text-sm">2 hours ago</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        +50 pts
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Redeemed free coffee</p>
                        <p className="text-gray-400 text-sm">Yesterday</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Redeemed
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Referred a friend</p>
                        <p className="text-gray-400 text-sm">3 days ago</p>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        +100 pts
                      </Badge>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        )}

          {activeSection === 'loyalty' && (
            <div className="space-y-6">
              <LoyaltyCardTab />
              <UserNFTManager />
            </div>
          )}
          {activeSection === 'loyalty-networks' && (
            <div className="space-y-8">
              <LoyaltyAccountLinking />
              <PointConversionSystem />
          </div>
        )}
          {activeSection === 'referrals' && <ReferralsTab />}
          {activeSection === 'rewards' && user && <RewardsTracker userId={user.id} />}
          {activeSection === 'marketplace' && <MarketplaceMain />}
          
          {activeSection === 'dao' && (
            <div className="space-y-6">
              {/* DAO Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">DAO Governance</h2>
                  <p className="text-gray-400">Participate in decentralized decision making</p>
                </div>
                {userMembership && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    {userMembership.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                )}
              </div>

              {/* DAO Tabs */}
              <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setDaoActiveTab('proposals')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    daoActiveTab === 'proposals'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Vote className="w-4 h-4 inline mr-2" />
                  Proposals
                </button>
                <button
                  onClick={() => setDaoActiveTab('members')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    daoActiveTab === 'members'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Members
                </button>
                <button
                  onClick={() => setDaoActiveTab('stats')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    daoActiveTab === 'stats'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Statistics
                </button>
              </div>

              {/* DAO Content */}
              {daoActiveTab === 'proposals' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search proposals..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProposalStatus | 'all')}>
                      <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="executed">Executed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Proposals List */}
                  <div className="space-y-4">
                    {daoLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      </div>
                    ) : proposals.length === 0 ? (
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <Vote className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">No Proposals Found</h3>
                          <p className="text-gray-400 text-center">There are no proposals available at the moment.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      proposals
                        .filter(proposal => {
                          const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .map((proposal) => (
                          <Card key={proposal.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg text-white mb-2">{proposal.title}</CardTitle>
                                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{proposal.description}</p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      Ends {format(new Date(proposal.voting_end), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="flex items-center">
                                      <Users className="w-4 h-4 mr-1" />
                                      {proposal.total_votes} votes
                                    </div>
                                    <Badge 
                                      className={`${
                                        proposal.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        proposal.status === 'passed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                        proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                      }`}
                                    >
                                      {proposal.status}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setShowProposalDetails(true);
                                  }}
                                  className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  <Vote className="w-4 h-4 mr-2" />
                                  Vote
                                </Button>
                              </div>
                            </CardHeader>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
              )}

              {daoActiveTab === 'members' && (
                <div className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">DAO Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">No Members Found</h3>
                          <p className="text-gray-400 text-center">No members have joined the DAO yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{member.user_full_name || member.user_email}</p>
                                  <p className="text-gray-400 text-sm">{member.role}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{member.governance_tokens} tokens</p>
                                <p className="text-gray-400 text-sm">{member.voting_power}% voting power</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {daoActiveTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Total Members</p>
                          <p className="text-2xl font-bold text-white">{daoStats?.total_members || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-emerald-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Active Proposals</p>
                          <p className="text-2xl font-bold text-white">{daoStats?.active_proposals || 0}</p>
                        </div>
                        <Vote className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Treasury Value</p>
                          <p className="text-2xl font-bold text-white">{daoStats?.total_treasury_value || 0}</p>
                          <p className="text-xs text-gray-400">{daoStats?.treasury_currency || 'SOL'}</p>
                        </div>
                        <Coins className="w-8 h-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Participation Rate</p>
                          <p className="text-2xl font-bold text-white">{daoStats?.participation_rate || 0}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          </div>
      </main>

      {/* Proposal Details Dialog */}
      <Dialog open={showProposalDetails} onOpenChange={setShowProposalDetails}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {selectedProposal?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedProposal.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Status</h4>
                  <Badge 
                    className={`${
                      selectedProposal.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      selectedProposal.status === 'passed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      selectedProposal.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {selectedProposal.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Voting Ends</h4>
                  <p className="text-gray-300 text-sm">
                    {format(new Date(selectedProposal.voting_end), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3">Vote Options</h4>
                <div className="space-y-2">
                  {selectedProposal.choices.map((choice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white font-medium">{choice}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          {selectedProposal.votes[choice] || 0} votes
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            castVote(selectedProposal.id, choice);
                            setShowProposalDetails(false);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={selectedProposal.status !== 'active' || !userMembership}
                        >
                          Vote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {!userMembership && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    You need to be a DAO member to vote on proposals.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;

