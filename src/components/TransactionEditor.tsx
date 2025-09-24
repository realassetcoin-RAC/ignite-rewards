import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, Calendar, DollarSign, Receipt, User, MessageSquare } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  merchant_id: string;
  loyalty_number: string;
  transaction_amount: number;
  transaction_date: string;
  receipt_number: string;
  customer_name?: string;
  comments?: string;
  points_awarded?: number;
  created_at: string;
}

interface TransactionEditorProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  merchantId: string;
}

export const TransactionEditor: React.FC<TransactionEditorProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  merchantId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    receipt_number: '',
    transaction_date: '',
    customer_name: '',
    comments: ''
  });

  // Initialize form data when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.transaction_amount.toString(),
        receipt_number: transaction.receipt_number,
        transaction_date: transaction.transaction_date.split('T')[0], // Format for date input
        customer_name: transaction.customer_name || '',
        comments: transaction.comments || ''
      });
    }
  }, [transaction]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isWithinEditWindow = (transactionDate: string): boolean => {
    const transactionDateObj = new Date(transactionDate);
    const now = new Date();
    const daysDifference = (now.getTime() - transactionDateObj.getTime()) / (1000 * 60 * 60 * 24);
    return daysDifference <= 30;
  };

  const handleSave = async () => {
    if (!transaction) return;

    // Validate required fields
    if (!formData.amount || !formData.receipt_number || !formData.transaction_date) {
      toast({
        title: "Validation Error",
        description: "Amount, Receipt Number, and Transaction Date are required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check if within 30-day edit window
    if (!isWithinEditWindow(transaction.transaction_date)) {
      toast({
        title: "Edit Window Expired",
        description: "Transactions can only be edited within 30 days of the original transaction date.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updatedTransaction = {
        ...transaction,
        transaction_amount: parseFloat(formData.amount),
        receipt_number: formData.receipt_number,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        customer_name: formData.customer_name || null,
        comments: formData.comments || null
      };

      // Update transaction in database
      const { error } = await supabase
        .from('loyalty_transactions')
        .update({
          transaction_amount: updatedTransaction.transaction_amount,
          receipt_number: updatedTransaction.receipt_number,
          transaction_date: updatedTransaction.transaction_date,
          customer_name: updatedTransaction.customer_name,
          comments: updatedTransaction.comments
        })
        .eq('id', transaction.id)
        .eq('merchant_id', merchantId); // Security: ensure merchant can only edit their own transactions

      if (error) {
        throw error;
      }

      toast({
        title: "Transaction Updated",
        description: "Transaction has been successfully updated.",
      });

      onSave(updatedTransaction);
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      receipt_number: '',
      transaction_date: '',
      customer_name: '',
      comments: ''
    });
    onClose();
  };

  if (!transaction) return null;

  const canEdit = isWithinEditWindow(transaction.transaction_date);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Edit Transaction
          </DialogTitle>
          <DialogDescription>
            Edit transaction details. Changes are only allowed within 30 days of the original transaction date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Transaction Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Transaction ID:</span>
                <p className="font-mono">{transaction.id.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-muted-foreground">Loyalty Number:</span>
                <p className="font-mono">{transaction.loyalty_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Points Awarded:</span>
                <p>{transaction.points_awarded || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{new Date(transaction.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {!canEdit && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-destructive font-medium">
                ⚠️ Edit Window Expired
              </p>
              <p className="text-destructive/80 text-sm mt-1">
                This transaction is older than 30 days and cannot be edited.
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount (Required) */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount (Required) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
                disabled={!canEdit}
                className="bg-background"
              />
            </div>

            {/* Receipt Number (Required) */}
            <div className="space-y-2">
              <Label htmlFor="receipt_number" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Receipt Number (Required) *
              </Label>
              <Input
                id="receipt_number"
                type="text"
                value={formData.receipt_number}
                onChange={(e) => handleInputChange('receipt_number', e.target.value)}
                placeholder="Enter receipt number"
                required
                disabled={!canEdit}
                className="bg-background"
              />
            </div>

            {/* Transaction Date (Required) */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Transaction Date (Required) *
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                required
                disabled={!canEdit}
                className="bg-background"
              />
            </div>

            {/* Customer Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="customer_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name (Optional)
              </Label>
              <Input
                id="customer_name"
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Enter customer name"
                disabled={!canEdit}
                className="bg-background"
              />
            </div>
          </div>

          {/* Comments (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder="Enter any additional comments or notes"
              rows={3}
              disabled={!canEdit}
              className="bg-background resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !canEdit}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
