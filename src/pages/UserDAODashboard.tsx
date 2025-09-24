import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Vote, 
  Search, 
  TrendingUp, 
  Users, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Hash,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Sparkles,
  User,
  Shield,
  LogOut,
  Bug
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { format } from 'date-fns';
import { 
  DAOProposal, 
  DAOMember, 
  DAOStats, 
  ProposalStatus, 
  PROPOSAL_CATEGORIES,
  MEMBER_ROLES
} from '@/types/dao';
import { useSmartDataRefresh } from '@/hooks/useSmartDataRefresh';
import { DAOService } from '@/lib/daoService';
import { SetupDAOTestData } from '@/lib/setupDAOTestData';
import { FixedTestDataService } from '@/lib/fixedTestDataService';
import { DebugLogger } from '@/lib/debugLogger';
import { DebugPanel } from '@/components/DebugPanel';
import { createModuleLogger } from '@/utils/consoleReplacer';

const UserDAODashboard = () => {
  const logger = createModuleLogger('UserDAODashboard');
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [members, setMembers] = useState<DAOMember[]>([]);
  const [daoStats, setDaoStats] = useState<DAOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<DAOMember | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSettingUpTestData, setIsSettingUpTestData] = useState(false);
  const [testDataExists, setTestDataExists] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Map<string, string>>(new Map());
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useSecureAuth();

  useEffect(() => {
    loadDAOData();
    checkUserMembership();
    checkTestDataExists();
    setIsLoaded(true);
  }, [loadDAOData, checkUserMembership]);

  useEffect(() => {
    if (currentUser) {
      loadUserVotes();
    }
  }, [currentUser, loadUserVotes]);

  // Smart data refresh for DAO data
  const refreshDAOData = async () => {
    logger.info('Refreshing DAO data');
    await loadDAOData();
    await checkUserMembership();
    await loadUserVotes();
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

      // Get DAO organizations to find the user's membership
      const organizations = await DAOService.getOrganizations();
      if (organizations.length > 0) {
        const daoId = organizations[0].id;
        const membership = await DAOService.getUserMembership(daoId, user.id);
        
        if (membership) {
          setUserMembership(membership);
          logger.debug('User membership loaded', membership);
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
      logger.error('Error checking user membership', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadUserVotes = async () => {
    try {
      if (!currentUser) {
        setUserVotes(new Map());
        return;
      }

      const { data, error } = await supabase
        .from('dao_votes' as any)
        .select('proposal_id, vote_choice')
        .eq('voter_id', currentUser.id);

      if (error) {
        logger.error('Error loading user votes', error);
        return;
      }

      const votesMap = new Map<string, string>();
      if (data && Array.isArray(data)) {
        data.forEach((vote: any) => {
          votesMap.set(vote.proposal_id, vote.vote_choice);
        });
      }
      setUserVotes(votesMap);
    } catch (error) {
      logger.error('Error loading user votes', error);
    }
  };

  const loadDAOData = async () => {
    try {
      setLoading(true);
      
      // Load DAO organizations from database
      const organizations = await DAOService.getOrganizations();
      if (organizations.length === 0) {
        logger.warn('No DAO organizations found');
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

      // Use database data (no fallback to sample data)
      setProposals(proposalsData);
      setMembers(membersData);
      setDaoStats(statsData);

    } catch (error) {
      logger.error('Error loading DAO data', error);
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

  const checkTestDataExists = async () => {
    try {
      const exists = await SetupDAOTestData.checkTestDataExists();
      setTestDataExists(exists);
    } catch (error) {
      logger.error('Error checking test data', error);
    }
  };

  const setupTestData = async () => {
    setIsSettingUpTestData(true);
    DebugLogger.info('DAO_SETUP', 'Starting test data setup');
    
    try {
      // Use the fixed service that handles errors better
      const result = await FixedTestDataService.createComprehensiveTestData();
      
      if (result.success) {
        DebugLogger.info('DAO_SETUP', 'Test data setup successful', result);
        toast({
          title: "Success",
          description: result.message,
        });
        setTestDataExists(true);
        // Reload DAO data to show the new test data
        await loadDAOData();
      } else {
        DebugLogger.error('DAO_SETUP', 'Test data setup failed', result);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      DebugLogger.error('DAO_SETUP', 'Test data setup exception', error);
      logger.error('Error setting up test data', error);
      toast({
        title: "Error",
        description: "Failed to set up test data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpTestData(false);
    }
  };

  const handleVote = async (proposalId: string, choice: 'yes' | 'no' | 'abstain', reason?: string) => {
    // Prevent multiple simultaneous votes on the same proposal
    if (votingInProgress.has(proposalId)) {
      logger.warn('Vote already in progress for proposal', proposalId);
      return;
    }

    // Check if user has already voted on this proposal
    if (userVotes.has(proposalId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted on this proposal.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to vote on proposals.",
          variant: "destructive",
        });
        return;
      }

      if (!userMembership) {
        toast({
          title: "Membership Required",
          description: "You must be a DAO member to vote on proposals.",
          variant: "destructive",
        });
        return;
      }

      // Set voting in progress
      setVotingInProgress(prev => new Set(prev).add(proposalId));

      // All proposals from database should be votable
      await DAOService.castVote(proposalId, currentUser.id, choice, userMembership.voting_power, reason);

      // Update user votes state
      setUserVotes(prev => new Map(prev).set(proposalId, choice));

      toast({
        title: "Vote Cast Successfully",
        description: `Your ${choice} vote has been recorded.`,
      });

      // Refresh the data to show updated vote counts
      await loadDAOData();
    } catch (error) {
      logger.error('Error casting vote', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while voting.';
      toast({
        title: "Voting Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Remove voting in progress
      setVotingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  const handleViewDetails = (proposal: DAOProposal) => {
    setSelectedProposal(proposal);
    setShowProposalDetails(true);
  };

  const getUserVoteForProposal = (proposalId: string): string | null => {
    return userVotes.get(proposalId) || null;
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
    <div className="min-h-screen hero-gradient relative">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      <div className="relative z-10 w-full max-w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4" style={{maxWidth: '100%', overflow: 'hidden'}}>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}>
                    PointBridge DAO
                  </h1>
                  <p className={`text-xs sm:text-sm text-gray-400 truncate ${
                    isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                  }`}>
                    Decentralized governance for the RAC Rewards platform
                  </p>
                </div>
              </div>
            </div>
            
            {/* Authentication Status and Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  {/* User Status Badge */}
                  <Badge 
                    variant="outline" 
                    className="border-primary/40 text-primary bg-primary/10 backdrop-blur-sm flex-shrink-0"
                  >
                    {isAdmin ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Admin</span>
                        <span className="sm:hidden">A</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Member</span>
                        <span className="sm:hidden">M</span>
                      </>
                    )}
                  </Badge>
                  
                  {/* User Info */}
                  <div className="hidden md:flex flex-col items-end min-w-0">
                    <span className="text-sm font-medium text-white truncate max-w-32">
                      {profile?.full_name || user.email}
                    </span>
                    <span className="text-xs text-white/70">
                      Connected
                    </span>
                  </div>
                  
                  {/* Sign Out Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={signOut}
                    className="bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 flex-shrink-0"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 flex-shrink-0"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/')}
                className="group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 flex-shrink-0"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
              
              {/* Debug Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugPanel(true)}
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md hover:from-yellow-500/30 hover:to-orange-500/30 border-yellow-500/30 hover:border-yellow-500/50 flex-shrink-0"
              >
                <Bug className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Debug</span>
                <span className="sm:hidden">Debug</span>
              </Button>

              {/* Setup Test Data Button */}
              {!testDataExists && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={setupTestData}
                  disabled={isSettingUpTestData}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md hover:from-green-500/30 hover:to-emerald-500/30 border-green-500/30 hover:border-green-500/50 flex-shrink-0"
                >
                  {isSettingUpTestData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                      <span className="hidden sm:inline">Setting up...</span>
                      <span className="sm:hidden">Setup...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Setup Test Data</span>
                      <span className="sm:hidden">Setup</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* DAO Membership Status */}
          {userMembership && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Vote className="w-3 h-3 mr-1" />
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

        {/* Navigation Tabs - Only Proposals, Members, and Treasury */}
        <div className={`mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1" style={{overflowX: 'hidden', maxWidth: '100%'}}>
            <div className="flex w-full" style={{maxWidth: '100%'}}>
              <button
                onClick={() => setActiveTab('proposals')}
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'proposals'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '33.333%'}}
              >
                <Vote className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate text-xs">Proposals</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'members'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '33.333%'}}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate text-xs">Members</span>
              </button>
              <button
                onClick={() => setActiveTab('treasury')}
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'treasury'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                style={{minWidth: 0, maxWidth: '33.333%'}}
              >
                <Coins className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate text-xs">Treasury</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              {/* Filters and Search - No Create Proposal Button */}
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
                        {!testDataExists 
                          ? "No DAO test data has been set up yet. Click the button below to create test data for testing the DAO functionality."
                          : "No proposals match your current filters."
                        }
                      </p>
                      {!testDataExists ? (
                        <Button 
                          onClick={setupTestData}
                          disabled={isSettingUpTestData}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          {isSettingUpTestData ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Setting up test data...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Setup DAO Test Data
                            </>
                          )}
                        </Button>
                      ) : (
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
                      )}
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
                                    className="!bg-green-500 !hover:bg-green-600 !text-white !border-green-500 w-full"
                                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                    onClick={() => handleVote(proposal.id, 'yes')}
                                    disabled={votingInProgress.has(proposal.id) || userVotes.has(proposal.id)}
                                  >
                                    {votingInProgress.has(proposal.id) ? 'Voting...' : 'Approve'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="!bg-red-500 !hover:bg-red-600 !text-white !border-red-500 w-full"
                                    style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                                    onClick={() => handleVote(proposal.id, 'no')}
                                    disabled={votingInProgress.has(proposal.id) || userVotes.has(proposal.id)}
                                  >
                                    {votingInProgress.has(proposal.id) ? 'Voting...' : 'Reject'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="!bg-white !border-gray-300 !text-gray-700 !hover:bg-gray-50 w-full"
                                    style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#374151' }}
                                    onClick={() => handleVote(proposal.id, 'abstain')}
                                    disabled={votingInProgress.has(proposal.id) || userVotes.has(proposal.id)}
                                  >
                                    {votingInProgress.has(proposal.id) ? 'Voting...' : 'Abstain'}
                                  </Button>
                                </div>
                                {getUserVoteForProposal(proposal.id) && (
                                  <div className="text-xs text-center mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      ✓ You voted: {getUserVoteForProposal(proposal.id)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {userMembership && (
                              <div className="text-xs text-muted-foreground text-center">
                                Your voting power: {userMembership.voting_power}%
                              </div>
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
                      className="!bg-green-500 !hover:bg-green-600 !text-white !border-green-500 w-full"
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                      onClick={() => {
                        handleVote(selectedProposal.id, 'yes');
                        setShowProposalDetails(false);
                      }}
                      disabled={votingInProgress.has(selectedProposal.id) || userVotes.has(selectedProposal.id)}
                    >
                      {votingInProgress.has(selectedProposal.id) ? 'Voting...' : 'Approve'}
                    </Button>
                    <Button 
                      size="sm" 
                      className="!bg-red-500 !hover:bg-red-600 !text-white !border-red-500 w-full"
                      style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => {
                        handleVote(selectedProposal.id, 'no');
                        setShowProposalDetails(false);
                      }}
                      disabled={votingInProgress.has(selectedProposal.id) || userVotes.has(selectedProposal.id)}
                    >
                      {votingInProgress.has(selectedProposal.id) ? 'Voting...' : 'Reject'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="!bg-white !border-gray-300 !text-gray-700 !hover:bg-gray-50 w-full"
                      style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#374151' }}
                      onClick={() => {
                        handleVote(selectedProposal.id, 'abstain');
                        setShowProposalDetails(false);
                      }}
                      disabled={votingInProgress.has(selectedProposal.id) || userVotes.has(selectedProposal.id)}
                    >
                      {votingInProgress.has(selectedProposal.id) ? 'Voting...' : 'Abstain'}
                    </Button>
                  </div>
                )}
                {getUserVoteForProposal(selectedProposal.id) && (
                  <div className="text-center pt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      ✓ You voted: {getUserVoteForProposal(selectedProposal.id)}
                    </span>
                  </div>
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

      {/* Debug Panel */}
      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
    </div>
  );
};

export default UserDAODashboard;
