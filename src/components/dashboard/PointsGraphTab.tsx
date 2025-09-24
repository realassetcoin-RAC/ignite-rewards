import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface PointsData {
  date: string;
  points: number;
  transactions: number;
  cumulative: number;
}

interface MerchantData {
  name: string;
  points: number;
  transactions: number;
  color: string;
}

const PointsGraphTab = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [pointsData, setPointsData] = useState<PointsData[]>([]);
  const [merchantData, setMerchantData] = useState<MerchantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [chartType, setChartType] = useState("line");

  // const _chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  useEffect(() => {
    if (user) {
      loadPointsData();
    }
  }, [user, timeRange]);

  const loadPointsData = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const { data: transactions, error } = await supabase
        .from('loyalty_transactions')
        .select('transaction_date, points_earned, transaction_amount, merchant_id')
        .eq('user_id', user?.id)
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) {
        console.error('Error loading points data:', error);
        toast({
          title: "Error",
          description: "Failed to load points data",
          variant: "destructive",
        });
        return;
      }

      // Process data for line chart (simplified without merchant lookups)
      const dailyData: { [key: string]: { points: number; transactions: number; } } = {};

      if (transactions) {
        for (const t of transactions) {
          const date = new Date(t.transaction_date).toLocaleDateString();

          // Daily data
          if (!dailyData[date]) {
            dailyData[date] = { points: 0, transactions: 0 };
          }
          dailyData[date].points += t.points_earned;
          dailyData[date].transactions += 1;
        }
      }

      // Convert to chart data with cumulative points
      let cumulative = 0;
      const chartData = Object.entries(dailyData).map(([date, data]) => {
        cumulative += data.points;
        return {
          date,
          points: data.points,
          transactions: data.transactions,
          cumulative,
        };
      });

      setPointsData(chartData);
      setMerchantData([]); // Simplified for now
    } catch (error) {
      console.error('Error loading points data:', error);
      toast({
        title: "Error",
        description: "Failed to load points data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = pointsData.reduce((sum, d) => sum + d.points, 0);
  const totalTransactions = pointsData.reduce((sum, d) => sum + d.transactions, 0);
  const avgPointsPerTransaction = totalTransactions > 0 ? totalPoints / totalTransactions : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Points/Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPointsPerTransaction.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Points Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Points Over Time
          </CardTitle>
          <CardDescription>
            Track your loyalty points earning progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pointsData.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No data available</h3>
              <p className="text-muted-foreground">
                Start earning points to see your progress here!
              </p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={pointsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Daily Points"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Cumulative Points"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={pointsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="points"
                      fill="hsl(var(--primary))"
                      name="Daily Points"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merchant Breakdown */}
      {merchantData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Points by Merchant
              </CardTitle>
              <CardDescription>
                See which merchants you earn the most points from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={merchantData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="points" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
              <CardDescription>
                Your most frequent merchant partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {merchantData.map((merchant) => (
                  <div key={merchant.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: merchant.color }}
                        />
                        <span className="font-medium">{merchant.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {merchant.transactions} transactions
                      </Badge>
                      <Badge variant="default">
                        {merchant.points} points
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PointsGraphTab;