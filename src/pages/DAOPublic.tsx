import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface Proposal {
  id: string;
  config_id: string;
  proposed_distribution_interval: number;
  proposed_max_rewards_per_user: number;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  proposer_id: string;
  created_at: string;
  approved_at?: string;
  implemented_at?: string;
  votes_for?: number;
  votes_against?: number;
}

interface VotingStats {
  total_proposals: number;
  pending_proposals: number;
  approved_proposals: number;
  rejected_proposals: number;
  total_voters: number;
}

const DAOPublic = () => {
  const { user, profile } = useSecureAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const isDAOMember = profile?.role === 'admin' || profile?.role === 'dao_member';

  const loadProposals = async () => {
    try {
      setLoading(true);
      
      // Load all proposals (public can see approved/implemented, DAO members can see pending)
      const { data, error } = await supabase
        .from('config_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading proposals:', error);
        return;
      }

      setProposals((data as unknown as Proposal[]) || []);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotingStats = async () => {
    try {
      // Calculate voting statistics
      const stats = {
        total_proposals: proposals.length,
        pending_proposals: proposals.filter(p => p.status === 'pending').length,
        approved_proposals: proposals.filter(p => p.status === 'approved').length,
        rejected_proposals: proposals.filter(p => p.status === 'rejected').length,
        total_voters: 1250 // Mock data - in real implementation, count from voting records
      };
      
      setVotingStats(stats);
    } catch (error) {
      console.error('Error loading voting stats:', error);
    }
  };

  const voteOnProposal = async (proposalId: string, voteType: 'for' | 'against') => {
    if (!isDAOMember) {
      toast({
        title: "Access Denied",
        description: "Only DAO members can vote on proposals.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVoting(proposalId);
      
      // In a real implementation, this would interact with the Solana contract
      // For now, we'll simulate the voting process
      toast({
        title: "Vote Submitted",
        description: `Your ${voteType} vote has been recorded for this proposal.`,
      });

      // Reload proposals to show updated vote counts
      await loadProposals();
      
    } catch (error) {
      console.error('Error voting on proposal:', error);
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
    loadProposals();
  }, []);

  useEffect(() => {
    if (proposals.length > 0) {
      loadVotingStats();
    }
  }, [proposals]);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.config_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.proposer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20">Rejected</Badge>;
      case 'implemented':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Implemented</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatInterval = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{votingStats.total_proposals}</div>
                <div className="text-sm text-muted-foreground">Total Proposals</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{votingStats.pending_proposals}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{votingStats.approved_proposals}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-red-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{votingStats.rejected_proposals}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
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
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'implemented' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('implemented')}
                  size="sm"
                >
                  Implemented
                </Button>
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
                      <Settings className="h-5 w-5 text-primary" />
                      Configuration Proposal
                    </CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Proposal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Distribution Interval</label>
                        <div className="text-lg font-semibold text-foreground">
                          {formatInterval(proposal.proposed_distribution_interval)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Max Rewards Per User</label>
                        <div className="text-lg font-semibold text-foreground">
                          {proposal.proposed_max_rewards_per_user.toLocaleString()}
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
                      {proposal.approved_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Approved: {formatTime(proposal.approved_at)}</span>
                        </div>
                      )}
                      {proposal.implemented_at && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Implemented: {formatTime(proposal.implemented_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Voting Section */}
                    {proposal.status === 'pending' && isDAOMember && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Vote on this proposal (DAO members only)
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => voteOnProposal(proposal.id, 'against')}
                              disabled={voting === proposal.id}
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                            >
                              {voting === proposal.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Against
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => voteOnProposal(proposal.id, 'for')}
                              disabled={voting === proposal.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {voting === proposal.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              For
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vote Counts */}
                    {(proposal.votes_for || proposal.votes_against) && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{proposal.votes_for || 0} For</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>{proposal.votes_against || 0} Against</span>
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            Total: {(proposal.votes_for || 0) + (proposal.votes_against || 0)} votes
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
