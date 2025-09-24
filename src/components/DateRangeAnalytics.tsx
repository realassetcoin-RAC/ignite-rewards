import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  Receipt, 
  DollarSign, 
  Coins, 
  TrendingUp,
  BarChart3,
  X
} from 'lucide-react';

interface AnalyticsData {
  totalCustomers: number;
  totalTransactions: number;
  totalVolume: number;
  totalRewards: number;
  averageTransactionValue: number;
  averageRewardsPerTransaction: number;
}

interface DateRangeAnalyticsProps {
  merchantId: string;
  currencySymbol?: string;
}

export const DateRangeAnalytics: React.FC<DateRangeAnalyticsProps> = ({
  merchantId,
  currencySymbol = '$'
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Initialize with blank date fields - user must select dates
  // Removed automatic date setting to allow blank fields by default

  const loadAnalytics = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setIsVisible(true);

      // Get transactions within date range
      const { data: transactions, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          user_loyalty_cards!loyalty_transactions_loyalty_number_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('merchant_id', merchantId)
        .gte('transaction_date', `${dateFrom}T00:00:00.000Z`)
        .lte('transaction_date', `${dateTo}T23:59:59.999Z`)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error loading analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive",
        });
        return;
      }

      // Calculate analytics
      const totalTransactions = transactions?.length || 0;
      const totalVolume = transactions?.reduce((sum, t) => sum + Number(t.transaction_amount), 0) || 0;
      const totalRewards = transactions?.reduce((sum, t) => sum + Number(t.points_earned), 0) || 0;
      
      // Get unique customers
      const uniqueCustomers = new Set(
        transactions?.map(t => t.user_loyalty_cards?.id).filter(Boolean) || []
      );
      const totalCustomers = uniqueCustomers.size;

      const averageTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      const averageRewardsPerTransaction = totalTransactions > 0 ? totalRewards / totalTransactions : 0;

      setAnalyticsData({
        totalCustomers,
        totalTransactions,
        totalVolume,
        totalRewards,
        averageTransactionValue,
        averageRewardsPerTransaction
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAnalytics = () => {
    setAnalyticsData(null);
    setIsVisible(false);
  };

  const formatDateRange = () => {
    if (!dateFrom || !dateTo) return '';
    const from = new Date(dateFrom).toLocaleDateString();
    const to = new Date(dateTo).toLocaleDateString();
    return `${from} - ${to}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Date Range Analytics
          </div>
          {isVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAnalytics}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <DatePicker
                date={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(date) => setDateFrom(date?.toISOString().split('T')[0] || '')}
                placeholder="Select start date"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <DatePicker
                date={dateTo ? new Date(dateTo) : undefined}
                onSelect={(date) => setDateTo(date?.toISOString().split('T')[0] || '')}
                placeholder="Select end date"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadAnalytics}
                disabled={loading || !dateFrom || !dateTo}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Analytics
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Analytics Results */}
          {isVisible && analyticsData && (
            <div className="space-y-6">
              {/* Date Range Display */}
              <div className="text-center">
                <Badge variant="outline" className="text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDateRange()}
                </Badge>
              </div>

              {/* Main Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-500">
                    {analyticsData.totalCustomers}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Customers</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg">
                  <Receipt className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-500">
                    {analyticsData.totalTransactions}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
                  <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-500">
                    {currencySymbol}{analyticsData.totalVolume.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg">
                  <Coins className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-500">
                    {analyticsData.totalRewards}
                  </div>
                  <div className="text-sm text-muted-foreground">Rewards Distributed</div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Transaction Value</span>
                    <span className="font-semibold">
                      {currencySymbol}{analyticsData.averageTransactionValue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Rewards per Transaction</span>
                    <span className="font-semibold">
                      {analyticsData.averageRewardsPerTransaction.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {analyticsData.totalCustomers} unique customers made {analyticsData.totalTransactions} transactions</p>
                  <p>• Total volume of {currencySymbol}{analyticsData.totalVolume.toFixed(2)} with {analyticsData.totalRewards} rewards distributed</p>
                  <p>• Average transaction value: {currencySymbol}{analyticsData.averageTransactionValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {isVisible && !analyticsData && !loading && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
              <p className="text-muted-foreground">
                No transactions found for the selected date range.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
