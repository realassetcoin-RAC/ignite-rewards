import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MarketplaceService } from '@/lib/marketplaceService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  Users, 
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { 
  MarketplaceListing, 
  CreateListingRequest, 
  MarketplaceStats,
  NFTCardTier
} from '@/types/marketplace';
import { formatCurrency } from '@/lib/marketplaceUtils';
import MarketplaceDAOIntegration from '@/components/dao/MarketplaceDAOIntegration';

interface MarketplaceManagerProps {
  onStatsUpdate?: () => void;
}

const MarketplaceManager: React.FC<MarketplaceManagerProps> = ({ onStatsUpdate }) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [nftTiers, setNftTiers] = useState<NFTCardTier[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');
  const { toast } = useToast();

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateListingRequest>({
    title: '',
    description: '',
    short_description: '',
    image_url: '',
    listing_type: 'asset',
    total_funding_goal: 0,
    campaign_type: 'open_ended',
    expected_return_rate: 0,
    risk_level: 'medium',
    minimum_investment: 100,
    asset_type: 'other',
    tags: []
  });

  // Real data will be loaded from the database

  // Real data will be loaded from the database

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading marketplace data...');
      const [listingsData, statsData] = await Promise.all([
        MarketplaceService.getListings(),
        MarketplaceService.getMarketplaceStats()
      ]);
      
      setListings(listingsData);
      setStats(statsData);
      setNftTiers([]); // TODO: Implement NFT tiers service
      console.log('Marketplace data loaded successfully');
    } catch {
      console.error('Failed to load marketplace data');
      // Set empty data instead of mock data
      setListings([]);
      setNftTiers([]);
      setStats(null);
      
      toast({
        title: "Error",
        description: "Failed to load marketplace data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (saveAsDraft = false) => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description) {
        toast({
          title: "Validation Error",
          description: "Title and description are required fields",
          variant: "destructive",
        });
        return;
      }

      if (!saveAsDraft) {
        // Following project conventions: Any changes that change the behavior of the loyalty application must create a DAO record for voting
        // Create a DAO proposal for listing approval instead of directly creating the listing
        
          // const _proposalData = {
          // proposal_type: 'listing_approval',
          // title: `Approve ${formData.title} Listing`,
          // description: `Request to approve the ${formData.title} tokenized asset listing with $${formData.total_funding_goal.toLocaleString()} funding goal.`,
          // proposed_changes: {
          //   listing_type: formData.listing_type,
          //   total_funding_goal: formData.total_funding_goal,
          //   expected_return_rate: formData.expected_return_rate,
          //   risk_level: formData.risk_level,
          //   asset_type: formData.asset_type,
          //   campaign_type: formData.campaign_type,
          //   minimum_investment: formData.minimum_investment,
          //   maximum_investment: formData.maximum_investment,
          //   description: formData.description,
          //   short_description: formData.short_description,
          //   image_url: formData.image_url
          // }
          // };

        // Create a draft listing that requires DAO approval
        const newListing = await MarketplaceService.createListing({
          ...formData,
          status: 'draft' // Draft status until DAO approval
        });

        setListings(prev => [...prev, newListing]);
        setShowCreateModal(false);
        resetForm();
        
        toast({
          title: "DAO Proposal Required",
          description: "Listing created as draft. DAO approval required before it can go live.",
        });
      } else {
        // Save as draft without DAO proposal
        const draftListing = await MarketplaceService.createListing({
          ...formData,
          status: 'draft'
        });

        setListings(prev => [...prev, draftListing]);
        setShowCreateModal(false);
        resetForm();
        
        toast({
          title: "Draft Saved",
          description: "Listing saved as draft. You can review and publish it later.",
        });
      }

      onStatsUpdate?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    }
  };

  const handleUpdateListing = async (id: string, updates: Partial<MarketplaceListing>) => {
    try {
      // TODO: Implement actual API call
      setListings(prev => prev.map(listing => 
        listing.id === id ? { ...listing, ...updates, updated_at: new Date().toISOString() } : listing
      ));
      
      toast({
        title: "Success",
        description: "Listing updated successfully",
      });

      onStatsUpdate?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      // TODO: Implement actual API call
      setListings(prev => prev.filter(listing => listing.id !== id));
      
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });

      onStatsUpdate?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const handleEditListing = (listing: MarketplaceListing) => {
    setFormData({
      title: listing.title,
      description: listing.description,
      short_description: listing.short_description || '',
      image_url: listing.image_url || '',
      listing_type: listing.listing_type,
      total_funding_goal: listing.total_funding_goal,
      campaign_type: listing.campaign_type,
      expected_return_rate: listing.expected_return_rate || 0,
      risk_level: listing.risk_level,
      minimum_investment: listing.minimum_investment,
      maximum_investment: listing.maximum_investment,
      asset_type: listing.asset_type || 'other',
      tags: listing.tags || []
    });
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      short_description: '',
      image_url: '',
      listing_type: 'asset',
      total_funding_goal: 0,
      campaign_type: 'open_ended',
      expected_return_rate: 0,
      risk_level: 'medium',
      minimum_investment: 100,
      asset_type: 'other',
      tags: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'pending_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'funded': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rejected': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'draft': return 'Draft';
      case 'pending_review': return 'Pending Review';
      case 'funded': return 'Funded';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="nft-tiers">NFT Tiers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="dao">DAO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Marketplace Listings</h2>
              <p className="text-gray-400">Manage tokenized assets and initiatives</p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Marketplace Listing</DialogTitle>
                </DialogHeader>
                <CreateListingForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateListing}
                  onCancel={() => setShowCreateModal(false)}
                  showDraftOption={true}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Listings Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="text-left p-4 text-gray-300">Listing</th>
                      <th className="text-left p-4 text-gray-300">Type</th>
                      <th className="text-left p-4 text-gray-300">Status</th>
                      <th className="text-left p-4 text-gray-300">Funding</th>
                      <th className="text-left p-4 text-gray-300">Investors</th>
                      <th className="text-left p-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {listing.image_url && (
                              <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-white">{listing.title}</p>
                              <p className="text-sm text-gray-400">{listing.short_description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {listing.listing_type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(listing.status)}>
                            {getStatusDisplayName(listing.status)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-white font-semibold">
                              {formatCurrency(listing.current_funding_amount)} / {formatCurrency(listing.total_funding_goal)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {listing.funding_progress_percentage?.toFixed(1)}% funded
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{listing.current_investor_count}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowDetailsModal(true);
                              }}
                              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditListing(listing)}
                              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteListing(listing.id)}
                              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Tiers Tab */}
        <TabsContent value="nft-tiers" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">NFT Card Tiers</h2>
            <p className="text-gray-400">Configure investment multipliers and access permissions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nftTiers.map((tier) => (
              <Card key={tier.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{tier.display_name}</CardTitle>
                    <Badge className={tier.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Investment Multiplier</p>
                    <p className="text-2xl font-bold text-purple-400">{tier.investment_multiplier}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Minimum Balance</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(tier.minimum_balance_required)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Premium Access</span>
                      <Switch checked={tier.can_access_premium_listings} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Early Access</span>
                      <Switch checked={tier.can_access_early_listings} />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Tier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Marketplace Analytics</h2>
            <p className="text-gray-400">Overview of marketplace performance and metrics</p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Target className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Listings</p>
                      <p className="text-2xl font-bold text-white">{stats.total_listings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Funding</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_funding_raised)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Investors</p>
                      <p className="text-2xl font-bold text-white">{stats.total_users_invested}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-400">Avg. Investment</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.average_investment_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* DAO Tab */}
        <TabsContent value="dao" className="space-y-6">
          <MarketplaceDAOIntegration onProposalCreated={(proposal) => {
            toast({
              title: "DAO Proposal Created",
              description: `Proposal "${proposal.title}" has been submitted for community voting.`,
            });
          }} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Marketplace Settings</h2>
            <p className="text-gray-400">Configure marketplace behavior and policies</p>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white">Default Minimum Investment</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Default Maximum Investment</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Default Campaign Duration (days)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Platform Fee (%)</Label>
                  <Input
                    type="number"
                    placeholder="2.5"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                <Settings className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marketplace Listing</DialogTitle>
          </DialogHeader>
          <CreateListingForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => {
              if (selectedListing) {
                handleUpdateListing(selectedListing.id, formData);
                setShowEditModal(false);
              }
            }}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white">{selectedListing.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{selectedListing.listing_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className={getStatusColor(selectedListing.status)}>
                        {selectedListing.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Level:</span>
                      <span className="text-white">{selectedListing.risk_level}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Financial Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Funding Goal:</span>
                      <span className="text-white">{formatCurrency(selectedListing.total_funding_goal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Funding:</span>
                      <span className="text-white">{formatCurrency(selectedListing.current_funding_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">{selectedListing.funding_progress_percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investors:</span>
                      <span className="text-white">{selectedListing.current_investor_count}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300">{selectedListing.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create/Edit Form Component
interface CreateListingFormProps {
  formData: CreateListingRequest;
  setFormData: (data: CreateListingRequest) => void;
  onSubmit: (saveAsDraft?: boolean) => void;
  onCancel: () => void;
  showDraftOption?: boolean;
}

const CreateListingForm: React.FC<CreateListingFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  showDraftOption = false
}) => {
  const updateField = (field: keyof CreateListingRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-white">Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter listing title"
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-white">Listing Type *</Label>
          <Select value={formData.listing_type} onValueChange={(value: any) => updateField('listing_type', value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="initiative">Initiative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-white">Short Description</Label>
        <Input
          value={formData.short_description}
          onChange={(e) => updateField('short_description', e.target.value)}
          placeholder="Brief description for cards"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-white">Full Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Detailed description of the asset or initiative"
          className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
        />
      </div>

      <div>
        <Label className="text-white">Image URL</Label>
        <Input
          value={formData.image_url}
          onChange={(e) => updateField('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label className="text-white">Funding Goal *</Label>
          <Input
            type="number"
            value={formData.total_funding_goal || ''}
            onChange={(e) => {
              const value = e.target.value;
              updateField('total_funding_goal', value === '' ? 0 : parseFloat(value));
            }}
            placeholder="1000000"
            className="bg-slate-700 border-slate-600 text-white"
            min="0"
            step="1"
          />
        </div>
        <div>
          <Label className="text-white">Minimum Investment *</Label>
          <Input
            type="number"
            value={formData.minimum_investment || ''}
            onChange={(e) => {
              const value = e.target.value;
              updateField('minimum_investment', value === '' ? 0 : parseFloat(value));
            }}
            placeholder="100"
            className="bg-slate-700 border-slate-600 text-white"
            min="0"
            step="1"
          />
        </div>
        <div>
          <Label className="text-white">Expected Return Rate (%)</Label>
          <Input
            type="number"
            value={formData.expected_return_rate || ''}
            onChange={(e) => {
              const value = e.target.value;
              updateField('expected_return_rate', value === '' ? 0 : parseFloat(value));
            }}
            placeholder="12.5"
            className="bg-slate-700 border-slate-600 text-white"
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label className="text-white">Risk Level *</Label>
          <Select value={formData.risk_level} onValueChange={(value: any) => updateField('risk_level', value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white">Asset Type</Label>
          <div className="space-y-2">
            <Select value={formData.asset_type} onValueChange={(value: any) => {
              if (value === 'custom') {
                // Allow custom input
                return;
              }
              updateField('asset_type', value);
            }}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="startup_equity">Startup Equity</SelectItem>
                <SelectItem value="commodity">Commodity</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                <SelectItem value="bonds">Bonds</SelectItem>
                <SelectItem value="reit">REIT</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {formData.asset_type === 'custom' && (
              <Input
                placeholder="Enter custom asset type"
                className="bg-slate-700 border-slate-600 text-white"
                onChange={(e) => updateField('asset_type', e.target.value)}
              />
            )}
          </div>
        </div>
        <div>
          <Label className="text-white">Campaign Type *</Label>
          <Select value={formData.campaign_type} onValueChange={(value: any) => updateField('campaign_type', value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="open_ended">Open Ended</SelectItem>
              <SelectItem value="time_bound">Time Bound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
        >
          Cancel
        </Button>
        {showDraftOption && (
          <Button
            onClick={() => onSubmit(true)}
            variant="outline"
            className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
          >
            Save as Draft
          </Button>
        )}
        <Button
          onClick={() => onSubmit(false)}
          className="bg-purple-500 hover:bg-purple-600 text-white"
        >
          {showDraftOption ? 'Submit for Review' : 'Save Listing'}
        </Button>
      </div>
    </div>
  );
};

export default MarketplaceManager;
