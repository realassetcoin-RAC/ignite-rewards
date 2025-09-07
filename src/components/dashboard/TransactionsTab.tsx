import { useState, useEffect } from "react";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Activity, TrendingUp, Calendar, Building2 } from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  merchant_id: string;
  loyalty_number: string;
  transaction_amount: number;
  points_earned: number;
  transaction_reference: string | null;
  transaction_date: string;
  created_at: string;
  merchants: {
    business_name: string;
    logo_url: string | null;
  };
}

const TransactionsTab = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSpent: 0,
    totalPointsEarned: 0,
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  // Smart data refresh - refreshes transactions data when returning to app
  const refreshTransactionsData = async () => {
    console.log('🔄 Refreshing transactions data...');
    if (user) {
      await loadTransactions();
    }
  };

  useSmartDataRefresh(refreshTransactionsData, {
    debounceMs: 2000, // 2 second debounce for transactions data
    enabled: !!user,
    dependencies: [user?.id] // Refresh when user changes
  });

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          merchants!inner (
            business_name,
            logo_url
          )
        `)
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        });
        return;
      }

      // For now, just use merchant_id since cross-schema relations are complex
      setTransactions(data || []);
      
      // Calculate stats
      const totalTransactions = data?.length || 0;
      const totalSpent = data?.reduce((sum, t) => sum + Number(t.transaction_amount), 0) || 0;
      const totalPointsEarned = data?.reduce((sum, t) => sum + Number(t.points_earned), 0) || 0;
      
      setStats({
        totalTransactions,
        totalSpent,
        totalPointsEarned,
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPointsEarned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View all your loyalty point earning transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">
                Start shopping with our partner merchants to earn loyalty points!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{transaction.merchants.business_name}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {transaction.merchant_id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${Number(transaction.transaction_amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          +{transaction.points_earned} pts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.transaction_reference ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {transaction.transaction_reference}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsTab;