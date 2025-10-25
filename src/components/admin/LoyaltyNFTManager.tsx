// Loyalty NFT Manager Component
// This component displays and manages loyalty NFT cards with correct database information

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useLoyaltyNFT } from '@/hooks/useLoyaltyNFT';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  DollarSign,
  Zap,
  Star
} from 'lucide-react';

interface LoyaltyNFTManagerProps {
  userId?: string;
}

const LoyaltyNFTManager: React.FC<LoyaltyNFTManagerProps> = ({ userId }) => {
  const {
    nftTypes,
    loadingNFTTypes,
    errorNFTTypes,
    refreshNFTTypes,
    userLoyaltyCards,
    loadingUserCards,
    errorUserCards,
    refreshUserCards,
    statistics,
    updateNFTType,
    createNFTType,
    deleteNFTType,
  } = useLoyaltyNFT(userId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNFT, setEditingNFT] = useState<any>(null);
  const [formData, setFormData] = useState({
    nft_name: '',
    display_name: '',
    rarity: 'Common',
    buy_price_usdt: 0,
    earn_on_spend_ratio: 0.01,
    is_custodial: true,
    is_evolvable: true,
    is_upgradeable: false,
    evolution_min_investment: 100,
    evolution_earnings_ratio: 0.0025,
    upgrade_bonus_ratio: 0,
    image_url: '',
    evolution_image_url: '',
    description: '',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNFT) {
        await updateNFTType(editingNFT.id, formData);
      } else {
        await createNFTType(formData);
      }
      
      setDialogOpen(false);
      setEditingNFT(null);
      setFormData({
        nft_name: '',
        display_name: '',
        rarity: 'Common',
        buy_price_usdt: 0,
        earn_on_spend_ratio: 0.01,
        is_custodial: true,
        is_evolvable: true,
        is_upgradeable: false,
        evolution_min_investment: 100,
        evolution_earnings_ratio: 0.0025,
        upgrade_bonus_ratio: 0,
        image_url: '',
        evolution_image_url: '',
        description: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Handle edit
  const handleEdit = (nft: any) => {
    setEditingNFT(nft);
    setFormData({
      nft_name: nft.nft_name || '',
      display_name: nft.display_name || '',
      rarity: nft.rarity || 'Common',
      buy_price_usdt: nft.buy_price_usdt || 0,
      earn_on_spend_ratio: nft.earn_on_spend_ratio || 0.01,
      is_custodial: nft.is_custodial ?? true,
      is_evolvable: nft.is_evolvable ?? true,
      is_upgradeable: nft.is_upgradeable ?? false,
      evolution_min_investment: nft.evolution_min_investment || 100,
      evolution_earnings_ratio: nft.evolution_earnings_ratio || 0.0025,
      upgrade_bonus_ratio: nft.upgrade_bonus_ratio || 0,
      image_url: nft.image_url || '',
      evolution_image_url: nft.evolution_image_url || '',
      description: nft.description || '',
    });
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (nftId: string) => {
    if (window.confirm('Are you sure you want to delete this NFT type?')) {
      await deleteNFTType(nftId);
    }
  };

  // Get rarity badge color
  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-gray-100 text-gray-800';
      case 'Less Common':
        return 'bg-green-100 text-green-800';
      case 'Rare':
        return 'bg-blue-100 text-blue-800';
      case 'Very Rare':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loyalty NFT Cards</h2>
          <p className="text-muted-foreground">
            Manage loyalty NFT card types and view user ownership statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshNFTTypes();
              if (userId) refreshUserCards(userId);
            }}
            disabled={loadingNFTTypes || loadingUserCards}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loadingNFTTypes || loadingUserCards) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingNFT(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New NFT Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingNFT ? 'Edit NFT Type' : 'Create New NFT Type'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nft_name">NFT Name</Label>
                    <Input
                      id="nft_name"
                      value={formData.nft_name}
                      onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Common">Common</SelectItem>
                        <SelectItem value="Less Common">Less Common</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Very Rare">Very Rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="buy_price_usdt">Price (USDT)</Label>
                    <Input
                      id="buy_price_usdt"
                      type="number"
                      step="0.01"
                      value={formData.buy_price_usdt}
                      onChange={(e) => setFormData({ ...formData, buy_price_usdt: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="earn_on_spend_ratio">Earn on Spend Ratio</Label>
                    <Input
                      id="earn_on_spend_ratio"
                      type="number"
                      step="0.0001"
                      value={formData.earn_on_spend_ratio}
                      onChange={(e) => setFormData({ ...formData, earn_on_spend_ratio: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evolution_min_investment">Evolution Min Investment</Label>
                    <Input
                      id="evolution_min_investment"
                      type="number"
                      step="0.01"
                      value={formData.evolution_min_investment}
                      onChange={(e) => setFormData({ ...formData, evolution_min_investment: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="evolution_earnings_ratio">Evolution Earnings Ratio</Label>
                    <Input
                      id="evolution_earnings_ratio"
                      type="number"
                      step="0.0001"
                      value={formData.evolution_earnings_ratio}
                      onChange={(e) => setFormData({ ...formData, evolution_earnings_ratio: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="upgrade_bonus_ratio">Upgrade Bonus Ratio</Label>
                    <Input
                      id="upgrade_bonus_ratio"
                      type="number"
                      step="0.0001"
                      value={formData.upgrade_bonus_ratio}
                      onChange={(e) => setFormData({ ...formData, upgrade_bonus_ratio: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evolution_image_url">Evolution Image URL</Label>
                    <Input
                      id="evolution_image_url"
                      value={formData.evolution_image_url}
                      onChange={(e) => setFormData({ ...formData, evolution_image_url: e.target.value })}
                    />
                  </div>
                </div>

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
                      id="is_evolvable"
                      checked={formData.is_evolvable}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_evolvable: checked })}
                    />
                    <Label htmlFor="is_evolvable">Evolvable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_upgradeable"
                      checked={formData.is_upgradeable}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_upgradeable: checked })}
                    />
                    <Label htmlFor="is_upgradeable">Upgradeable</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingNFT ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total NFT Types</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_nft_types}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loyalty Cards</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_loyalty_cards}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.total_investment.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evolution Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.evolution_rate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NFT Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            NFT Types
          </CardTitle>
          <CardDescription>
            Manage loyalty NFT card types and their properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingNFTTypes ? (
            <div className="text-center py-6">Loading NFT types...</div>
          ) : errorNFTTypes ? (
            <div className="text-center py-6 text-red-600">
              Error: {errorNFTTypes}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owned</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nftTypes.map((nft) => (
                    <TableRow key={nft.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{nft.display_name}</div>
                          <div className="text-sm text-muted-foreground">{nft.nft_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRarityBadgeColor(nft.rarity)}>
                          {nft.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {nft.is_custodial ? 'Custodial' : 'Non-Custodial'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {nft.buy_price_usdt > 0 ? `$${nft.buy_price_usdt} USDT` : 'Free'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Earn: {(nft.earn_on_spend_ratio * 100).toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(nft.is_active)}>
                          {nft.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{nft.total_owned}</div>
                        <div className="text-sm text-muted-foreground">
                          Evolved: {nft.evolution_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(nft.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(nft)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(nft.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Loyalty Cards (if userId provided) */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Loyalty Cards
            </CardTitle>
            <CardDescription>
              Loyalty cards owned by the selected user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUserCards ? (
              <div className="text-center py-6">Loading user loyalty cards...</div>
            ) : errorUserCards ? (
              <div className="text-center py-6 text-red-600">
                Error: {errorUserCards}
              </div>
            ) : userLoyaltyCards.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No loyalty cards found for this user
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purchased</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLoyaltyCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{card.nft_types?.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {card.loyalty_number || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRarityBadgeColor(card.nft_types?.rarity || 'Common')}>
                            {card.nft_types?.rarity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${card.current_investment.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {card.is_evolved && 'Evolved'}
                            {card.is_upgraded && ' • Upgraded'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(card.is_active ?? true)}>
                            {card.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(card.purchased_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LoyaltyNFTManager;
