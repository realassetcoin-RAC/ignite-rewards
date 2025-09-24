import { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
// import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Navigate, Link } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
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
  // Star,
  // Zap,
  Gift,
  Users,
  Building2,
  Vote,
  // ExternalLink,
  // Shield
} from "lucide-react";
// import LoyaltyCardTab from "@/components/dashboard/LoyaltyCardTab";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import RewardsTracker from "@/components/solana/RewardsTracker";
import LoyaltyAccountLinking from "@/components/LoyaltyAccountLinking";
import PointConversionSystem from "@/components/PointConversionSystem";
import MarketplaceMain from "@/components/marketplace/MarketplaceMain";
import UserNFTManager from "@/components/UserNFTManager";
import LoyaltyCardHeader from "@/components/LoyaltyCardHeader";
import NFTManagementPanel from "@/components/nft/NFTManagementPanel";
import DAOGovernancePanel from "@/components/dao/DAOGovernancePanel";
// import { format } from 'date-fns';
import { 
  // DAOOrganization, 
  // DAOProposal, 
  // DAOMember, 
  // ProposalStatus 
} from '@/types/dao';
import { DAOService } from '@/lib/daoService';

const UserDashboard = () => {
  const { user, signOut } = useSecureAuth();
  const { toast } = useToast();
  // const { refreshData } = useSmartDataRefresh();
  
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  // const [currentUser, setCurrentUser] = useState<any>(null);
  // const [userMembership, setUserMembership] = useState<DAOMember | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  // const [daoLoading, setDaoLoading] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  // const [showProposalDetails, setShowProposalDetails] = useState(false);
  // const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  // const [daoStats, setDaoStats] = useState({
  //   total_members: 0,
  //   total_proposals: 0,
  //   participation_rate: 0,
  //   average_voting_power: 0
  // });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
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
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadDAOData = async () => {
    try {
      setDaoLoading(true);
      
      // Load DAO organizations
      const organizations = await DAOService.getOrganizations();
      
      if (organizations.length > 0) {
        const daoId = organizations[0].id;
        
        // Load proposals for the first organization
        const daoProposals = await DAOService.getProposals(daoId);
        setProposals(daoProposals);
        
        // Load DAO statistics
        const stats = await DAOService.getDAOStats(daoId);
        setDaoStats(stats);
      } else {
        // Create sample data if no organizations exist
        const sampleProposals: DAOProposal[] = [
          {
            id: 'proposal-1',
            dao_id: 'dao-1',
            title: 'Increase NFT Multiplier Cap',
            description: 'Proposal to increase the maximum NFT multiplier from 2.0x to 2.5x for diamond tier holders.',
            proposal_type: 'marketplace_config',
            status: 'active',
            choices: ['Yes', 'No', 'Abstain'],
            votes: { 'Yes': 15, 'No': 3, 'Abstain': 2 },
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
    try {
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

  // const castVote = async (proposalId: string, choice: string, reason?: string) => {
  //   try {
  //     if (!userMembership) {
  //       toast({
  //         title: "Membership Required",
  //         description: "You must be a DAO member to vote on proposals.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     await DAOService.castVote(proposalId, currentUser.id, choice, userMembership.voting_power, reason);

  //     toast({
  //       title: "Vote Cast Successfully",
  //       description: `Your vote for "${choice}" has been recorded.`,
  //     });

  //     // Refresh proposals to show updated vote counts
  //     loadDAOData();
  //   } catch (error) {
  //     console.error('Error casting vote:', error);
  //     toast({
  //       title: "Voting Failed",
  //       description: "Failed to cast vote. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // Load DAO data when DAO section is active
  useEffect(() => {
    if (activeSection === 'dao') {
      loadDAOData();
      checkUserMembership();
    }
  }, [activeSection]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-r-blue-500/40 rounded-full animate-spin animation-delay-150"></div>
          </div>
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
      <header className="relative z-50 border-b bg-slate-950/80 backdrop-blur-xl border-purple-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/25">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    RAC Rewards
                  </h1>
                  <p className="text-sm text-gray-400">Your Digital Rewards Hub</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Information */}
              <div className={`flex items-center space-x-3 ${
                isLoaded ? 'animate-fade-in-up animation-delay-100' : 'opacity-0'
              }`}>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-400">Welcome back!</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
                  </span>
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
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
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
                <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
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

        {/* Loyalty Card Header - Prominent Display */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-500' : 'opacity-0'
        }`}>
          <LoyaltyCardHeader />
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
                  Loyalty
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                Loyalty Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Manage your loyalty cards and track your rewards
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">1</span>
                <span className="text-sm text-gray-400">active card</span>
              </div>
              <Button 
                size="sm" 
                className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                View Cards
              </Button>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('loyalty-networks')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                  Networks
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                Loyalty Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Connect with partner loyalty programs
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">5</span>
                <span className="text-sm text-gray-400">partners</span>
              </div>
              <Button 
                size="sm" 
                className="mt-4 w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                Connect
              </Button>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveSection('referrals')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  Refer
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors">
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Invite friends and earn bonus rewards
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">3</span>
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
            onClick={() => setActiveSection('nft-management')} 
            className="cursor-pointer group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  NFT
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                NFT Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Manage your loyalty NFT, evolution, and auto-staking
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">1</span>
                <span className="text-sm text-gray-400">NFT owned</span>
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

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/25">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Earned</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">2,450</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg shadow-blue-500/25">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Programs</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        {activeSection === 'overview' && (
          <div className={`space-y-8 ${
            isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
          }`}>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                      <Coins className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Earned 50 points from Starbucks</p>
                      <p className="text-gray-400 text-sm">2 hours ago</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      +50 pts
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Redeemed free coffee</p>
                      <p className="text-gray-400 text-sm">1 day ago</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      -100 pts
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
        {activeSection === 'nft-management' && <NFTManagementPanel />}
        
        {activeSection === 'dao' && <DAOGovernancePanel />}
      </main>
    </div>
  );
};

export default UserDashboard;
