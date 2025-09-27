import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Target, 
  Calendar,
  Users,
  BarChart3,
  Wallet,
  Coins,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface FractionalizedAsset {
  id: string;
  name: string;
  description: string;
  total_value: number;
  total_shares: number;
  price_per_share: number;
  category: string;
  risk_level: 'low' | 'medium' | 'high';
  expected_return: number;
  min_investment: number;
  max_investment: number;
  current_investment: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

interface UserInvestment {
  id: string;
  user_id: string;
  asset_id: string;
  shares_purchased: number;
  investment_amount: number;
  purchase_price: number;
  current_value: number;
  created_at: string;
  asset: FractionalizedAsset;
}

interface FractionalizedInvestmentProps {
  userId: string;
  userBalance: number;
  onInvestmentUpdate: () => void;
}

export const FractionalizedInvestment: React.FC<FractionalizedInvestmentProps> = ({
  userId,
  userBalance,
  onInvestmentUpdate
}) => {
  const { toast } = useToast();
  const [assets, setAssets] = useState<FractionalizedAsset[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FractionalizedAsset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadAssets(),
        loadUserInvestments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Failed to Load Data",
        description: "Could not load investment data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from('fractionalized_assets')
      .select('*')
      .eq('is_active', true)
      .order('expected_return', { ascending: false });

    if (error) {
      throw error;
    }

    setAssets(data || []);
  };

  const loadUserInvestments = async () => {
    const { data, error } = await supabase
      .from('user_fractional_investments')
      .select(`
        *,
        fractionalized_assets (*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    setUserInvestments(data || []);
  };

  const handleInvest = async () => {
    if (!selectedAsset || !investmentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select an asset and enter an investment amount.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount.",
        variant: "destructive"
      });
      return;
    }

    if (amount < selectedAsset.min_investment) {
      toast({
        title: "Amount Too Low",
        description: `Minimum investment is $${selectedAsset.min_investment.toLocaleString()}.`,
        variant: "destructive"
      });
      return;
    }

    if (amount > selectedAsset.max_investment) {
      toast({
        title: "Amount Too High",
        description: `Maximum investment is $${selectedAsset.max_investment.toLocaleString()}.`,
        variant: "destructive"
      });
      return;
    }

    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this investment.",
        variant: "destructive"
      });
      return;
    }

    setInvesting(true);

    try {
      const sharesToPurchase = Math.floor(amount / selectedAsset.price_per_share);
      const actualInvestmentAmount = sharesToPurchase * selectedAsset.price_per_share;

      // Create investment record
      const { data: investment, error: investmentError } = await supabase
        .from('user_fractional_investments')
        .insert({
          user_id: userId,
          asset_id: selectedAsset.id,
          shares_purchased: sharesToPurchase,
          investment_amount: actualInvestmentAmount,
          purchase_price: selectedAsset.price_per_share,
          current_value: actualInvestmentAmount
        })
        .select()
        .single();

      if (investmentError) {
        throw investmentError;
      }

      // Update asset's current investment
      const { error: updateError } = await supabase
        .from('fractionalized_assets')
        .update({
          current_investment: selectedAsset.current_investment + actualInvestmentAmount
        })
        .eq('id', selectedAsset.id);

      if (updateError) {
        throw updateError;
      }

      // Deduct from user balance (this would integrate with your points/rewards system)
      // For now, we'll just show success

      toast({
        title: "Investment Successful",
        description: `You've invested $${actualInvestmentAmount.toLocaleString()} in ${selectedAsset.name} (${sharesToPurchase} shares).`,
        variant: "default"
      });

      setShowInvestmentModal(false);
      setSelectedAsset(null);
      setInvestmentAmount('');
      onInvestmentUpdate();
      loadData();

    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: "Investment Failed",
        description: error instanceof Error ? error.message : "Failed to process investment.",
        variant: "destructive"
      });
    } finally {
      setInvesting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalPortfolioValue = () => {
    return userInvestments.reduce((total, investment) => {
      const currentValue = investment.shares_purchased * investment.asset.price_per_share;
      return total + currentValue;
    }, 0);
  };

  const getTotalInvestmentAmount = () => {
    return userInvestments.reduce((total, investment) => total + investment.investment_amount, 0);
  };

  const getPortfolioReturn = () => {
    const totalInvested = getTotalInvestmentAmount();
    const currentValue = getTotalPortfolioValue();
    return totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading investments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Fractionalized Investments</h2>
        <p className="text-muted-foreground">
          Invest your rewards in fractionalized assets and earn returns on your loyalty points.
        </p>
      </div>

      {/* Portfolio Summary */}
      {userInvestments.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Portfolio Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${getTotalPortfolioValue().toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Current Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${getTotalInvestmentAmount().toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Invested</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getPortfolioReturn() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getPortfolioReturn() >= 0 ? '+' : ''}{getPortfolioReturn().toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Total Return</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Assets */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Assets</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => {
                setSelectedAsset(asset);
                setShowInvestmentModal(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription>{asset.description}</CardDescription>
                  </div>
                  <Badge className={getRiskColor(asset.risk_level)}>
                    {asset.risk_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price per Share</span>
                  <span className="font-semibold">${asset.price_per_share.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expected Return</span>
                  <span className="text-sm font-semibold text-green-600">
                    {asset.expected_return}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Investment Progress</span>
                    <span>
                      {Math.round((asset.current_investment / asset.total_value) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(asset.current_investment / asset.total_value) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Min: ${asset.min_investment.toLocaleString()} • 
                  Max: ${asset.max_investment.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Investments */}
      {userInvestments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Investments</h3>
          <div className="space-y-4">
            {userInvestments.map((investment) => (
              <Card key={investment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{investment.asset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {investment.shares_purchased} shares • 
                        Purchased at ${investment.purchase_price.toFixed(2)}/share
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(investment.shares_purchased * investment.asset.price_per_share).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestmentModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invest in {selectedAsset.name}</CardTitle>
              <CardDescription>
                Enter the amount you want to invest in this asset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investment-amount">Investment Amount ($)</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={selectedAsset.min_investment}
                  max={Math.min(selectedAsset.max_investment, userBalance)}
                />
                <div className="text-xs text-muted-foreground">
                  Min: ${selectedAsset.min_investment.toLocaleString()} • 
                  Max: ${Math.min(selectedAsset.max_investment, userBalance).toLocaleString()}
                </div>
              </div>

              {investmentAmount && !isNaN(parseFloat(investmentAmount)) && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Shares to purchase:</span>
                      <span className="font-semibold">
                        {Math.floor(parseFloat(investmentAmount) / selectedAsset.price_per_share)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total cost:</span>
                      <span className="font-semibold">
                        ${(Math.floor(parseFloat(investmentAmount) / selectedAsset.price_per_share) * selectedAsset.price_per_share).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleInvest}
                  disabled={investing || !investmentAmount}
                  className="flex-1"
                >
                  {investing ? "Investing..." : "Invest"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInvestmentModal(false);
                    setSelectedAsset(null);
                    setInvestmentAmount('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
