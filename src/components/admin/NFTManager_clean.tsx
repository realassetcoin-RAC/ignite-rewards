import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Shield,
  Wallet
} from 'lucide-react';
import CustomTooltip from '@/components/ui/custom-tooltip';
import { 
  LoyaltyNFTService, 
  NFTType, 
  UserLoyaltyCard, 
  NFTMintingControl,
  NFTRarity
} from '@/lib/loyaltyNFTService';
import { supabase } from '@/integrations/supabase/client';

export default function NFTManager() {
  const [nftTypes, setNftTypes] = useState<NFTType[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserLoyaltyCard[]>([]);
  const [mintingControls, setMintingControls] = useState<NFTMintingControl[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTType | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    collection_id: '',
    nft_name: '',
    display_name: '',
    description: '',
    image_url: '',
    evolution_image_url: '',
    buy_price_usdt: 0,
    rarity: NFTRarity.Common,
    mint_quantity: 0,
    is_upgradeable: false,
    is_evolvable: true,
    is_fractional_eligible: true,
    auto_staking_duration: 'Forever',
    earn_on_spend_ratio: 0.01,
    upgrade_bonus_ratio: 0,
    evolution_min_investment: 0,
    evolution_earnings_ratio: 0,
    is_custodial: true,
    // Subscription and Pricing fields
    subscription_plan: 'basic',
    pricing_type: 'free',
    one_time_fee: 0.00,
    monthly_fee: 0.00,
    annual_fee: 0.00,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load NFT types
      const nftTypesData = await LoyaltyNFTService.getAllNFTTypes();
      setNftTypes(nftTypesData);

      // Load collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('nft_collections')
        .select('*')
        .eq('is_active', true);

      if (collectionsError) {
        console.error('Error loading collections:', collectionsError);
      } else {
        setCollections(collectionsData || []);
      }

      // Load user NFTs
      const userNFTsData = await LoyaltyNFTService.getUserLoyaltyCards();
      setUserNFTs(userNFTsData);

      // Load minting controls
      const mintingControlsData = await LoyaltyNFTService.getMintingControls();
      setMintingControls(mintingControlsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load NFT data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNFT = async () => {
    try {
      const nftData = {
        collection_id: formData.collection_id,
        nft_name: formData.nft_name,
        display_name: formData.display_name,
        description: formData.description,
        image_url: formData.image_url,
        evolution_image_url: formData.evolution_image_url,
        buy_price_usdt: formData.buy_price_usdt,
        rarity: formData.rarity,
        mint_quantity: formData.mint_quantity,
        is_upgradeable: formData.is_upgradeable,
        is_evolvable: formData.is_evolvable,
        is_fractional_eligible: formData.is_fractional_eligible,
        auto_staking_duration: formData.auto_staking_duration,
        earn_on_spend_ratio: formData.earn_on_spend_ratio,
        upgrade_bonus_ratio: formData.upgrade_bonus_ratio,
        evolution_min_investment: formData.evolution_min_investment,
        evolution_earnings_ratio: formData.evolution_earnings_ratio,
        is_custodial: formData.is_custodial,
        // Subscription and Pricing fields
        subscription_plan: formData.subscription_plan,
        pricing_type: formData.pricing_type,
        one_time_fee: formData.one_time_fee,
        monthly_fee: formData.monthly_fee,
        annual_fee: formData.annual_fee,
      };

      await LoyaltyNFTService.createNFTType(nftData);

      toast({
        title: "Success",
        description: "NFT type created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating NFT:', error);
      toast({
        title: "Error",
        description: "Failed to create NFT type",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNFT = async () => {
    if (!selectedNFT) return;

    try {
      const nftData = {
        collection_id: formData.collection_id,
        nft_name: formData.nft_name,
        display_name: formData.display_name,
        description: formData.description,
        image_url: formData.image_url,
        evolution_image_url: formData.evolution_image_url,
        buy_price_usdt: formData.buy_price_usdt,
        rarity: formData.rarity,
        mint_quantity: formData.mint_quantity,
        is_upgradeable: formData.is_upgradeable,
        is_evolvable: formData.is_evolvable,
        is_fractional_eligible: formData.is_fractional_eligible,
        auto_staking_duration: formData.auto_staking_duration,
        earn_on_spend_ratio: formData.earn_on_spend_ratio,
        upgrade_bonus_ratio: formData.upgrade_bonus_ratio,
        evolution_min_investment: formData.evolution_min_investment,
        evolution_earnings_ratio: formData.evolution_earnings_ratio,
        is_custodial: formData.is_custodial,
        // Subscription and Pricing fields
        subscription_plan: formData.subscription_plan,
        pricing_type: formData.pricing_type,
        one_time_fee: formData.one_time_fee,
        monthly_fee: formData.monthly_fee,
        annual_fee: formData.annual_fee,
      };

      await LoyaltyNFTService.updateNFTType(selectedNFT.id, nftData);

      toast({
        title: "Success",
        description: "NFT type updated successfully",
      });

      setIsEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating NFT:', error);
      toast({
        title: "Error",
        description: "Failed to update NFT type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      collection_id: '',
      nft_name: '',
      display_name: '',
      description: '',
      image_url: '',
      evolution_image_url: '',
      buy_price_usdt: 0,
      rarity: NFTRarity.Common,
      mint_quantity: 0,
      is_upgradeable: false,
      is_evolvable: true,
      is_fractional_eligible: true,
      auto_staking_duration: 'Forever',
      earn_on_spend_ratio: 0.01,
      upgrade_bonus_ratio: 0,
      evolution_min_investment: 0,
      evolution_earnings_ratio: 0,
      is_custodial: true,
      // Subscription and Pricing fields
      subscription_plan: 'basic',
      pricing_type: 'free',
      one_time_fee: 0.00,
      monthly_fee: 0.00,
      annual_fee: 0.00,
    });
  };

  const openEditDialog = (nft: NFTType) => {
    setSelectedNFT(nft);
    setFormData({
      collection_id: nft.collection_id || '',
      nft_name: nft.nft_name,
      display_name: nft.display_name,
      description: nft.description || '',
      image_url: nft.image_url || '',
      evolution_image_url: nft.evolution_image_url || '',
      buy_price_usdt: nft.buy_price_usdt,
      rarity: nft.rarity,
      mint_quantity: nft.mint_quantity,
      is_upgradeable: nft.is_upgradeable,
      is_evolvable: nft.is_evolvable,
      is_fractional_eligible: nft.is_fractional_eligible,
      auto_staking_duration: nft.auto_staking_duration,
      earn_on_spend_ratio: nft.earn_on_spend_ratio,
      upgrade_bonus_ratio: nft.upgrade_bonus_ratio,
      evolution_min_investment: nft.evolution_min_investment,
      evolution_earnings_ratio: nft.evolution_earnings_ratio,
      is_custodial: nft.is_custodial,
      // Subscription and Pricing fields
      subscription_plan: nft.subscription_plan || 'basic',
      pricing_type: nft.pricing_type || 'free',
      one_time_fee: nft.one_time_fee || 0.00,
      monthly_fee: nft.monthly_fee || 0.00,
      annual_fee: nft.annual_fee || 0.00,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading NFT data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">NFT Management</h2>
          <p className="text-muted-foreground">
            Manage loyalty NFT types, collections, and user cards
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create New NFT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New NFT Type</DialogTitle>
              <DialogDescription>
                Create a new loyalty NFT type with specific properties and pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Collection Name
                      <CustomTooltip content="Select from dropdown list of available collections" />
                    </Label>
                    <Select 
                      value={formData.collection_id} 
                      onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      NFT Name
                      <CustomTooltip content="Internal name for the NFT (e.g., Pearl White, Lava Orange)" />
                    </Label>
                    <Input
                      value={formData.nft_name}
                      onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                      placeholder="e.g., Pearl White"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Display Name
                      <CustomTooltip content="Public display name shown to users" />
                    </Label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g., Pearl White"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Rarity
                      <CustomTooltip content="NFT rarity level" />
                    </Label>
                    <Select value={formData.rarity} onValueChange={(value) => setFormData({ ...formData, rarity: value as NFTRarity })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NFTRarity.Common}>Common</SelectItem>
                        <SelectItem value={NFTRarity.LessCommon}>Less Common</SelectItem>
                        <SelectItem value={NFTRarity.Rare}>Rare</SelectItem>
                        <SelectItem value={NFTRarity.VeryRare}>Very Rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Image & Description Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Image & Description</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Description
                      <CustomTooltip content="Description of the NFT card" />
                    </Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter NFT description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Image URL (PNG/JPG)
                      <CustomTooltip content="URL for regular loyalty card image (PNG or JPG format)" />
                    </Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Evolution Image URL (GIF)
                      <CustomTooltip content="URL for evolved NFT image (animated GIF format)" />
                    </Label>
                    <Input
                      value={formData.evolution_image_url}
                      onChange={(e) => setFormData({ ...formData, evolution_image_url: e.target.value })}
                      placeholder="https://example.com/evolution.gif"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Pricing Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Subscription & Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Subscription Plan
                      <CustomTooltip content="Required merchant subscription plan" />
                    </Label>
                    <Select 
                      value={formData.subscription_plan} 
                      onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (Free)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Pricing Type
                      <CustomTooltip content="How customers pay for this NFT" />
                    </Label>
                    <Select 
                      value={formData.pricing_type} 
                      onValueChange={(value) => setFormData({ ...formData, pricing_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="one-time">One-Time Fee</SelectItem>
                        <SelectItem value="monthly">Monthly Subscription</SelectItem>
                        <SelectItem value="annual">Annual Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      One-Time Fee (USDT)
                      <CustomTooltip content="One-time upgrade fee for customers" />
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.one_time_fee}
                      onChange={(e) => setFormData({ ...formData, one_time_fee: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Monthly Fee (USDT)
                      <CustomTooltip content="Monthly subscription fee for customers" />
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({ ...formData, monthly_fee: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Annual Fee (USDT)
                      <CustomTooltip content="Annual subscription fee for customers" />
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.annual_fee}
                      onChange={(e) => setFormData({ ...formData, annual_fee: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Minting Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Pricing & Minting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Buy Price (USDT)
                      <CustomTooltip content="Purchase price in USDT for this NFT" />
                    </Label>
                    <Input
                      type="number"
                      value={formData.buy_price_usdt}
                      onChange={(e) => setFormData({ ...formData, buy_price_usdt: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Mint Count
                      <CustomTooltip content="Total number of NFTs that can be minted for this type" />
                    </Label>
                    <Input
                      type="number"
                      value={formData.mint_quantity}
                      onChange={(e) => setFormData({ ...formData, mint_quantity: parseInt(e.target.value) || 0 })}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Features & Capabilities Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Features & Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_upgradeable}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_upgradeable: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      Upgrade
                      <CustomTooltip content="Yes/No - Can this NFT be upgraded to increase earning ratios?" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_evolvable}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_evolvable: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      Evolve
                      <CustomTooltip content="Yes/No - Can this NFT be evolved with additional investment?" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_fractional_eligible}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_fractional_eligible: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      Fractional
                      <CustomTooltip content="Yes/No - Is this NFT eligible for fractional ownership?" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_custodial}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_custodial: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      Custodial
                      <CustomTooltip content="Yes/No - Is this NFT held in custody or self-custody?" />
                    </Label>
                  </div>
                </div>
              </div>

              {/* Auto Staking Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Auto Staking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Auto Staking Duration
                      <CustomTooltip content="Duration for auto-staking: Forever, 1 Year, 2 Years, 5 Years" />
                    </Label>
                    <Select value={formData.auto_staking_duration} onValueChange={(value) => setFormData({ ...formData, auto_staking_duration: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Forever">Forever</SelectItem>
                        <SelectItem value="1 Year">1 Year</SelectItem>
                        <SelectItem value="2 Years">2 Years</SelectItem>
                        <SelectItem value="5 Years">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Earning Ratios Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Earning Ratios</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Earn on Spend %
                      <CustomTooltip content="Percentage earned on spending (e.g., 1.00% = 0.0100)" />
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.earn_on_spend_ratio}
                      onChange={(e) => setFormData({ ...formData, earn_on_spend_ratio: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Upgrade Bonus Tokenization %
                      <CustomTooltip content="Additional percentage for upgraded NFTs (custodial only)" />
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.upgrade_bonus_ratio}
                      onChange={(e) => setFormData({ ...formData, upgrade_bonus_ratio: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0000"
                    />
                  </div>
                </div>
              </div>

              {/* Evolution Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Evolution Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Evolution Min Invest (USDT)
                      <CustomTooltip content="Minimum USDT investment required to evolve this NFT" />
                    </Label>
                    <Input
                      type="number"
                      value={formData.evolution_min_investment}
                      onChange={(e) => setFormData({ ...formData, evolution_min_investment: parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Evolution Earnings %
                      <CustomTooltip content="Additional percentage earned after evolution" />
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.evolution_earnings_ratio}
                      onChange={(e) => setFormData({ ...formData, evolution_earnings_ratio: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0025"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNFT}>
                  Create NFT Type
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="nft-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nft-types">NFT Types</TabsTrigger>
          <TabsTrigger value="user-nfts">User NFTs</TabsTrigger>
          <TabsTrigger value="minting-controls">Minting Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="nft-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NFT Types</CardTitle>
              <CardDescription>
                Manage different types of loyalty NFTs with their properties and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Price (USDT)</TableHead>
                    <TableHead>Mint Count</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nftTypes.map((nft) => (
                    <TableRow key={nft.id}>
                      <TableCell className="font-medium">{nft.display_name}</TableCell>
                      <TableCell>{nft.collection_id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{nft.rarity}</Badge>
                      </TableCell>
                      <TableCell>${nft.buy_price_usdt}</TableCell>
                      <TableCell>{nft.mint_quantity}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {nft.is_upgradeable && <Badge variant="outline">Upgrade</Badge>}
                          {nft.is_evolvable && <Badge variant="outline">Evolve</Badge>}
                          {nft.is_fractional_eligible && <Badge variant="outline">Fractional</Badge>}
                          {nft.is_custodial && <Badge variant="outline">Custodial</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={nft.is_active ? "default" : "secondary"}>
                          {nft.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(nft)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Toggle active status
                              console.log('Toggle active status for:', nft.id);
                            }}
                          >
                            {nft.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

        <TabsContent value="user-nfts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User NFTs</CardTitle>
              <CardDescription>
                View and manage user-owned loyalty NFTs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>NFT Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userNFTs.map((nft) => (
                    <TableRow key={nft.id}>
                      <TableCell>{nft.user_id}</TableCell>
                      <TableCell>{nft.nft_type_id}</TableCell>
                      <TableCell>
                        <Badge variant={nft.is_active ? "default" : "secondary"}>
                          {nft.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(nft.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minting-controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minting Controls</CardTitle>
              <CardDescription>
                Control NFT minting processes and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NFT Type</TableHead>
                    <TableHead>Minted</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mintingControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell>{control.nft_type_id}</TableCell>
                      <TableCell>{control.minted_count}</TableCell>
                      <TableCell>{control.mint_limit}</TableCell>
                      <TableCell>
                        <Badge variant={control.is_minting_enabled ? "default" : "secondary"}>
                          {control.is_minting_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit NFT Type</DialogTitle>
            <DialogDescription>
              Update the properties of this NFT type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form structure as create dialog */}
            <div className="space-y-4">
              <h4 className="text-md font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Collection Name
                    <CustomTooltip content="Select from dropdown list of available collections" />
                  </Label>
                  <Select 
                    value={formData.collection_id} 
                    onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    NFT Name
                    <CustomTooltip content="Internal name for the NFT (e.g., Pearl White, Lava Orange)" />
                  </Label>
                  <Input
                    value={formData.nft_name}
                    onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                    placeholder="e.g., Pearl White"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Display Name
                    <CustomTooltip content="Public display name shown to users" />
                  </Label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., Pearl White"
                  />
                </div>
              </div>
            </div>

            {/* Add other sections here - same as create dialog but for edit */}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNFT}>
                Update NFT Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

