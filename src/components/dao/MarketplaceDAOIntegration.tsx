import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Vote, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Building2,
  Settings,
  Users
} from 'lucide-react';
import { DAOMarketplaceProposal } from '@/types/marketplace';

// interface MarketplaceDAOIntegrationProps {
//   onProposalCreated?: (proposal: DAOMarketplaceProposal) => void;
// }

const MarketplaceDAOIntegration: React.FC = (/* _props */) => {
  const [proposals, setProposals] = useState<DAOMarketplaceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      // TODO: Replace with actual API call to load marketplace DAO proposals
      const mockProposals: DAOMarketplaceProposal[] = [
        {
          id: '1',
          proposal_type: 'listing_approval',
          listing_id: 'listing_123',
          title: 'Approve Downtown Office Building Listing',
          description: 'Request to approve the downtown office building tokenized asset listing with $5M funding goal.',
          proposed_changes: {
            listing_type: 'asset',
            total_funding_goal: 5000000,
            expected_return_rate: 12.5,
            risk_level: 'medium'
          },
          status: 'pending',
          created_by: 'admin_user_id',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          proposal_type: 'marketplace_config_change',
          title: 'Update Minimum Investment Amount',
          description: 'Proposal to increase the minimum investment amount from $100 to $250.',
          proposed_changes: {
            minimum_investment: 250,
            maximum_investment: 100000
          },
          status: 'approved',
          created_by: 'admin_user_id',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          approved_at: new Date(Date.now() - 43200000).toISOString(),
        }
      ];

      setProposals(mockProposals);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load DAO proposals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const _createProposal = async (listingId: string, listingData: any) => {
  //   try {
  //     const proposal: DAOMarketplaceProposal = {
  //       id: crypto.randomUUID(),
  //       proposal_type: 'listing_approval',
  //       listing_id: listingId,
  //       title: `Approve ${listingData.title} Listing`,
  //       description: `Request to approve the ${listingData.title} tokenized asset listing with $${listingData.total_funding_goal.toLocaleString()} funding goal.`,
  //       proposed_changes: {
  //         listing_type: listingData.listing_type,
  //         total_funding_goal: listingData.total_funding_goal,
  //         expected_return_rate: listingData.expected_return_rate,
  //         risk_level: listingData.risk_level,
  //         asset_type: listingData.asset_type,
  //         campaign_type: listingData.campaign_type
  //       },
  //       status: 'pending',
  //       created_by: 'current_user_id', // This would come from auth context
  //       created_at: new Date().toISOString(),
  //     };

  //     // TODO: Implement actual API call to create DAO proposal
  //     setProposals(prev => [proposal, ...prev]);
  //     
  //     toast({
  //       title: "DAO Proposal Created",
  //       description: "A DAO proposal has been created for listing approval. Community voting will begin shortly.",
  //     });

  //     onProposalCreated?.(proposal);
  //   } catch {
  //     toast({
  //       title: "Error",
  //       description: "Failed to create DAO proposal",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const _createConfigProposal = async (configChanges: any) => {
  //   try {
  //     const proposal: DAOMarketplaceProposal = {
  //       id: crypto.randomUUID(),
  //       proposal_type: 'marketplace_config_change',
  //       title: 'Update Marketplace Configuration',
  //       description: 'Proposal to update marketplace configuration settings.',
  //       proposed_changes: configChanges,
  //       status: 'pending',
  //       created_by: 'current_user_id', // This would come from auth context
  //       created_at: new Date().toISOString(),
  //     };

  //     // TODO: Implement actual API call to create DAO proposal
  //     setProposals(prev => [proposal, ...prev]);
  //     
  //     toast({
  //       title: "DAO Proposal Created",
  //       description: "A DAO proposal has been created for configuration changes. Community voting will begin shortly.",
  //     });

  //     onProposalCreated?.(proposal);
  //   } catch {
  //     toast({
  //       title: "Error",
  //       description: "Failed to create DAO proposal",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'implemented': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProposalTypeIcon = (type: string) => {
    switch (type) {
      case 'listing_approval': return <Building2 className="w-4 h-4" />;
      case 'marketplace_config_change': return <Settings className="w-4 h-4" />;
      case 'nft_tier_update': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getProposalTypeLabel = (type: string) => {
    switch (type) {
      case 'listing_approval': return 'Listing Approval';
      case 'marketplace_config_change': return 'Config Change';
      case 'nft_tier_update': return 'NFT Tier Update';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Marketplace DAO Integration</h2>
        <p className="text-gray-400">
          All marketplace changes require DAO approval following project conventions.
        </p>
      </div>

      {/* DAO Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Vote className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Pending Proposals</p>
                <p className="text-2xl font-bold text-white">
                  {proposals.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Approved This Month</p>
                <p className="text-2xl font-bold text-white">
                  {proposals.filter(p => p.status === 'approved' && 
                    new Date(p.approved_at || '').getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Total Proposals</p>
                <p className="text-2xl font-bold text-white">{proposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Proposals */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent DAO Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <div className="text-center py-8">
                <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Proposals Yet</h3>
                <p className="text-gray-400">
                  DAO proposals will appear here when marketplace changes are requested.
                </p>
              </div>
            ) : (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-600 rounded-lg">
                      {getProposalTypeIcon(proposal.proposal_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{proposal.title}</h4>
                      <p className="text-sm text-gray-400">{proposal.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className="bg-slate-600 text-slate-300">
                          {getProposalTypeLabel(proposal.proposal_type)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </Badge>
                    {proposal.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/dao', '_blank')}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Vote className="w-4 h-4 mr-2" />
                        Vote
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* DAO Integration Info */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-purple-400 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">DAO Approval Required</h3>
              <p className="text-gray-300 text-sm mb-4">
                Following project conventions, all marketplace changes must go through DAO approval:
              </p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• New marketplace listings require community approval</li>
                <li>• Configuration changes must be voted on by DAO members</li>
                <li>• NFT tier updates need governance approval</li>
                <li>• All changes are transparent and community-driven</li>
              </ul>
              <Button
                onClick={() => window.open('/dao', '_blank')}
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Vote className="w-4 h-4 mr-2" />
                View DAO Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketplaceDAOIntegration;
