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
  Play,
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
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [newProposal, setNewProposal] = useState<{ title: string; description: string; category: string; voting_type: VotingType }>(
    { title: '', description: '', category: 'governance', voting_type: 'simple_majority' }
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<DAOMember | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
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
      if (!user) {
        setAuthLoading(false);
        return;
      }

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
      console.log('DAO: User membership set:', mockMembership);
    } catch (error) {
      console.error('Error checking user membership:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDAOData = async () => {
    try {
      setLoading(true);
      // Load DAO org
      const { data: orgs, error: orgErr } = await supabase
        .from('dao_organizations')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      if (orgErr) {
        console.error('Error loading DAO organization:', orgErr);
      }
      const org = orgs && orgs.length > 0 ? orgs[0] as any : null;
      if (org) {
        setSelectedOrgId(org.id);
      }

      // Load proposals
      if (org) {
        const { data: dbProposals, error: propErr } = await supabase
          .from('dao_proposals')
          .select('*')
          .eq('dao_id', org.id)
          .order('created_at', { ascending: false });
        if (propErr) {
          console.error('Error loading proposals:', propErr);
        }
        const mapped: DAOProposal[] = (dbProposals || []).map((p: any) => ({
          id: p.id,
          dao_id: p.dao_id,
          proposer_id: p.proposer_id,
          title: p.title,
          description: p.description,
          full_description: p.full_description,
          category: p.category,
          voting_type: p.voting_type,
          status: p.status,
          start_time: p.start_time,
          end_time: p.end_time,
          execution_time: p.execution_time,
          total_votes: p.total_votes,
          yes_votes: p.yes_votes,
          no_votes: p.no_votes,
          abstain_votes: p.abstain_votes,
          participation_rate: p.participation_rate,
          treasury_impact_amount: 0,
          treasury_impact_currency: 'SOL',
          tags: [],
          created_at: p.created_at,
          updated_at: p.updated_at,
          dao_name: org.name,
          proposer_email: '',
          proposer_tokens: 0,
          voting_status: p.status === 'active' ? 'active' : (p.status === 'draft' ? 'upcoming' : 'ended'),
          can_vote: !!currentUser,
          can_execute: false
        }));
        setProposals(mapped);
      } else {
        setProposals([]);
      }

      // Load members
      if (org) {
        const { data: dbMembers, error: memErr } = await supabase
          .from('dao_members')
          .select('*')
          .eq('dao_id', org.id)
          .order('joined_at', { ascending: false });
        if (memErr) {
          console.error('Error loading members:', memErr);
        }
        const mappedMembers: DAOMember[] = (dbMembers || []).map((m: any) => ({
          id: m.id,
          dao_id: m.dao_id,
          user_id: m.user_id,
          wallet_address: m.wallet_address,
          role: m.role,
          governance_tokens: Number(m.governance_tokens) || 0,
          voting_power: Number(m.voting_power) || 0,
          joined_at: m.joined_at,
          last_active_at: m.last_active_at,
          is_active: m.is_active,
          user_email: m.user_email,
          user_full_name: m.user_full_name
        }));
        setMembers(mappedMembers);
      } else {
        setMembers([]);
      }

      // Basic stats
      if (org) {
        const stats: DAOStats = {
          total_members: members.length,
          active_members: members.filter(m => m.is_active).length,
          total_proposals: proposals.length,
          active_proposals: proposals.filter(p => p.status === 'active').length,
          total_treasury_value: 0,
          treasury_currency: 'SOL',
          participation_rate: proposals.length > 0 ? (
            proposals.reduce((acc, p) => acc + (p.participation_rate || 0), 0) / proposals.length
          ) : 0,
          average_voting_power: members.length > 0 ? (
            members.reduce((acc, m) => acc + (m.voting_power || 0), 0) / members.length
          ) : 0
        };
        setDaoStats(stats);
      } else {
        setDaoStats(null);
      }

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

  const handleCreateProposal = async () => {
    try {
      if (!currentUser || !selectedOrgId) return;
      const payload = {
        dao_id: selectedOrgId,
        proposer_id: currentUser.id,
        title: newProposal.title,
        description: newProposal.description,
        category: newProposal.category,
        voting_type: newProposal.voting_type,
        status: 'draft'
      } as any;
      const { error } = await supabase.from('dao_proposals').insert([payload]);
      if (error) {
        toast({ title: 'Error', description: 'Failed to create proposal', variant: 'destructive' });
        return;
      }
      setShowCreateProposal(false);
      setNewProposal({ title: '', description: '', category: 'governance', voting_type: 'simple_majority' });
      await loadDAOData();
      toast({ title: 'Proposal Created', description: 'Proposal saved as draft.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create proposal', variant: 'destructive' });
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

  const handleVote = async (proposalId: string, choice: 'yes' | 'no' | 'abstain', reason?: string) => {
    try {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to vote on proposals.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('cast_vote', {
        user_id_param: currentUser.id,
        proposal_id_param: proposalId,
        choice_param: choice,
        reason_param: reason || null
      });

      if (error) {
        console.error('Voting error:', error);
        toast({
          title: "Voting Failed",
          description: error.message || "Failed to cast vote. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Vote Cast Successfully",
        description: `Your ${choice} vote has been recorded.`,
      });

      // Refresh the data to show updated vote counts
      await loadDAOData();
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while voting.",
        variant: "destructive",
      });
    }
  };

  const handleStartProposal = async (proposalId: string) => {
    try {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to start proposals.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dao_proposals')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .eq('id', proposalId)
        .eq('proposer_id', currentUser.id);

      if (error) {
        console.error('Error starting proposal:', error);
        toast({
          title: "Failed to Start Proposal",
          description: error.message || "You can only start your own proposals.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proposal Started",
        description: "The proposal is now active for voting.",
      });

      await loadDAOData();
    } catch (error) {
      console.error('Error starting proposal:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    try {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to execute proposals.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dao_proposals')
        .update({ 
          status: 'executed',
          execution_time: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) {
        console.error('Error executing proposal:', error);
        toast({
          title: "Failed to Execute Proposal",
          description: error.message || "Failed to execute proposal.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proposal Executed",
        description: "The proposal has been executed successfully.",
      });

      await loadDAOData();
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getUserVote = async (proposalId: string) => {
    try {
      if (!currentUser) return null;

      const { data, error } = await supabase
        .from('dao_votes')
        .select('choice, reason, created_at')
        .eq('proposal_id', proposalId)
        .eq('voter_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user vote:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user vote:', error);
      return null;
    }
  };

  const handleViewDetails = (proposal: DAOProposal) => {
    setSelectedProposal(proposal);
    setShowProposalDetails(true);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        <Card className="relative z-10 w-full max-w-md card-gradient border-primary/20 backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Vote className="h-8 w-8 text-primary-foreground animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Loading DAO...
            </h2>
            <p className="text-muted-foreground mb-4">
              Please wait while we load the RAC Rewards DAO.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                                  <span>Approve: {proposal.yes_votes}</span>
                                  <span>Reject: {proposal.no_votes}</span>
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
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-500 hover:bg-green-600 text-white border-green-500 w-full"
                                    onClick={() => handleVote(proposal.id, 'yes')}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-red-500 hover:bg-red-600 text-white border-red-500 w-full"
                                    onClick={() => handleVote(proposal.id, 'no')}
                                  >
                                    Reject
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                                    onClick={() => handleVote(proposal.id, 'abstain')}
                                  >
                                    Abstain
                                  </Button>
                                </div>
                              </div>
                            )}
                            {userMembership && (
                              <div className="text-xs text-muted-foreground text-center">
                                Your voting power: {userMembership.voting_power}%
                              </div>
                            )}
                            {proposal.status === 'draft' && proposal.proposer_id === currentUser?.id && (
                              <Button 
                                className="btn-gradient w-full"
                                onClick={() => handleStartProposal(proposal.id)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Voting
                              </Button>
                            )}
                            {proposal.status === 'passed' && userMembership?.role === 'admin' && (
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                onClick={() => handleExecuteProposal(proposal.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Execute
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              className="w-full bg-background/60 backdrop-blur-md border-primary/30"
                              onClick={() => handleViewDetails(proposal)}
                            >
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

      {/* Proposal Details Modal */}
      <Dialog open={showProposalDetails} onOpenChange={setShowProposalDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(selectedProposal?.status || 'draft')}
              {selectedProposal?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Proposal Status and Metadata */}
              <div className="flex flex-wrap items-center gap-4">
                <Badge className={getStatusColor(selectedProposal.status)}>
                  {selectedProposal.status.charAt(0).toUpperCase() + selectedProposal.status.slice(1)}
                </Badge>
                <Badge variant="outline">{selectedProposal.category}</Badge>
                <Badge variant="secondary">{selectedProposal.voting_type.replace('_', ' ')}</Badge>
                {selectedProposal.treasury_impact_amount > 0 && (
                  <Badge variant="outline" className="text-green-600">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {selectedProposal.treasury_impact_amount} {selectedProposal.treasury_impact_currency}
                  </Badge>
                )}
              </div>

              {/* Proposal Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground mb-4">{selectedProposal.description}</p>
                
                {selectedProposal.full_description && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Full Details</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedProposal.full_description}
                    </p>
                  </div>
                )}
              </div>

              {/* Voting Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voting Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(selectedProposal.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {selectedProposal.start_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voting Started:</span>
                        <span>{format(new Date(selectedProposal.start_time), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                    {selectedProposal.end_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voting Ends:</span>
                        <span>{format(new Date(selectedProposal.end_time), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                    {selectedProposal.execution_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Executed:</span>
                        <span>{format(new Date(selectedProposal.execution_time), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voting Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Votes:</span>
                        <span className="font-semibold">{selectedProposal.total_votes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Participation Rate:</span>
                        <span className="font-semibold">{selectedProposal.participation_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {selectedProposal.total_votes > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Approve:</span>
                          <span className="font-semibold">{selectedProposal.yes_votes}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Reject:</span>
                          <span className="font-semibold">{selectedProposal.no_votes}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Abstain:</span>
                          <span className="font-semibold">{selectedProposal.abstain_votes}</span>
                        </div>
                        
                        <div className="mt-3">
                          <Progress value={calculateVotingProgress(selectedProposal)} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1 text-center">
                            {calculateVotingProgress(selectedProposal).toFixed(1)}% Approve
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              {selectedProposal.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {selectedProposal.external_links && Object.keys(selectedProposal.external_links).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">External Links</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedProposal.external_links).map(([key, url]) => (
                      <div key={key} className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {key}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedProposal.status === 'active' && selectedProposal.can_vote && (
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white border-green-500 w-full"
                      onClick={() => {
                        handleVote(selectedProposal.id, 'yes');
                        setShowProposalDetails(false);
                      }}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white border-red-500 w-full"
                      onClick={() => {
                        handleVote(selectedProposal.id, 'no');
                        setShowProposalDetails(false);
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                      onClick={() => {
                        handleVote(selectedProposal.id, 'abstain');
                        setShowProposalDetails(false);
                      }}
                    >
                      Abstain
                    </Button>
                  </div>
                )}
                {selectedProposal.status === 'draft' && selectedProposal.proposer_id === currentUser?.id && (
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      handleStartProposal(selectedProposal.id);
                      setShowProposalDetails(false);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Voting
                  </Button>
                )}
                {selectedProposal.status === 'passed' && userMembership?.role === 'admin' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleExecuteProposal(selectedProposal.id);
                      setShowProposalDetails(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Execute Proposal
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowProposalDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DAODashboard;
