import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Calendar, DollarSign, Hash, CreditCard, Link as LinkIcon, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  loyalty_number: string;
  transaction_amount: number;
  transaction_reference: string;
  reward_points: number;
  transaction_date: string;
  user_loyalty_cards?: {
    full_name: string;
    email: string;
  };
}

interface MerchantData {
  id: string;
  business_name: string;
  status: string;
  subscription_plan_id?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  trial_end_date?: string | null;
  payment_link_url?: string | null;
}

const MerchantDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkMerchantAccess();
    loadTransactions();
  }, []);

  const checkMerchantAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the merchant dashboard.",
          variant: "destructive",
        });
        return;
      }

      const { data: merchantData, error } = await (supabase as any)
        .from('merchants')
        .select('id, business_name, status, subscription_plan_id, subscription_start_date, subscription_end_date, trial_end_date, payment_link_url')
        .eq('user_id', user.id)
        .single();

      if (error || !merchantData) {
        toast({
          title: "Access Denied",
          description: "You don't have merchant access. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      setMerchant(merchantData);
    } catch (error) {
      console.error('Error checking merchant access:', error);
      toast({
        title: "Error",
        description: "Failed to verify merchant access.",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchantData } = await (supabase as any)
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchantData) return;

      const { data, error } = await (supabase as any)
        .from('loyalty_transactions')
        .select(`
          *,
          user_loyalty_cards (
            full_name,
            email
          )
        `)
        .eq('merchant_id', merchantData?.id)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load transactions.",
          variant: "destructive",
        });
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTransactions();
  };

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You need merchant access to view this dashboard.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Merchant Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            Welcome back, {merchant.business_name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {merchant.trial_end_date && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Trial until {new Date(merchant.trial_end_date).toLocaleDateString()}
              </Badge>
            )}
            {merchant.subscription_end_date && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Plan expires {new Date(merchant.subscription_end_date).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${transactions.reduce((sum, t) => sum + Number(t.transaction_amount), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Distributed</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.reduce((sum, t) => sum + t.reward_points, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setShowQrGenerator(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {merchant.payment_link_url && (
            <Button variant="outline" asChild>
              <a href={merchant.payment_link_url} target="_blank" rel="noreferrer">
                <LinkIcon className="w-4 h-4 mr-2" /> Renew Subscription
              </a>
            </Button>
          )}
        </div>

        {/* Subscription & Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={merchant.status === 'active' ? 'default' : 'secondary'} className="capitalize">{merchant.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start</span>
                <span>{merchant.subscription_start_date ? new Date(merchant.subscription_start_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End</span>
                <span>{merchant.subscription_end_date ? new Date(merchant.subscription_end_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trial End</span>
                <span>{merchant.trial_end_date ? new Date(merchant.trial_end_date).toLocaleDateString() : '-'}</span>
              </div>
              {merchant.payment_link_url && (
                <div className="pt-2">
                  <Button variant="outline" asChild className="w-full">
                    <a href={merchant.payment_link_url} target="_blank" rel="noreferrer">
                      <LinkIcon className="w-4 h-4 mr-2" /> Open Payment Portal
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first QR code to start collecting customer data.
                </p>
                <Button onClick={() => setShowQrGenerator(true)}>
                  Generate QR Code
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Customer</TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell">Loyalty Number</TableHead>
                      <TableHead className="min-w-[80px]">Amount</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">Reference</TableHead>
                      <TableHead className="min-w-[60px]">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                            {format(new Date(transaction.transaction_date), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.user_loyalty_cards?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{transaction.user_loyalty_cards?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="font-mono">
                            {transaction.loyalty_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(transaction.transaction_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="font-mono">
                            {transaction.transaction_reference}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {transaction.reward_points} pts
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Generator Dialog */}
        {showQrGenerator && merchant && (
          <QrCodeGenerator
            merchantId={merchant.id}
            onClose={() => setShowQrGenerator(false)}
            onTransactionCreated={loadTransactions}
          />
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;