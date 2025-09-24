import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Users, 
  RefreshCw,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { daoService, DAOOrganization, Proposal } from '@/services/daoService';

// Interfaces are now imported from daoService

interface VotingStats {
  total_proposals: number;
  active_proposals: number;
  passed_proposals: number;
  failed_proposals: number;
  total_voters: number;
  total_daos: number;
}

const DAOPublic = () => {
  const logger = createModuleLogger('DAOPublic');
  const { profile } = useSecureAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [daoOrganizations, setDaoOrganizations] = useState<DAOOrganization[]>([]);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDAO, setSelectedDAO] = useState<string>('all');
  const { toast } = useToast();

  const isDAOMember = profile?.role === 'admin' || profile?.role === 'dao_member';

  const loadDAOOrganizations = async () => {
    try {
      const organizations = await daoService.getDAOOrganizations();
      setDaoOrganizations(organizations);
    } catch (error) {
      logger.error('Error loading DAO organizations', error);
    }
  };

  const loadProposals = async () => {
    try {
      setLoading(true);
      const proposals = await daoService.getProposals();
      setProposals(proposals);
    } catch (error) {
      logger.error('Error loading proposals', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotingStats = async () => {
    try {
      const stats = await daoService.getVotingStats();
      setVotingStats(stats);
    } catch (error) {
      logger.error('Error loading voting stats', error);
    }
  };

  const voteOnProposal = async (proposalId: string, voteType: 'yes' | 'no') => {
    if (!isDAOMember || !profile?.id) {
      toast({
        title: "Access Denied",
        description: "Only DAO members can vote on proposals.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVoting(proposalId);
      
      const success = await daoService.submitVote(proposalId, voteType, profile.id);
      
      if (success) {
        toast({
          title: "Vote Submitted",
          description: `Your ${voteType} vote has been recorded for this proposal.`,
        });

        // Reload proposals to show updated vote counts
        await loadProposals();
      } else {
        throw new Error('Failed to submit vote');
      }
      
    } catch (error) {
      logger.error('Error voting on proposal', error);
      toast({
        title: "Voting Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  useEffect(() => {
    loadDAOOrganizations();
    loadProposals();
  }, []);

  useEffect(() => {
    if (proposals.length > 0 || daoOrganizations.length > 0) {
      loadVotingStats();
    }
  }, [proposals, daoOrganizations]);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.proposer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesDAO = selectedDAO === 'all' || proposal.dao_id === selectedDAO;
    return matchesSearch && matchesStatus && matchesDAO;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 border-gray-500/20">Draft</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Active</Badge>;
      case 'passed':
        return <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20">Failed</Badge>;
      case 'executed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Executed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatVotingType = (votingType: string) => {
    switch (votingType) {
      case 'simple_majority':
        return 'Simple Majority';
      case 'super_majority':
        return 'Super Majority';
      case 'unanimous':
        return 'Unanimous';
      default:
        return votingType;
    }
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient relative overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading DAO proposals...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            DAO Voting
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in the decentralized governance of the rewards system. 
            View proposals, vote on changes, and help shape the future of the platform.
          </p>
        </div>

        {/* Voting Statistics */}
        {votingStats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{votingStats.total_daos}</div>
                <div className="text-sm text-muted-foreground">Active DAOs</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{votingStats.total_proposals}</div>
                <div className="text-sm text-muted-foreground">Total Proposals</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{votingStats.active_proposals}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{votingStats.passed_proposals}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-red-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{votingStats.failed_proposals}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-purple-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500">{votingStats.total_voters.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Active Voters</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'passed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('passed')}
                  size="sm"
                >
                  Passed
                </Button>
                <Button
                  variant={statusFilter === 'failed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('failed')}
                  size="sm"
                >
                  Failed
                </Button>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedDAO}
                  onChange={(e) => setSelectedDAO(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">All DAOs</option>
                  {daoOrganizations.map((dao) => (
                    <option key={dao.id} value={dao.id}>
                      {dao.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
              <CardContent className="p-8 text-center">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Proposals Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No proposals match your current filters.' 
                    : 'No proposals have been submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5 text-primary" />
                      {proposal.title}
                    </CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Proposal Description */}
                    <div>
                      <p className="text-muted-foreground">{proposal.description}</p>
                    </div>

                    {/* Proposal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <div className="text-lg font-semibold text-foreground">
                          {formatCategory(proposal.category)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Voting Type</label>
                        <div className="text-lg font-semibold text-foreground">
                          {formatVotingType(proposal.voting_type)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">DAO</label>
                        <div className="text-lg font-semibold text-foreground">
                          {daoOrganizations.find(dao => dao.id === proposal.dao_id)?.name || 'Unknown DAO'}
                        </div>
                      </div>
                    </div>

                    {/* Proposal Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Proposed by: {proposal.proposer_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {formatTime(proposal.created_at)}</span>
                      </div>
                      {proposal.start_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Voting Started: {formatTime(proposal.start_time)}</span>
                        </div>
                      )}
                      {proposal.end_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Voting Ends: {formatTime(proposal.end_time)}</span>
                        </div>
                      )}
                    </div>

                    {/* Voting Section */}
                    {proposal.status === 'active' && isDAOMember && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Vote on this proposal (DAO members only)
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => voteOnProposal(proposal.id, 'no')}
                              disabled={voting === proposal.id}
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                            >
                              {voting === proposal.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              No
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => voteOnProposal(proposal.id, 'yes')}
                              disabled={voting === proposal.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {voting === proposal.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Yes
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vote Counts */}
                    {proposal.total_votes > 0 && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{proposal.yes_votes} Yes</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>{proposal.no_votes} No</span>
                            </div>
                            {proposal.abstain_votes > 0 && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span>•</span>
                                <span>{proposal.abstain_votes} Abstain</span>
                              </div>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            Total: {proposal.total_votes} votes
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* DAO Member Notice */}
        {!isDAOMember && (
          <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 mt-8">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Become a DAO Member</h3>
              <p className="text-muted-foreground mb-4">
                DAO members can vote on proposals and help shape the future of the platform.
                Contact the admin to become a DAO member.
              </p>
              <Button variant="outline">
                Learn More About DAO Membership
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DAOPublic;
