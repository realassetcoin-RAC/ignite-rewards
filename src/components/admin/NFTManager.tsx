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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Pause, 
  Play, 
  TrendingUp, 
  Users, 
  DollarSign,
  Shield,
  Wallet
} from 'lucide-react';
import { 
  LoyaltyNFTService, 
  NFTType, 
  UserLoyaltyCard, 
  NFTMintingControl,
  NFTRarity,
  CustodyType 
} from '@/lib/loyaltyNFTService';
import { supabase } from '@/integrations/supabase/client';

export default function NFTManager() {
  const [nftTypes, setNftTypes] = useState<NFTType[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserLoyaltyCard[]>([]);
  const [mintingControls, setMintingControls] = useState<NFTMintingControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTType | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    nft_name: '',
    display_name: '',
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
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nftTypesData, userNFTsData] = await Promise.all([
        LoyaltyNFTService.getAllNFTTypes(),
        supabase.from('user_loyalty_cards').select(`
          *,
          nft_types (*)
        `).not('nft_type_id', 'is', null)
      ]);

      setNftTypes(nftTypesData);
      setUserNFTs(userNFTsData.data || []);

      // Load minting controls
      const mintingData = await supabase
        .from('nft_minting_control')
        .select(`
          *,
          nft_types (*)
        `);

      setMintingControls(mintingData.data || []);
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
      const { error } = await supabase
        .from('nft_types')
        .insert([formData]);

      if (error) throw error;

      // Create minting control
      const { data: nftData } = await supabase
        .from('nft_types')
        .select('id')
        .eq('nft_name', formData.nft_name)
        .eq('is_custodial', formData.is_custodial)
        .single();

      if (nftData) {
        await supabase
          .from('nft_minting_control')
          .insert([{
            nft_type_id: nftData.id,
            max_mintable: formData.mint_quantity,
            minting_enabled: true,
          }]);
      }

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
      const { error } = await supabase
        .from('nft_types')
        .update(formData)
        .eq('id', selectedNFT.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "NFT type updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedNFT(null);
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

  const handleToggleMinting = async (nftTypeId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('nft_minting_control')
        .update({ 
          minting_enabled: enabled,
          minting_paused_reason: enabled ? null : 'Admin paused',
          paused_at: enabled ? null : new Date().toISOString(),
        })
        .eq('nft_type_id', nftTypeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Minting ${enabled ? 'enabled' : 'disabled'} successfully`,
      });

      loadData();
    } catch (error) {
      console.error('Error toggling minting:', error);
      toast({
        title: "Error",
        description: "Failed to update minting status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nft_name: '',
      display_name: '',
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
    });
  };

  const openEditDialog = (nft: NFTType) => {
    setSelectedNFT(nft);
    setFormData({
      nft_name: nft.nft_name,
      display_name: nft.display_name,
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
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading NFT data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Management</h2>
          <p className="text-muted-foreground">Manage loyalty NFT types and minting controls</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create NFT Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New NFT Type</DialogTitle>
              <DialogDescription>
                Create a new loyalty NFT type with specific properties and pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nft_name">NFT Name</Label>
                <Input
                  id="nft_name"
                  value={formData.nft_name}
                  onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                  placeholder="e.g., Pearl White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Pearl White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buy_price_usdt">Buy Price (USDT)</Label>
                <Input
                  id="buy_price_usdt"
                  type="number"
                  value={formData.buy_price_usdt}
                  onChange={(e) => setFormData({ ...formData, buy_price_usdt: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rarity">Rarity</Label>
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
              <div className="space-y-2">
                <Label htmlFor="mint_quantity">Mint Quantity</Label>
                <Input
                  id="mint_quantity"
                  type="number"
                  value={formData.mint_quantity}
                  onChange={(e) => setFormData({ ...formData, mint_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earn_on_spend_ratio">Earn on Spend Ratio</Label>
                <Input
                  id="earn_on_spend_ratio"
                  type="number"
                  step="0.0001"
                  value={formData.earn_on_spend_ratio}
                  onChange={(e) => setFormData({ ...formData, earn_on_spend_ratio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upgrade_bonus_ratio">Upgrade Bonus Ratio</Label>
                <Input
                  id="upgrade_bonus_ratio"
                  type="number"
                  step="0.0001"
                  value={formData.upgrade_bonus_ratio}
                  onChange={(e) => setFormData({ ...formData, upgrade_bonus_ratio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evolution_min_investment">Evolution Min Investment</Label>
                <Input
                  id="evolution_min_investment"
                  type="number"
                  value={formData.evolution_min_investment}
                  onChange={(e) => setFormData({ ...formData, evolution_min_investment: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evolution_earnings_ratio">Evolution Earnings Ratio</Label>
                <Input
                  id="evolution_earnings_ratio"
                  type="number"
                  step="0.0001"
                  value={formData.evolution_earnings_ratio}
                  onChange={(e) => setFormData({ ...formData, evolution_earnings_ratio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.0025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_staking_duration">Auto-Staking Duration</Label>
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
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_custodial"
                    checked={formData.is_custodial}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_custodial: checked })}
                  />
                  <Label htmlFor="is_custodial">Custodial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_upgradeable"
                    checked={formData.is_upgradeable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_upgradeable: checked })}
                  />
                  <Label htmlFor="is_upgradeable">Upgradeable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_evolvable"
                    checked={formData.is_evolvable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_evolvable: checked })}
                  />
                  <Label htmlFor="is_evolvable">Evolvable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_fractional_eligible"
                    checked={formData.is_fractional_eligible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_fractional_eligible: checked })}
                  />
                  <Label htmlFor="is_fractional_eligible">Fractional Eligible</Label>
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
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="nft-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nft-types">NFT Types</TabsTrigger>
          <TabsTrigger value="minting-control">Minting Control</TabsTrigger>
          <TabsTrigger value="user-nfts">User NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="nft-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NFT Types</CardTitle>
              <CardDescription>Manage all available NFT types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Mint Qty</TableHead>
                    <TableHead>Earn Ratio</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nftTypes.map((nft) => {
                    const rarityInfo = LoyaltyNFTService.getRarityDisplayInfo(nft.rarity);
                    return (
                      <TableRow key={nft.id}>
                        <TableCell className="font-medium">{nft.display_name}</TableCell>
                        <TableCell>
                          <Badge variant={nft.is_custodial ? "default" : "secondary"}>
                            {nft.is_custodial ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Custodial
                              </>
                            ) : (
                              <>
                                <Wallet className="h-3 w-3 mr-1" />
                                Non-Custodial
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${rarityInfo.color} ${rarityInfo.bgColor}`}>
                            {rarityInfo.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {nft.buy_price_usdt > 0 ? `${nft.buy_price_usdt} USDT` : 'Free'}
                        </TableCell>
                        <TableCell>{nft.mint_quantity.toLocaleString()}</TableCell>
                        <TableCell>{(nft.earn_on_spend_ratio * 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {nft.is_upgradeable && (
                              <Badge variant="outline" className="text-xs">Upgradeable</Badge>
                            )}
                            {nft.is_evolvable && (
                              <Badge variant="outline" className="text-xs">Evolvable</Badge>
                            )}
                            {nft.is_fractional_eligible && (
                              <Badge variant="outline" className="text-xs">Fractional</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(nft)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minting-control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minting Control</CardTitle>
              <CardDescription>Control minting for each NFT type</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NFT Type</TableHead>
                    <TableHead>Minted</TableHead>
                    <TableHead>Max Mintable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mintingControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell className="font-medium">
                        {control.nft_types?.display_name}
                        <Badge variant={control.nft_types?.is_custodial ? "default" : "secondary"} className="ml-2">
                          {control.nft_types?.is_custodial ? 'Custodial' : 'Non-Custodial'}
                        </Badge>
                      </TableCell>
                      <TableCell>{control.total_minted.toLocaleString()}</TableCell>
                      <TableCell>{control.max_mintable.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={control.minting_enabled ? "default" : "destructive"}>
                          {control.minting_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleMinting(control.nft_type_id, !control.minting_enabled)}
                          disabled={control.total_minted >= control.max_mintable && control.minting_enabled}
                        >
                          {control.minting_enabled ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
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
              <CardDescription>View all user-owned NFTs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>NFT Type</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Investment</TableHead>
                    <TableHead>Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userNFTs.map((userNFT) => (
                    <TableRow key={userNFT.id}>
                      <TableCell className="font-medium">
                        {userNFT.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{userNFT.nft_types?.display_name}</TableCell>
                      <TableCell>
                        <Badge variant={userNFT.is_custodial ? "default" : "secondary"}>
                          {userNFT.is_custodial ? 'Custodial' : 'Non-Custodial'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {userNFT.is_upgraded && (
                            <Badge variant="outline" className="text-xs">Upgraded</Badge>
                          )}
                          {userNFT.is_evolved && (
                            <Badge variant="outline" className="text-xs">Evolved</Badge>
                          )}
                          {userNFT.auto_staking_enabled && (
                            <Badge variant="outline" className="text-xs">Auto-Staking</Badge>
                          )}
                          {!userNFT.is_custodial && !userNFT.is_verified && (
                            <Badge variant="destructive" className="text-xs">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${userNFT.current_investment.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(userNFT.purchased_at).toLocaleDateString()}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit NFT Type</DialogTitle>
            <DialogDescription>
              Update the properties of this NFT type.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nft_name">NFT Name</Label>
              <Input
                id="edit_nft_name"
                value={formData.nft_name}
                onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                placeholder="e.g., Pearl White"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Display Name</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., Pearl White"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_buy_price_usdt">Buy Price (USDT)</Label>
              <Input
                id="edit_buy_price_usdt"
                type="number"
                value={formData.buy_price_usdt}
                onChange={(e) => setFormData({ ...formData, buy_price_usdt: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_rarity">Rarity</Label>
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
            <div className="space-y-2">
              <Label htmlFor="edit_mint_quantity">Mint Quantity</Label>
              <Input
                id="edit_mint_quantity"
                type="number"
                value={formData.mint_quantity}
                onChange={(e) => setFormData({ ...formData, mint_quantity: parseInt(e.target.value) || 0 })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_earn_on_spend_ratio">Earn on Spend Ratio</Label>
              <Input
                id="edit_earn_on_spend_ratio"
                type="number"
                step="0.0001"
                value={formData.earn_on_spend_ratio}
                onChange={(e) => setFormData({ ...formData, earn_on_spend_ratio: parseFloat(e.target.value) || 0 })}
                placeholder="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_upgrade_bonus_ratio">Upgrade Bonus Ratio</Label>
              <Input
                id="edit_upgrade_bonus_ratio"
                type="number"
                step="0.0001"
                value={formData.upgrade_bonus_ratio}
                onChange={(e) => setFormData({ ...formData, upgrade_bonus_ratio: parseFloat(e.target.value) || 0 })}
                placeholder="0.001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_evolution_min_investment">Evolution Min Investment</Label>
              <Input
                id="edit_evolution_min_investment"
                type="number"
                value={formData.evolution_min_investment}
                onChange={(e) => setFormData({ ...formData, evolution_min_investment: parseFloat(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_evolution_earnings_ratio">Evolution Earnings Ratio</Label>
              <Input
                id="edit_evolution_earnings_ratio"
                type="number"
                step="0.0001"
                value={formData.evolution_earnings_ratio}
                onChange={(e) => setFormData({ ...formData, evolution_earnings_ratio: parseFloat(e.target.value) || 0 })}
                placeholder="0.0025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_auto_staking_duration">Auto-Staking Duration</Label>
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
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_custodial"
                  checked={formData.is_custodial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_custodial: checked })}
                />
                <Label htmlFor="edit_is_custodial">Custodial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_upgradeable"
                  checked={formData.is_upgradeable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_upgradeable: checked })}
                />
                <Label htmlFor="edit_is_upgradeable">Upgradeable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_evolvable"
                  checked={formData.is_evolvable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_evolvable: checked })}
                />
                <Label htmlFor="edit_is_evolvable">Evolvable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_fractional_eligible"
                  checked={formData.is_fractional_eligible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_fractional_eligible: checked })}
                />
                <Label htmlFor="edit_is_fractional_eligible">Fractional Eligible</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNFT}>
              Update NFT Type
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
