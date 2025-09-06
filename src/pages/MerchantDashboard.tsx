import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Calendar, DollarSign, Hash, CreditCard, Link as LinkIcon, Shield, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  user_id: string;
  merchant_id: string;
  loyalty_number: string;
  transaction_amount: number;
  transaction_reference: string | null;
  points_earned: number;
  transaction_date: string;
  created_at: string;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkMerchantAccess();
    loadTransactions();
    setIsLoaded(true);
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
          user_loyalty_cards!loyalty_transactions_loyalty_number_fkey (
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
      <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

        <Card className="relative z-10 w-full max-w-md card-gradient border-primary/20 backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className={`text-xl font-semibold text-foreground mb-2 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}>
              Access Required
            </h2>
            <p className={`text-muted-foreground mb-4 ${
              isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
            }`}>
              You need merchant access to view this dashboard.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className={`bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
              }`}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold text-foreground ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}>
                Merchant Dashboard
              </h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
              }`}
            >
              <Link to="/" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            </Button>
          </div>
          <p className={`text-sm sm:text-base text-muted-foreground truncate ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
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
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Hash className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{transactions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                ${transactions.reduce((sum, t) => sum + Number(t.transaction_amount), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Distributed</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">
                {transactions.reduce((sum, t) => sum + t.points_earned, 0)}
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
                            {transaction.points_earned} pts
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