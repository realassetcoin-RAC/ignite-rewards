import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Settings,
  Shield,
  Zap,
  Plus
} from 'lucide-react';
import { DAOService } from '@/lib/daoService';
import { DAOProposalService } from '@/lib/daoProposalService';

interface DAOGovernancePanelProps {
  className?: string;
}

const DAOGovernancePanel: React.FC<DAOGovernancePanelProps> = ({ className = '' }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDAOData();
    }
  }, [user?.id]);

  const loadDAOData = async () => {
    try {
      setLoading(true);
      
      // Load DAO organizations
      const orgs = await DAOService.getOrganizations();
      setOrganizations(orgs);
      
      // Load pending proposals
      const pendingProposals = await DAOProposalService.getPendingProposals();
      setProposals(pendingProposals);
      
      // Load user membership (if any)
      if (orgs.length > 0) {
        const membership = await DAOService.getUserMembership(orgs[0].id, user?.id);
        setUserMembership(membership);
      }
      
    } catch (error) {
      console.error('Error loading DAO data:', error);
      toast({
        title: "Error",
        description: "Failed to load DAO data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, voteType: 'yes' | 'no' | 'abstain') => {
    try {
      const votingPower = userMembership?.voting_power || 1.0;
      const result = await DAOProposalService.voteOnProposal(proposalId, user?.id, voteType, votingPower);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        loadDAOData();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to cast vote",
        variant: "destructive"
      });
    }
  };

  const handleJoinDAO = async () => {
    try {
      if (organizations.length === 0) return;
      
      const result = await DAOService.joinDAO(
        organizations[0].id, 
        user?.id, 
        user?.email || '', 
        user?.user_metadata?.full_name || 'User'
      );
      
      setUserMembership(result);
      toast({
        title: "Success",
        description: "Successfully joined the DAO!"
      });
    } catch (error) {
      console.error('Error joining DAO:', error);
      toast({
        title: "Error",
        description: "Failed to join DAO",
        variant: "destructive"
      });
    }
  };

  const getProposalTypeIcon = (type: string) => {
    switch (type) {
      case 'marketplace_config': return <TrendingUp className="w-4 h-4" />;
      case 'nft_config': return <Zap className="w-4 h-4" />;
      case 'rewards_config': return <Settings className="w-4 h-4" />;
      case 'governance': return <Shield className="w-4 h-4" />;
      default: return <Vote className="w-4 h-4" />;
    }
  };

  const getProposalTypeColor = (type: string) => {
    switch (type) {
      case 'marketplace_config': return 'bg-blue-500';
      case 'nft_config': return 'bg-purple-500';
      case 'rewards_config': return 'bg-green-500';
      case 'governance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'implemented': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-white/70">Loading DAO data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* DAO Overview */}
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="w-6 h-6 text-orange-500" />
            <span>DAO Governance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{organizations[0].name}</h3>
                  <p className="text-white/70">{organizations[0].description}</p>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Governance Token</p>
                  <p className="text-lg font-semibold text-white">{organizations[0].governance_token_symbol}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Voting Period</p>
                  <p className="text-lg font-semibold text-white">{organizations[0].voting_period_days} days</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Quorum</p>
                  <p className="text-lg font-semibold text-white">{organizations[0].quorum_percentage}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Super Majority</p>
                  <p className="text-lg font-semibold text-white">{organizations[0].super_majority_threshold}%</p>
                </div>
              </div>
              
              {userMembership ? (
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Your Membership</p>
                    <p className="text-lg font-semibold text-white capitalize">{userMembership.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Voting Power</p>
                    <p className="text-lg font-semibold text-white">{userMembership.voting_power}x</p>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleJoinDAO}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join DAO
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Users className="w-12 h-12 text-orange-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">No DAO Organizations</h3>
                <p className="text-white/70">No DAO organizations are currently available.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposals */}
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Vote className="w-6 h-6 text-orange-500" />
            <span>Active Proposals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getProposalTypeColor(proposal.proposal_type)}`}>
                        {getProposalTypeIcon(proposal.proposal_type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{proposal.title}</h4>
                        <p className="text-sm text-gray-400 capitalize">
                          {proposal.proposal_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </div>
                  
                  <p className="text-white/70">{proposal.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Ends: {new Date(proposal.voting_end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {userMembership && proposal.status === 'active' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleVote(proposal.id, 'yes')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Yes
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleVote(proposal.id, 'no')}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          No
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleVote(proposal.id, 'abstain')}
                          variant="outline"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Abstain
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Vote className="w-12 h-12 text-orange-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">No Active Proposals</h3>
                <p className="text-white/70">There are currently no active proposals to vote on.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Proposal Button */}
      {userMembership && (
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Plus className="w-12 h-12 text-orange-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Create New Proposal</h3>
                <p className="text-white/70">Submit a proposal for community voting</p>
              </div>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DAOGovernancePanel;
