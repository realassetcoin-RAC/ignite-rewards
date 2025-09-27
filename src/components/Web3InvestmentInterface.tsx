import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Web3InvestmentService, AssetInitiative, UserWallet, InvestmentTransaction } from '@/lib/Web3InvestmentService';
import {
  Wallet,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  Target,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  DollarSign,
  Coins,
  Bitcoin,
  Ethereum
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Web3InvestmentInterfaceProps {
  userId: string;
  userBalance: number; // RAC token balance for custodial users
  isCustodial: boolean;
}

export const Web3InvestmentInterface: React.FC<Web3InvestmentInterfaceProps> = ({
  userId,
  userBalance,
  isCustodial
}) => {
  const { toast } = useToast();
  const [assetInitiatives, setAssetInitiatives] = useState<AssetInitiative[]>([]);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitiative, setSelectedInitiative] = useState<AssetInitiative | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USDT' | 'SOL' | 'ETH' | 'BTC' | 'RAC'>('USDT');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isInvesting, setIsInvesting] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAssetInitiatives(),
        loadUserWallets(),
        loadUserPortfolio()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load investment data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssetInitiatives = async () => {
    try {
      const initiatives = await Web3InvestmentService.getAssetInitiatives();
      setAssetInitiatives(initiatives);
    } catch (error) {
      console.error('Failed to load asset initiatives:', error);
    }
  };

  const loadUserWallets = async () => {
    try {
      const wallets = await Web3InvestmentService.getUserWallets(userId);
      setUserWallets(wallets);
      if (wallets.length > 0) {
        setSelectedWallet(wallets[0]);
      }
    } catch (error) {
      console.error('Failed to load user wallets:', error);
    }
  };

  const loadUserPortfolio = async () => {
    try {
      const portfolio = await Web3InvestmentService.getUserPortfolio(userId);
      setUserPortfolio(portfolio);
    } catch (error) {
      console.error('Failed to load user portfolio:', error);
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USDT': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'ETH': return <Ethereum className="h-4 w-4 text-purple-500" />;
      case 'BTC': return <Bitcoin className="h-4 w-4 text-yellow-500" />;
      case 'SOL': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'RAC': return <Coins className="h-4 w-4 text-red-500" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental': return <Globe className="h-5 w-5 text-green-500" />;
      case 'social': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'governance': return <Target className="h-5 w-5 text-purple-500" />;
      case 'technology': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'healthcare': return <Shield className="h-5 w-5 text-red-500" />;
      case 'education': return <Target className="h-5 w-5 text-indigo-500" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWalletBalanceUpdate = async () => {
    if (selectedWallet && selectedCurrency) {
      try {
        const balance = await Web3InvestmentService.getWalletBalance(
          selectedWallet.wallet_address,
          selectedCurrency,
          selectedWallet.blockchain_network
        );
        setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to get wallet balance:', error);
        setWalletBalance(0);
      }
    }
  };

  useEffect(() => {
    handleWalletBalanceUpdate();
  }, [selectedWallet, selectedCurrency]);

  const handleInvestment = async () => {
    if (!selectedInitiative || !selectedWallet || !investmentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select an asset initiative, wallet, and enter investment amount.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    const validation = Web3InvestmentService.validateInvestmentAmount(
      amount,
      selectedCurrency,
      selectedInitiative,
      walletBalance
    );

    if (!validation.isValid) {
      toast({
        title: "Invalid Investment",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsInvesting(true);
    try {
      const transactionHash = await Web3InvestmentService.executeInvestment(
        userId,
        selectedInitiative.id,
        amount,
        selectedCurrency,
        isCustodial ? 'custodial' : 'direct_web3',
        selectedWallet.wallet_address,
        selectedInitiative.multi_sig_wallet_address,
        selectedWallet.blockchain_network
      );

      toast({
        title: "Investment Successful",
        description: `Successfully invested ${amount} ${selectedCurrency} in ${selectedInitiative.name}. Transaction: ${transactionHash.substring(0, 10)}...`,
        variant: "default"
      });

      setShowInvestmentModal(false);
      setInvestmentAmount('');
      loadData(); // Refresh portfolio
    } catch (error) {
      console.error('Investment failed:', error);
      toast({
        title: "Investment Failed",
        description: error instanceof Error ? error.message : "Failed to process investment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInvesting(false);
    }
  };

  const handleConnectWallet = async () => {
    // This would integrate with actual wallet connection
    toast({
      title: "Wallet Connection",
      description: "Wallet connection feature will be implemented with actual Web3 integration.",
      variant: "default"
    });
  };

  const totalPortfolioValue = userPortfolio.reduce((sum, investment) => sum + investment.current_value, 0);
  const totalReturns = userPortfolio.reduce((sum, investment) => sum + investment.total_returns, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading investment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card className="card-gradient border-primary/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Investment Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">${totalPortfolioValue.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${totalReturns >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${totalReturns.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Returns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{userPortfolio.length}</div>
              <div className="text-sm text-muted-foreground">Active Investments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      {userWallets.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Connect your Web3 wallet to start investing in asset initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnectWallet} className="bg-yellow-600 hover:bg-yellow-700">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Asset Initiatives */}
      <Card className="card-gradient border-primary/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Available Asset Initiatives
          </CardTitle>
          <CardDescription>
            Invest in impactful projects and earn returns while making a difference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetInitiatives.map((initiative) => (
              <Card key={initiative.id} className="relative overflow-hidden border-primary/20 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {getCategoryIcon(initiative.category)}
                      {initiative.name}
                    </CardTitle>
                    <Badge className={getRiskColor(initiative.risk_level)}>
                      {initiative.risk_level}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {initiative.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Impact: {initiative.impact_score}/10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Return: {initiative.expected_return}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span>Min: ${initiative.min_investment}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span>Multi-sig: {initiative.multi_sig_threshold}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(initiative.current_funding / initiative.target_funding) * 100} 
                    className="mt-2" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Funding Progress</span>
                    <span>{((initiative.current_funding / initiative.target_funding) * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedInitiative(initiative);
                        setShowInvestmentModal(true);
                      }}
                      className="flex-1"
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Invest
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Modal */}
      <Dialog open={showInvestmentModal} onOpenChange={setShowInvestmentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invest in {selectedInitiative?.name}</DialogTitle>
            <DialogDescription>
              Choose your investment amount and currency to invest in this asset initiative.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Currency Selection */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={(value: any) => setSelectedCurrency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {selectedInitiative?.supported_currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      <div className="flex items-center gap-2">
                        {getCurrencyIcon(currency)}
                        {currency}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wallet Selection */}
            {userWallets.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet</Label>
                <Select 
                  value={selectedWallet?.id || ''} 
                  onValueChange={(value) => {
                    const wallet = userWallets.find(w => w.id === value);
                    setSelectedWallet(wallet || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {userWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          {wallet.wallet_address.substring(0, 10)}...
                          <Badge variant="outline" className="text-xs">
                            {wallet.wallet_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1"
                />
                <span className="flex items-center px-3 py-2 bg-muted rounded-md text-sm">
                  {selectedCurrency}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Available: {walletBalance.toFixed(4)} {selectedCurrency}
              </div>
            </div>

            {/* Investment Summary */}
            {selectedInitiative && investmentAmount && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Investment Amount:</span>
                  <span>{investmentAmount} {selectedCurrency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Return:</span>
                  <span>{selectedInitiative.expected_return}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Multi-sig Wallet:</span>
                  <span className="font-mono text-xs">
                    {selectedInitiative.multi_sig_wallet_address.substring(0, 10)}...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowInvestmentModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvestment}
              disabled={isInvesting || !investmentAmount || !selectedWallet}
            >
              {isInvesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Invest Now
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
