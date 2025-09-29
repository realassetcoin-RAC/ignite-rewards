import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Vote, 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface DAOOrganization {
  id: string;
  name: string;
  description: string;
  governance_token: string;
  treasury_address?: string;
  voting_threshold: number;
  proposal_threshold: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'suspended';
  member_count: number;
  total_proposals: number;
  active_proposals: number;
}

interface DAOProposal {
  id: string;
  dao_id: string;
  proposer_id: string;
  title: string;
  description: string;
  category: string;
  voting_type: string;
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  votes_for: number;
  votes_against: number;
  total_votes: number;
  created_at: string;
  voting_start: string;
  voting_end: string;
  proposer_name?: string;
}

interface DAOMember {
  id: string;
  dao_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin' | 'founder';
  governance_tokens: number;
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

const DAOManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('organizations');
  const [organizations, setOrganizations] = useState<DAOOrganization[]>([]);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [members, setMembers] = useState<DAOMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDAO, setShowCreateDAO] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  
  // Form states
  const [newDAO, setNewDAO] = useState({
    name: 'Real Asset Coin $RAC',
    description: '$RAC is the governance token for the ecosystem',
    logo_url: 'D:\\RAC\\RAC_Logo.png',
    website_url: 'https://openrac.io',
    discord_url: '',
    twitter_url: '',
    github_url: '',
    governance_token_address: 'Coming Soon',
    governance_token_symbol: '$RAC',
    governance_token_decimals: 9,
    min_proposal_threshold: 1,
    voting_period_days: 7,
    execution_delay_hours: 24,
    quorum_percentage: 10.0,
    super_majority_threshold: 66.67,
    treasury_address: ''
  });

  const [newProposal, setNewProposal] = useState({
    dao_id: '',
    title: '',
    description: '',
    category: 'governance',
    voting_type: 'simple_majority'
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOrganizations(),
        loadProposals(),
        loadMembers()
      ]);
    } catch (error) {
      console.error('Error loading DAO data:', error);
      // Don't show error toast for empty DAO data - this is normal for new installations
      if (error instanceof Error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        toast({
          title: "Error",
          description: "Failed to load DAO data.",
          variant: "destructive",
        });
      } else {
        console.log('DAO tables may not exist yet or are empty - this is normal for new installations');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('dao_organizations')
        .select(`
          *,
          dao_members(count),
          dao_proposals(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orgsWithStats = data?.map(org => ({
        ...org,
        member_count: org.dao_members?.[0]?.count || 0,
        total_proposals: org.dao_proposals?.[0]?.count || 0,
        active_proposals: 0 // Will be calculated separately
      })) || [];

      setOrganizations(orgsWithStats);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizations([]);
    }
  };

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('dao_proposals')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const proposalsWithNames = data?.map(proposal => ({
        ...proposal,
        proposer_name: proposal.profiles?.full_name || 'Unknown'
      })) || [];

      setProposals(proposalsWithNames);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setProposals([]);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('dao_members')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const membersWithNames = data?.map(member => ({
        ...member,
        user_name: member.profiles?.full_name || 'Unknown',
        user_email: member.profiles?.email || 'Unknown'
      })) || [];

      setMembers(membersWithNames);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    }
  };

  const handleCreateDAO = async () => {
    try {
      if (!newDAO.name || !newDAO.description) {
        toast({
          title: "Validation Error",
          description: "Name and description are required.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dao_organizations')
        .insert([{
          name: newDAO.name,
          description: newDAO.description,
          governance_token: newDAO.governance_token,
          treasury_address: newDAO.treasury_address || null,
          voting_threshold: newDAO.voting_threshold,
          proposal_threshold: newDAO.proposal_threshold,
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "DAO organization created successfully.",
      });

      setShowCreateDAO(false);
      setNewDAO({
        name: 'Real Asset Coin $RAC',
        description: '$RAC is the governance token for the ecosystem',
        logo_url: 'D:\\RAC\\RAC_Logo.png',
        website_url: 'https://openrac.io',
        discord_url: '',
        twitter_url: '',
        github_url: '',
        governance_token_address: 'Coming Soon',
        governance_token_symbol: '$RAC',
        governance_token_decimals: 9,
        min_proposal_threshold: 1,
        voting_period_days: 7,
        execution_delay_hours: 24,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67,
        treasury_address: ''
      });
      await loadOrganizations();
    } catch (error) {
      console.error('Error creating DAO:', error);
      toast({
        title: "Error",
        description: "Failed to create DAO organization.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProposal = async () => {
    try {
      if (!newProposal.dao_id || !newProposal.title || !newProposal.description) {
        toast({
          title: "Validation Error",
          description: "DAO, title, and description are required.",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create proposals.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dao_proposals')
        .insert([{
          dao_id: newProposal.dao_id,
          proposer_id: user.id,
          title: newProposal.title,
          description: newProposal.description,
          category: newProposal.category,
          voting_type: newProposal.voting_type,
          status: 'draft',
          votes_for: 0,
          votes_against: 0,
          total_votes: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal created successfully.",
      });

      setShowCreateProposal(false);
      setNewProposal({
        dao_id: '',
        title: '',
        description: '',
        category: 'governance',
        voting_type: 'simple_majority'
      });
      await loadProposals();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to create proposal.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      Draft: { color: 'bg-yellow-100 text-yellow-800', icon: Edit },
      Passed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      Executed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      Cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      founder: { color: 'bg-purple-100 text-purple-800' },
      admin: { color: 'bg-red-100 text-red-800' },
      moderator: { color: 'bg-blue-100 text-blue-800' },
      member: { color: 'bg-green-100 text-green-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member;

    return (
      <Badge className={config.color}>
        {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organizations">DAO Organizations</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* DAO Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">DAO Organizations</h3>
              <p className="text-sm text-muted-foreground">
                Manage DAO organizations and their settings
              </p>
            </div>
            <Dialog open={showCreateDAO} onOpenChange={setShowCreateDAO}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create DAO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New DAO Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div>
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        value={newDAO.name}
                        onChange={(e) => setNewDAO(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter organization name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newDAO.description}
                        onChange={(e) => setNewDAO(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter organization description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={newDAO.logo_url}
                        onChange={(e) => setNewDAO(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="Enter logo URL or file path"
                      />
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Media & Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input
                          id="website_url"
                          value={newDAO.website_url}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, website_url: e.target.value }))}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discord_url">Discord URL</Label>
                        <Input
                          id="discord_url"
                          value={newDAO.discord_url}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, discord_url: e.target.value }))}
                          placeholder="https://discord.gg/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter_url">Twitter URL</Label>
                        <Input
                          id="twitter_url"
                          value={newDAO.twitter_url}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, twitter_url: e.target.value }))}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="github_url">GitHub URL</Label>
                        <Input
                          id="github_url"
                          value={newDAO.github_url}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, github_url: e.target.value }))}
                          placeholder="https://github.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Governance Token */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Governance Token</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="governance_token_symbol">Token Symbol *</Label>
                        <Input
                          id="governance_token_symbol"
                          value={newDAO.governance_token_symbol}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, governance_token_symbol: e.target.value }))}
                          placeholder="$RAC"
                        />
                      </div>
                      <div>
                        <Label htmlFor="governance_token_address">Token Address</Label>
                        <Input
                          id="governance_token_address"
                          value={newDAO.governance_token_address}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, governance_token_address: e.target.value }))}
                          placeholder="Coming Soon"
                        />
                      </div>
                      <div>
                        <Label htmlFor="governance_token_decimals">Token Decimals</Label>
                        <Input
                          id="governance_token_decimals"
                          type="number"
                          min="0"
                          max="18"
                          value={newDAO.governance_token_decimals}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, governance_token_decimals: parseInt(e.target.value) }))}
                          placeholder="9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Governance Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Governance Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_proposal_threshold">Min Proposal Threshold</Label>
                        <Input
                          id="min_proposal_threshold"
                          type="number"
                          min="0"
                          value={newDAO.min_proposal_threshold}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, min_proposal_threshold: parseInt(e.target.value) }))}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="voting_period_days">Voting Period (Days)</Label>
                        <Input
                          id="voting_period_days"
                          type="number"
                          min="1"
                          max="365"
                          value={newDAO.voting_period_days}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, voting_period_days: parseInt(e.target.value) }))}
                          placeholder="7"
                        />
                      </div>
                      <div>
                        <Label htmlFor="execution_delay_hours">Execution Delay (Hours)</Label>
                        <Input
                          id="execution_delay_hours"
                          type="number"
                          min="0"
                          max="168"
                          value={newDAO.execution_delay_hours}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, execution_delay_hours: parseInt(e.target.value) }))}
                          placeholder="24"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quorum_percentage">Quorum Percentage</Label>
                        <Input
                          id="quorum_percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={newDAO.quorum_percentage}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, quorum_percentage: parseFloat(e.target.value) }))}
                          placeholder="10.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="super_majority_threshold">Super Majority Threshold</Label>
                        <Input
                          id="super_majority_threshold"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={newDAO.super_majority_threshold}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, super_majority_threshold: parseFloat(e.target.value) }))}
                          placeholder="66.67"
                        />
                      </div>
                      <div>
                        <Label htmlFor="treasury_address">Treasury Address</Label>
                        <Input
                          id="treasury_address"
                          value={newDAO.treasury_address}
                          onChange={(e) => setNewDAO(prev => ({ ...prev, treasury_address: e.target.value }))}
                          placeholder="Enter treasury wallet address"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowCreateDAO(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDAO}>
                      Create DAO
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {organizations.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Vote className="w-5 h-5" />
                        {org.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {org.description}
                      </p>
                    </div>
                    {getStatusBadge(org.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Members:</span>
                      <p className="font-medium">{org.member_count}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proposals:</span>
                      <p className="font-medium">{org.total_proposals}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Voting Threshold:</span>
                      <p className="font-medium">{org.voting_threshold}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Token:</span>
                      <p className="font-medium">{org.governance_token}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">DAO Proposals</h3>
              <p className="text-sm text-muted-foreground">
                Manage and monitor DAO proposals
              </p>
            </div>
            <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dao_id">DAO Organization</Label>
                    <Select value={newProposal.dao_id} onValueChange={(value) => setNewProposal(prev => ({ ...prev, dao_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select DAO" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input
                      id="title"
                      value={newProposal.title}
                      onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter proposal title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProposal.description}
                      onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter proposal description"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newProposal.category} onValueChange={(value) => setNewProposal(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="governance">Governance</SelectItem>
                          <SelectItem value="treasury">Treasury</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="voting_type">Voting Type</Label>
                      <Select value={newProposal.voting_type} onValueChange={(value) => setNewProposal(prev => ({ ...prev, voting_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple_majority">Simple Majority</SelectItem>
                          <SelectItem value="super_majority">Super Majority</SelectItem>
                          <SelectItem value="unanimous">Unanimous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateProposal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProposal}>
                      Create Proposal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>DAO</TableHead>
                    <TableHead>Proposer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">{proposal.title}</TableCell>
                      <TableCell>
                        {organizations.find(org => org.id === proposal.dao_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{proposal.proposer_name}</TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>For: {proposal.votes_for}</div>
                          <div>Against: {proposal.votes_against}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(proposal.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">DAO Members</h3>
            <p className="text-sm text-muted-foreground">
              View and manage DAO members across all organizations
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>DAO</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.user_name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{member.user_email || 'No email'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {organizations.find(org => org.id === member.dao_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role || 'member')}</TableCell>
                      <TableCell>{(member.governance_tokens || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {member.joined_at ? format(new Date(member.joined_at), 'MMM dd, yyyy') : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DAOManager;
