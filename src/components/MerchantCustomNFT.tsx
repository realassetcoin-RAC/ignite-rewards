import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { 
  Upload, 
  Image as ImageIcon, 
  QrCode, 
  Copy, 
  Edit, 
  Trash2, 
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MerchantCustomNFT {
  id: string;
  merchant_id: string;
  nft_name: string;
  description: string;
  image_url: string;
  discount_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

interface MerchantCustomNFTProps {
  merchantId: string;
  subscriptionPlan: {
    name: string;
    features?: any[];
  } | null;
}

export const MerchantCustomNFT: React.FC<MerchantCustomNFTProps> = ({
  merchantId,
  subscriptionPlan
}) => {
  const { toast } = useToast();
  const [nfts, setNfts] = useState<MerchantCustomNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNft, setEditingNft] = useState<MerchantCustomNFT | null>(null);
  const [formData, setFormData] = useState({
    nft_name: '',
    description: '',
    image_url: '',
    discount_code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_purchase_amount: 0,
    max_uses: 0,
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  // Check if merchant has custom NFT feature based on subscription plan
  const hasCustomNFTFeature = subscriptionPlan?.features?.some(
    (feature: any) => feature.name === 'custom_nft_creation'
  ) || subscriptionPlan?.name?.toLowerCase().includes('momentum') || 
     subscriptionPlan?.name?.toLowerCase().includes('energizer') ||
     subscriptionPlan?.name?.toLowerCase().includes('cloud') ||
     subscriptionPlan?.name?.toLowerCase().includes('super');

  useEffect(() => {
    if (hasCustomNFTFeature) {
      loadCustomNFTs();
    }
  }, [merchantId, hasCustomNFTFeature]);

  const loadCustomNFTs = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_custom_nfts')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNfts(data || []);
    } catch (error) {
      console.error('Error loading custom NFTs:', error);
      toast({
        title: "Failed to Load NFTs",
        description: "Could not load your custom NFTs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDiscountCode = () => {
    const prefix = formData.nft_name.replace(/\s+/g, '').toUpperCase().substring(0, 3);
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${randomSuffix}`;
  };

  const handleCreateNFT = async () => {
    if (!formData.nft_name || !formData.description || !formData.discount_code) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const nftData = {
        ...formData,
        merchant_id: merchantId,
        current_uses: 0,
        discount_code: formData.discount_code || generateDiscountCode(),
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      };

      const { data, error } = await supabase
        .from('merchant_custom_nfts')
        .insert(nftData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "NFT Created Successfully",
        description: `Your custom NFT "${formData.nft_name}" has been created with discount code "${nftData.discount_code}".`,
        variant: "default"
      });

      setShowCreateModal(false);
      resetForm();
      loadCustomNFTs();
    } catch (error) {
      console.error('Error creating NFT:', error);
      toast({
        title: "Failed to Create NFT",
        description: error instanceof Error ? error.message : "Could not create the NFT. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNFT = async () => {
    if (!editingNft) return;

    try {
      const { error } = await supabase
        .from('merchant_custom_nfts')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNft.id);

      if (error) {
        throw error;
      }

      toast({
        title: "NFT Updated Successfully",
        description: `Your custom NFT "${formData.nft_name}" has been updated.`,
        variant: "default"
      });

      setEditingNft(null);
      resetForm();
      loadCustomNFTs();
    } catch (error) {
      console.error('Error updating NFT:', error);
      toast({
        title: "Failed to Update NFT",
        description: error instanceof Error ? error.message : "Could not update the NFT. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNFT = async (nftId: string) => {
    try {
      const { error } = await supabase
        .from('merchant_custom_nfts')
        .delete()
        .eq('id', nftId);

      if (error) {
        throw error;
      }

      toast({
        title: "NFT Deleted",
        description: "Your custom NFT has been deleted.",
        variant: "default"
      });

      loadCustomNFTs();
    } catch (error) {
      console.error('Error deleting NFT:', error);
      toast({
        title: "Failed to Delete NFT",
        description: "Could not delete the NFT. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to Clipboard",
      description: `Discount code "${code}" has been copied.`,
      variant: "default"
    });
  };

  const resetForm = () => {
    setFormData({
      nft_name: '',
      description: '',
      image_url: '',
      discount_code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase_amount: 0,
      max_uses: 0,
      valid_from: '',
      valid_until: '',
      is_active: true
    });
  };

  const openEditModal = (nft: MerchantCustomNFT) => {
    setEditingNft(nft);
    setFormData({
      nft_name: nft.nft_name,
      description: nft.description,
      image_url: nft.image_url,
      discount_code: nft.discount_code,
      discount_type: nft.discount_type,
      discount_value: nft.discount_value,
      min_purchase_amount: nft.min_purchase_amount || 0,
      max_uses: nft.max_uses || 0,
      valid_from: nft.valid_from.split('T')[0],
      valid_until: nft.valid_until.split('T')[0],
      is_active: nft.is_active
    });
  };

  if (!hasCustomNFTFeature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Custom NFT Creation
          </CardTitle>
          <CardDescription>
            Create custom loyalty NFTs with discount codes for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Custom NFT Feature Not Available</h3>
            <p className="text-gray-600 mb-4">
              This feature is available with Momentum, Energizer, Cloud, or Super subscription plans.
            </p>
            <Button variant="outline">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom NFTs</h2>
          <p className="text-gray-600">Create custom loyalty NFTs with discount codes for your customers</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom NFT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom NFT</DialogTitle>
              <DialogDescription>
                Create a custom loyalty NFT with discount codes for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nft_name">NFT Name *</Label>
                  <Input
                    id="nft_name"
                    value={formData.nft_name}
                    onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                    placeholder="e.g., VIP Member Card"
                  />
                </div>
                <div>
                  <Label htmlFor="discount_code">Discount Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount_code"
                      value={formData.discount_code}
                      onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                      placeholder="e.g., VIP2024"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, discount_code: generateDiscountCode() })}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your custom NFT and its benefits..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/your-nft-image.jpg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount ($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                  />
                </div>
                <div>
                  <Label htmlFor="min_purchase_amount">Min Purchase ($)</Label>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max Uses (0 = unlimited)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNFT}>
                  Create NFT
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editingNft} onOpenChange={() => setEditingNft(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Custom NFT</DialogTitle>
              <DialogDescription>
                Update your custom loyalty NFT details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_nft_name">NFT Name *</Label>
                  <Input
                    id="edit_nft_name"
                    value={formData.nft_name}
                    onChange={(e) => setFormData({ ...formData, nft_name: e.target.value })}
                    placeholder="e.g., VIP Member Card"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_discount_code">Discount Code *</Label>
                  <Input
                    id="edit_discount_code"
                    value={formData.discount_code}
                    onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., VIP2024"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_description">Description *</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your custom NFT and its benefits..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingNft(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateNFT}>
                  Update NFT
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* NFTs List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading custom NFTs...</p>
        </div>
      ) : nfts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Custom NFTs Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first custom NFT with discount codes to reward your customers.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First NFT
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <Card key={nft.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{nft.nft_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {nft.description}
                    </CardDescription>
                  </div>
                  <Badge variant={nft.is_active ? "default" : "secondary"}>
                    {nft.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nft.image_url && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={nft.image_url}
                        alt={nft.nft_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Discount Code:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {nft.discount_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyDiscountCode(nft.discount_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Discount:</span>
                      <div className="font-medium">
                        {nft.discount_type === 'percentage' 
                          ? `${nft.discount_value}%` 
                          : `$${nft.discount_value}`
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Uses:</span>
                      <div className="font-medium">
                        {nft.current_uses}{nft.max_uses > 0 ? `/${nft.max_uses}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>Valid: {new Date(nft.valid_from).toLocaleDateString()} - {new Date(nft.valid_until).toLocaleDateString()}</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(nft)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteNFT(nft.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
