import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface CustomNFT {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  image_url: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
}

interface CustomNFTUploadProps {
  merchantId: string;
  className?: string;
}

export const CustomNFTUpload: React.FC<CustomNFTUploadProps> = ({ merchantId, className }) => {
  const { toast } = useToast();
  const [customNFTs, setCustomNFTs] = useState<CustomNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingNFT, setEditingNFT] = useState<CustomNFT | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    benefits: '',
    image: null as File | null
  });

  React.useEffect(() => {
    fetchCustomNFTs();
  }, [merchantId]);

  const fetchCustomNFTs = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_custom_nfts')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCustomNFTs(data || []);
    } catch {
      // console.error('Error fetching custom NFTs:', error);
      toast({
        title: "Error",
        description: "Failed to load custom NFTs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${merchantId}_${Date.now()}.${fileExt}`;
      const filePath = `custom-nfts/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('nft-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('nft-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch {
      // console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and description are required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.image) {
      toast({
        title: "Validation Error",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload image
      const imageUrl = await uploadImage(formData.image);

      // Parse benefits
      const benefits = formData.benefits
        .split('\n')
        .map(benefit => benefit.trim())
        .filter(benefit => benefit.length > 0);

      if (editingNFT) {
        // Update existing NFT
        const { data, error } = await supabase
          .from('merchant_custom_nfts')
          .update({
            name: formData.name,
            description: formData.description,
            image_url: imageUrl,
            benefits,
            is_active: true
          })
          .eq('id', editingNFT.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCustomNFTs(prev => prev.map(nft => nft.id === editingNFT.id ? data : nft));
        toast({
          title: "NFT Updated",
          description: "Custom NFT has been updated successfully.",
        });
      } else {
        // Create new NFT
        const { data, error } = await supabase
          .from('merchant_custom_nfts')
          .insert({
            merchant_id: merchantId,
            name: formData.name,
            description: formData.description,
            image_url: imageUrl,
            benefits,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCustomNFTs(prev => [data, ...prev]);
        toast({
          title: "NFT Created",
          description: "Custom NFT has been created successfully.",
        });
      }

      resetForm();
      setShowUploadDialog(false);
    } catch {
      // console.error('Error saving NFT:', error);
      toast({
        title: "Error",
        description: "Failed to save custom NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (nft: CustomNFT) => {
    try {
      const { data, error } = await supabase
        .from('merchant_custom_nfts')
        .update({ is_active: !nft.is_active })
        .eq('id', nft.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCustomNFTs(prev => prev.map(n => n.id === nft.id ? data : n));
      toast({
        title: "Status Updated",
        description: `NFT has been ${data.is_active ? 'activated' : 'deactivated'}.`,
      });
    } catch {
      // console.error('Error updating NFT status:', error);
      toast({
        title: "Error",
        description: "Failed to update NFT status.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (nftId: string) => {
    try {
      const { error } = await supabase
        .from('merchant_custom_nfts')
        .delete()
        .eq('id', nftId);

      if (error) {
        throw error;
      }

      setCustomNFTs(prev => prev.filter(nft => nft.id !== nftId));
      toast({
        title: "NFT Deleted",
        description: "Custom NFT has been deleted successfully.",
      });
    } catch {
      // console.error('Error deleting NFT:', error);
      toast({
        title: "Error",
        description: "Failed to delete NFT.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      benefits: '',
      image: null
    });
    setPreviewUrl(null);
    setEditingNFT(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (nft: CustomNFT) => {
    setEditingNFT(nft);
    setFormData({
      name: nft.name,
      description: nft.description,
      benefits: nft.benefits.join('\n'),
      image: null
    });
    setPreviewUrl(nft.image_url);
    setShowUploadDialog(true);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Custom NFT Cards
            </CardTitle>
            <Button onClick={() => {
              resetForm();
              setShowUploadDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Upload NFT
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customNFTs.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No custom NFTs uploaded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first custom loyalty NFT card to offer unique rewards to customers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customNFTs.map((nft) => (
                <Card key={nft.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={nft.image_url}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant={nft.is_active ? 'default' : 'secondary'}>
                        {nft.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{nft.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {nft.description}
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Benefits: {nft.benefits.length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(nft)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(nft)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {nft.is_active ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(nft.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload/Edit Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        setShowUploadDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNFT ? 'Edit Custom NFT' : 'Upload Custom NFT'}
            </DialogTitle>
            <DialogDescription>
              {editingNFT 
                ? 'Update your custom loyalty NFT card.'
                : 'Create a custom loyalty NFT card for your customers.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>NFT Image *</Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">No image</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image (max 5MB). Recommended: 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">NFT Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter NFT name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter NFT description"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (one per line)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="Enter benefits, one per line&#10;Example:&#10;10% discount on all items&#10;Free shipping&#10;Exclusive access to sales"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowUploadDialog(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || !formData.name.trim() || !formData.description.trim() || !formData.image}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingNFT ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {editingNFT ? 'Update NFT' : 'Upload NFT'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
