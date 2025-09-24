import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Users, 
  Coins, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';

// interface MerchantTransactionProcessorProps {
//   _merchantId: string;
// }

interface AnonymousTransaction {
  id: string;
  transaction_id: string;
  anonymous_user_id: string;
  amount: number;
  reward_amount: number;
  transaction_type: 'purchase' | 'refund' | 'cancellation';
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

const MerchantTransactionProcessor: React.FC<MerchantTransactionProcessorProps> = (/* _props */) => {
  const [transactions, setTransactions] = useState<AnonymousTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    rewardPercentage: '5' // Default 5% reward
  });
  const [showAnonymousUsers, setShowAnonymousUsers] = useState(false);
  const { toast } = useToast();

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2); // Assuming amounts are in cents
  };

  const calculateReward = (amount: number, percentage: number) => {
    return Math.floor((amount * percentage) / 100);
  };

  const processTransaction = async () => {
    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transaction amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const amount = Math.floor(parseFloat(newTransaction.amount) * 100); // Convert to cents
      const rewardPercentage = parseFloat(newTransaction.rewardPercentage);
      const rewardAmount = calculateReward(amount, rewardPercentage);

      // Generate a unique transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // In a real implementation, you would:
      // 1. Create an anonymous user if needed
      // 2. Process the transaction through the Solana contract
      // 3. Create notional earnings with 30-day vesting
      // 4. Update the database

      // For now, we'll simulate the process
      const mockTransaction: AnonymousTransaction = {
        id: `mock_${Date.now()}`,
        transaction_id: transactionId,
        anonymous_user_id: `anon_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        reward_amount: rewardAmount,
        transaction_type: 'purchase',
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [mockTransaction, ...prev]);

      toast({
        title: "Transaction Processed",
        description: `Successfully processed transaction. Customer earned ${formatAmount(rewardAmount)} in notional rewards.`,
      });

      // Reset form
      setNewTransaction({ amount: '', rewardPercentage: '5' });

    } catch {
      console.error('Error processing transaction');
      toast({
        title: "Error",
        description: "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelTransaction = async (transactionId: string) => {
    try {
      setLoading(true);

      // In a real implementation, you would:
      // 1. Call the Solana contract to cancel the transaction
      // 2. Mark notional earnings as cancelled
      // 3. Update the database

      setTransactions(prev => 
        prev.map(tx => 
          tx.transaction_id === transactionId 
            ? { ...tx, status: 'cancelled' as const }
            : tx
        )
      );

      toast({
        title: "Transaction Cancelled",
        description: "Transaction has been cancelled and rewards will not vest.",
      });

    } catch {
      console.error('Error cancelling transaction');
      toast({
        title: "Error",
        description: "Failed to cancel transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Processor */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Process Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reward Percentage</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="5"
                  value={newTransaction.rewardPercentage}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, rewardPercentage: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            {newTransaction.amount && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-sm text-muted-foreground mb-2">Transaction Preview:</div>
                <div className="flex items-center justify-between">
                  <span>Customer will earn:</span>
                  <span className="font-bold text-primary">
                    {formatAmount(calculateReward(parseFloat(newTransaction.amount) * 100, parseFloat(newTransaction.rewardPercentage)))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Rewards will vest over 30 days
                </div>
              </div>
            )}

            <Button
              onClick={processTransaction}
              disabled={loading || !newTransaction.amount}
              className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Process Transaction
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                Process your first transaction to see it appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-background/50 to-background/30 border border-primary/10">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="font-medium">
                        Transaction {transaction.transaction_id.slice(-8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatAmount(transaction.amount)}
                    </div>
                    <div className="text-sm text-primary">
                      +{formatAmount(transaction.reward_amount)} reward
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      {transaction.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelTransaction(transaction.transaction_id)}
                          className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anonymous User Analytics */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Anonymous User Analytics
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnonymousUsers(!showAnonymousUsers)}
            >
              {showAnonymousUsers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAnonymousUsers ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">
                    {transactions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">
                    {formatAmount(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">
                    {formatAmount(transactions.reduce((sum, tx) => sum + tx.reward_amount, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Rewards Distributed</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Privacy Note:</strong> All transactions are processed anonymously. No personal information is collected or stored.
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Click the eye icon to view anonymous user analytics
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantTransactionProcessor;
