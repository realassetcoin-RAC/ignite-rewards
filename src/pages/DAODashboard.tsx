import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Vote, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Settings,
  Wallet,
  Calendar,
  Hash,
  DollarSign,
  Target,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { useSmartDataRefresh } from '@/hooks/useSmartDataRefresh';

const DAODashboard = () => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [members, setMembers] = useState<DAOMember[]>([]);
  const [daoStats, setDaoStats] = useState<DAOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<DAOMember | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDAOData();
    checkUserMembership();
    setIsLoaded(true);
  }, []);

  // Smart data refresh for DAO data
  const refreshDAOData = async () => {
    console.log('🔄 Refreshing DAO data...');
    await loadDAOData();
    await checkUserMembership();
  };

  useSmartDataRefresh(refreshDAOData, {
    debounceMs: 3000,
    enabled: true
  });

  const checkUserMembership = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      // For now, create a mock membership for all authenticated users
      // In production, this would check the actual database
      const mockMembership: DAOMember = {
        id: `member-${user.id}`,
        dao_id: 'sample-dao-1',
        user_id: user.id,
        wallet_address: 'Mock123...',
        role: 'member',
        governance_tokens: 1000, // Default tokens for new members
        voting_power: 3.0,
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_active: true,
        user_email: user.email,
        user_full_name: user.user_metadata?.full_name || 'DAO Member'
      };

      setUserMembership(mockMembership);
    } catch (error) {
      console.error('Error checking user membership:', error);
    }
  };

  const loadDAOData = async () => {
    try {
      setLoading(true);
      
      // Load sample DAO data (in a real app, this would come from the database)
      const sampleDAO: DAOOrganization = {
        id: 'sample-dao-1',
        name: 'RAC Rewards DAO',
        description: 'Governance for the RAC Rewards loyalty platform',
        logo_url: '/rac-card.jpg',
        governance_token_symbol: 'RAC',
        min_proposal_threshold: 1000,
        voting_period_days: 7,
        execution_delay_hours: 24,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67,
        governance_token_decimals: 9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      // Sample proposals
      const sampleProposals: DAOProposal[] = [
        {
          id: 'prop-1',
          dao_id: 'sample-dao-1',
          proposer_id: 'user-1',
          title: 'Increase loyalty point rewards by 20%',
          description: 'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
          full_description: 'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system.',
          category: 'governance',
          voting_type: 'simple_majority',
          status: 'active',
          start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          total_votes: 45,
          yes_votes: 28,
          no_votes: 12,
          abstain_votes: 5,
          participation_rate: 75.0,
          treasury_impact_amount: 0,
          treasury_impact_currency: 'SOL',
          tags: ['rewards', 'engagement', 'merchants'],
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dao_name: 'RAC Rewards DAO',
          proposer_email: 'admin@rac.com',
          proposer_tokens: 5000,
          voting_status: 'active',
          can_vote: true,
          can_execute: false
        },
        {
          id: 'prop-2',
          dao_id: 'sample-dao-1',
          proposer_id: 'user-2',
          title: 'Add Solana USDC as payment option',
          description: 'Enable USDC payments on Solana blockchain for loyalty transactions',
          full_description: 'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC. This would require integration with Solana wallet providers and USDC token handling.',
          category: 'technical',
          voting_type: 'super_majority',
          status: 'passed',
          start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          execution_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          total_votes: 52,
          yes_votes: 38,
          no_votes: 8,
          abstain_votes: 6,
          participation_rate: 86.7,
          treasury_impact_amount: 5000,
          treasury_impact_currency: 'USDC',
          tags: ['solana', 'usdc', 'payments', 'blockchain'],
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          executed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          dao_name: 'RAC Rewards DAO',
          proposer_email: 'dev@rac.com',
          proposer_tokens: 3000,
          voting_status: 'ended',
          can_vote: false,
          can_execute: false
        },
        {
          id: 'prop-3',
          dao_id: 'sample-dao-1',
          proposer_id: 'user-3',
          title: 'Implement quadratic voting for governance',
          description: 'Change voting mechanism from simple majority to quadratic voting',
          full_description: 'This proposal would implement quadratic voting to reduce the influence of large token holders and promote more democratic decision-making. The voting power would be calculated as the square root of token holdings.',
          category: 'governance',
          voting_type: 'super_majority',
          status: 'draft',
          treasury_impact_amount: 0,
          treasury_impact_currency: 'SOL',
          tags: ['voting', 'governance', 'democracy'],
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          abstain_votes: 0,
          participation_rate: 0,
          dao_name: 'RAC Rewards DAO',
          proposer_email: 'governance@rac.com',
          proposer_tokens: 2000,
          voting_status: 'upcoming',
          can_vote: false,
          can_execute: false
        }
      ];

      // Sample members
      const sampleMembers: DAOMember[] = [
        {
          id: 'member-1',
          dao_id: 'sample-dao-1',
          user_id: 'user-1',
          wallet_address: 'ABC123...',
          role: 'admin',
          governance_tokens: 5000,
          voting_power: 15.2,
          joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          user_email: 'admin@rac.com',
          user_full_name: 'Admin User'
        },
        {
          id: 'member-2',
          dao_id: 'sample-dao-1',
          user_id: 'user-2',
          wallet_address: 'DEF456...',
          role: 'moderator',
          governance_tokens: 3000,
          voting_power: 9.1,
          joined_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          user_email: 'dev@rac.com',
          user_full_name: 'Developer User'
        },
        {
          id: 'member-3',
          dao_id: 'sample-dao-1',
          user_id: 'user-3',
          wallet_address: 'GHI789...',
          role: 'member',
          governance_tokens: 2000,
          voting_power: 6.1,
          joined_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          is_active: true,
          user_email: 'governance@rac.com',
          user_full_name: 'Governance User'
        }
      ];

      // Add current user as a member if they're not already in the list
      if (currentUser && !sampleMembers.find(m => m.user_id === currentUser.id)) {
        sampleMembers.push({
          id: `member-${currentUser.id}`,
          dao_id: 'sample-dao-1',
          user_id: currentUser.id,
          wallet_address: 'Mock123...',
          role: 'member',
          governance_tokens: 1000,
          voting_power: 3.0,
          joined_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          is_active: true,
          user_email: currentUser.email,
          user_full_name: currentUser.user_metadata?.full_name || 'DAO Member'
        });
      }

      // Sample stats
      const sampleStats: DAOStats = {
        total_members: 127,
        active_members: 89,
        total_proposals: 23,
        active_proposals: 1,
        total_treasury_value: 125000,
        treasury_currency: 'SOL',
        participation_rate: 78.5,
        average_voting_power: 8.3
      };

      setProposals(sampleProposals);
      setMembers(sampleMembers);
      setDaoStats(sampleStats);

    } catch (error) {
      console.error('Error loading DAO data:', error);
      toast({
        title: "Error",
        description: "Failed to load DAO data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || proposal.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const calculateVotingProgress = (proposal: DAOProposal) => {
    if (proposal.total_votes === 0) return 0;
    return (proposal.yes_votes / proposal.total_votes) * 100;
  };

  // Only require authentication, not specific DAO membership
  if (!currentUser) {
    return (
      <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        <Card className="relative z-10 w-full max-w-md card-gradient border-primary/20 backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Vote className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access the RAC Rewards DAO.
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-full overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Vote className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold text-foreground ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}>
                RAC Rewards DAO
              </h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50"
            >
              <button onClick={() => navigate('/')} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </button>
            </Button>
          </div>
          <p className={`text-sm sm:text-base text-muted-foreground ${
            isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
          }`}>
            Decentralized governance for the RAC Rewards platform
          </p>
          {userMembership && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Member: {userMembership.governance_tokens.toLocaleString()} RAC tokens
              </Badge>
              <Badge variant="outline">
                {MEMBER_ROLES[userMembership.role].label}
              </Badge>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {daoStats && (
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  {daoStats.total_members}
                </div>
                <p className="text-xs text-muted-foreground">
                  {daoStats.active_members} active
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                <Vote className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {daoStats.active_proposals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {daoStats.total_proposals} total
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Treasury</CardTitle>
                <Coins className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">
                  {daoStats.total_treasury_value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {daoStats.treasury_currency}
                </p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participation</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-primary bg-clip-text text-transparent">
                  {daoStats.participation_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg voting power: {daoStats.average_voting_power.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className={`mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1">
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setActiveTab('proposals')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'proposals'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Vote className="h-4 w-4" />
                <span className="hidden sm:inline">Proposals</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'members'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </button>
              <button
                onClick={() => setActiveTab('treasury')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'treasury'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">Treasury</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <Card className="card-gradient border-primary/20 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search proposals..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-background/60 backdrop-blur-md border-primary/30"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProposalStatus | 'all')}>
                      <SelectTrigger className="w-full sm:w-48 bg-background/60 backdrop-blur-md border-primary/30">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="executed">Executed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-48 bg-background/60 backdrop-blur-md border-primary/30">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {PROPOSAL_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
                      <DialogTrigger asChild>
                        <Button className="btn-gradient">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Proposal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Proposal</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 text-center">
                          <p className="text-muted-foreground">
                            Proposal creation form will be implemented here.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Proposals List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading proposals...</p>
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <Card className="card-gradient border-primary/20 backdrop-blur-md">
                    <CardContent className="p-8 text-center">
                      <Vote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Proposals Found</h3>
                      <p className="text-muted-foreground mb-4">
                        No proposals match your current filters.
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                        }}
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredProposals.map((proposal) => (
                    <Card key={proposal.id} className="card-gradient border-primary/20 backdrop-blur-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(proposal.status)}
                                <h3 className="text-lg font-semibold text-foreground">
                                  {proposal.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </Badge>
                                <Badge variant="outline">
                                  {proposal.category}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground mb-4">
                              {proposal.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created {format(new Date(proposal.created_at), 'MMM dd, yyyy')}
                              </div>
                              {proposal.end_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {proposal.voting_status === 'active' ? (
                                    <>Ends in {formatTimeRemaining(proposal.end_time)}</>
                                  ) : (
                                    <>Ended {format(new Date(proposal.end_time), 'MMM dd, yyyy')}</>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Hash className="h-4 w-4" />
                                {proposal.total_votes} votes
                              </div>
                              {proposal.treasury_impact_amount > 0 && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {proposal.treasury_impact_amount} {proposal.treasury_impact_currency}
                                </div>
                              )}
                            </div>

                            {/* Voting Progress */}
                            {proposal.status === 'active' && proposal.total_votes > 0 && (
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Voting Progress</span>
                                  <span>{proposal.participation_rate.toFixed(1)}% participation</span>
                                </div>
                                <Progress value={calculateVotingProgress(proposal)} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>Yes: {proposal.yes_votes}</span>
                                  <span>No: {proposal.no_votes}</span>
                                  <span>Abstain: {proposal.abstain_votes}</span>
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {proposal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {proposal.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 lg:min-w-[200px]">
                            {proposal.status === 'active' && proposal.can_vote && (
                              <Button className="btn-gradient w-full">
                                <Vote className="w-4 h-4 mr-2" />
                                Vote
                              </Button>
                            )}
                            <Button variant="outline" className="w-full bg-background/60 backdrop-blur-md border-primary/30">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            {proposal.external_links && Object.keys(proposal.external_links).length > 0 && (
                              <Button variant="outline" size="sm" className="w-full bg-background/60 backdrop-blur-md border-primary/30">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Links
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <Card className="card-gradient border-primary/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    DAO Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-background/60 backdrop-blur-md border border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.user_full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold">{member.user_full_name}</div>
                            <div className="text-sm text-muted-foreground">{member.user_email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">{member.governance_tokens.toLocaleString()} RAC</div>
                            <div className="text-sm text-muted-foreground">{member.voting_power.toFixed(1)}% voting power</div>
                          </div>
                          <Badge className={member.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                           member.role === 'moderator' ? 'bg-blue-100 text-blue-800' : 
                                           'bg-green-100 text-green-800'}>
                            {MEMBER_ROLES[member.role].label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Treasury Tab */}
          {activeTab === 'treasury' && (
            <div className="space-y-6">
              <Card className="card-gradient border-primary/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Treasury Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Treasury Dashboard</h3>
                    <p className="text-muted-foreground">
                      Treasury management features will be implemented here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card className="card-gradient border-primary/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    DAO Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                    <p className="text-muted-foreground">
                      Voting patterns and participation analytics will be displayed here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DAODashboard;
