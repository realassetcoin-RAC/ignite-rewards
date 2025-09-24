import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Copy, Trash2, Edit, Percent, DollarSign, Calendar, Eye } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface DiscountCodeManagerProps {
  merchantId: string;
  className?: string;
}

export const DiscountCodeManager: React.FC<DiscountCodeManagerProps> = ({ merchantId, className }) => {
  const { toast } = useToast();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_amount: '',
    max_discount: '',
    usage_limit: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchDiscountCodes();
  }, [merchantId]);

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_discount_codes')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDiscountCodes(data || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast({
        title: "Error",
        description: "Failed to load discount codes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Discount code is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('merchant_discount_codes')
        .insert({
          merchant_id: merchantId,
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: parseFloat(formData.value),
          min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          expires_at: formData.expires_at || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDiscountCodes(prev => [data, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Discount code created successfully.",
      });
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast({
        title: "Error",
        description: "Failed to create discount code.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCode = async () => {
    if (!editingCode) return;

    try {
      const { data, error } = await supabase
        .from('merchant_discount_codes')
        .update({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: parseFloat(formData.value),
          min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          expires_at: formData.expires_at || null
        })
        .eq('id', editingCode.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDiscountCodes(prev => prev.map(code => code.id === editingCode.id ? data : code));
      setEditingCode(null);
      resetForm();
      toast({
        title: "Success",
        description: "Discount code updated successfully.",
      });
    } catch (error) {
      console.error('Error updating discount code:', error);
      toast({
        title: "Error",
        description: "Failed to update discount code.",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const { data, error } = await supabase
        .from('merchant_discount_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDiscountCodes(prev => prev.map(c => c.id === code.id ? data : c));
      toast({
        title: "Success",
        description: `Discount code ${data.is_active ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error toggling discount code:', error);
      toast({
        title: "Error",
        description: "Failed to update discount code status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('merchant_discount_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        throw error;
      }

      setDiscountCodes(prev => prev.filter(code => code.id !== codeId));
      toast({
        title: "Success",
        description: "Discount code deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast({
        title: "Error",
        description: "Failed to delete discount code.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Discount code copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      min_amount: '',
      max_discount: '',
      usage_limit: '',
      expires_at: ''
    });
  };

  const openEditDialog = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: code.type,
      value: code.value.toString(),
      min_amount: code.min_amount?.toString() || '',
      max_discount: code.max_discount?.toString() || '',
      usage_limit: code.usage_limit?.toString() || '',
      expires_at: code.expires_at ? code.expires_at.split('T')[0] : ''
    });
    setShowCreateDialog(true);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getUsagePercentage = (used: number, limit?: number) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
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
              <Percent className="h-5 w-5" />
              Discount Codes
            </CardTitle>
            <Button onClick={() => {
              resetForm();
              setEditingCode(null);
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {discountCodes.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No discount codes created yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first discount code to start offering promotions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {discountCodes.map((code) => (
                <div key={code.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-medium text-lg">{code.code}</div>
                      <Badge variant={code.is_active ? 'default' : 'secondary'}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired(code.expires_at) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(code)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCode(code.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium flex items-center gap-1">
                        {code.type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {code.type === 'percentage' ? `${code.value}%` : `$${code.value}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>
                      <p className="font-medium">
                        {code.used_count} / {code.usage_limit || '∞'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Amount:</span>
                      <p className="font-medium">
                        {code.min_amount ? `$${code.min_amount}` : 'None'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {code.usage_limit && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Usage Progress</span>
                        <span>{getUsagePercentage(code.used_count, code.usage_limit)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${getUsagePercentage(code.used_count, code.usage_limit)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingCode(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </DialogTitle>
            <DialogDescription>
              {editingCode 
                ? 'Update your discount code settings.'
                : 'Create a new discount code for your customers.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_amount">Minimum Amount ($)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  value={formData.min_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_amount: e.target.value }))}
                  placeholder="50.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_discount">Maximum Discount ($)</Label>
                <Input
                  id="max_discount"
                  type="number"
                  step="0.01"
                  value={formData.max_discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_discount: e.target.value }))}
                  placeholder="100.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiration Date</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingCode(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingCode ? handleUpdateCode : handleCreateCode}
                className="flex-1"
              >
                {editingCode ? 'Update Code' : 'Create Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
