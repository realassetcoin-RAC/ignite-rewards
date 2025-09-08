import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Gift, 
  Receipt, 
  Hash, 
  DollarSign, 
  User,
  Plus,
  Loader2
} from 'lucide-react';

interface MerchantRewardGeneratorProps {
  merchantId: string;
  onTransactionCreated?: () => void;
}

interface RewardFormData {
  loyaltyNumber: string;
  transactionValue: string;
  receiptNumber: string;
  customerName?: string;
  notes?: string;
}

const MerchantRewardGenerator: React.FC<MerchantRewardGeneratorProps> = ({
  merchantId,
  onTransactionCreated
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RewardFormData>({
    loyaltyNumber: '',
    transactionValue: '',
    receiptNumber: '',
    customerName: '',
    notes: ''
  });
  
  const { toast } = useToast();

  const handleInputChange = (field: keyof RewardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.loyaltyNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Loyalty number is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.transactionValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Transaction value is required.",
        variant: "destructive",
      });
      return false;
    }

    const transactionValue = parseFloat(formData.transactionValue);
    if (isNaN(transactionValue) || transactionValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid transaction value greater than 0.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.receiptNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Receipt number is required.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const calculateRewardPoints = (transactionValue: number): number => {
    // Default reward rate: 1 point per dollar spent
    // This can be customized based on merchant settings
    return Math.floor(transactionValue);
  };

  const generateReward = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const transactionValue = parseFloat(formData.transactionValue);
      const rewardPoints = calculateRewardPoints(transactionValue);

      // Create the reward transaction record
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .insert({
          merchant_id: merchantId,
          loyalty_number: formData.loyaltyNumber.trim(),
          transaction_amount: transactionValue,
          receipt_number: formData.receiptNumber.trim(),
          points_earned: rewardPoints,
          customer_name: formData.customerName?.trim() || null,
          notes: formData.notes?.trim() || null,
          transaction_type: 'manual_entry',
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reward transaction:', error);
        toast({
          title: "Error",
          description: "Failed to generate reward. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success
      toast({
        title: "Reward Generated Successfully",
        description: `Customer with loyalty number ${formData.loyaltyNumber} earned ${rewardPoints} points for transaction $${transactionValue.toFixed(2)}.`,
      });

      // Reset form
      setFormData({
        loyaltyNumber: '',
        transactionValue: '',
        receiptNumber: '',
        customerName: '',
        notes: ''
      });

      // Close dialog
      setOpen(false);

      // Notify parent component
      if (onTransactionCreated) {
        onTransactionCreated();
      }

    } catch (error) {
      console.error('Error generating reward:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      generateReward();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gradient">
          <Gift className="w-4 h-4 mr-2" />
          Generate Reward
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Generate Customer Reward
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Loyalty Number */}
          <div className="space-y-2">
            <Label htmlFor="loyaltyNumber" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Loyalty Number *
            </Label>
            <Input
              id="loyaltyNumber"
              placeholder="Enter customer loyalty number"
              value={formData.loyaltyNumber}
              onChange={(e) => handleInputChange('loyaltyNumber', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {/* Transaction Value */}
          <div className="space-y-2">
            <Label htmlFor="transactionValue" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Transaction Value *
            </Label>
            <Input
              id="transactionValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.transactionValue}
              onChange={(e) => handleInputChange('transactionValue', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipt Number *
            </Label>
            <Input
              id="receiptNumber"
              placeholder="Enter receipt number"
              value={formData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {/* Customer Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Name (Optional)
            </Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this transaction"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Reward Preview */}
          {formData.transactionValue && !isNaN(parseFloat(formData.transactionValue)) && (
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-2">Reward Preview:</div>
                <div className="text-lg font-semibold text-primary">
                  {calculateRewardPoints(parseFloat(formData.transactionValue))} points
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on ${parseFloat(formData.transactionValue).toFixed(2)} transaction
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={generateReward}
              disabled={loading}
              className="flex-1 btn-gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Reward
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantRewardGenerator;
