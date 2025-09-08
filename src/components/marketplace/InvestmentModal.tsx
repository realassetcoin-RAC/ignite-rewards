import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Calculator,
  Info,
  Zap,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { MarketplaceListing, MarketplaceInvestment, NFTCardTier } from '@/types/marketplace';
import { 
  formatCurrency, 
  validateInvestmentAmount, 
  calculateEffectiveInvestment,
  calculateTokensReceived,
  canUserInvest
} from '@/lib/marketplaceUtils';
import { 
  checkUserNFTCardStatus, 
  UserNFTCardStatus,
  calculateEffectiveInvestment,
  calculateTokensWithMultiplier,
  formatNFTMultiplier,
  getNFTTierColor,
  getNFTTierBenefits
} from '@/lib/nftCardIntegration';

interface InvestmentModalProps {
  listing: MarketplaceListing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (investment: MarketplaceInvestment) => void;
  userBalance?: number;
  hasExistingInvestment?: boolean;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
  userBalance = 0,
  hasExistingInvestment = false
}) => {
  const [investmentAmount, setInvestmentAmount] = useState<number>(listing.minimum_investment);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [nftStatus, setNftStatus] = useState<UserNFTCardStatus | null>(null);
  const { toast } = useToast();

  // Calculate NFT multiplier from loyalty platform data
  const nftMultiplier = nftStatus?.multiplier || 1.0;
  const effectiveAmount = calculateEffectiveInvestment(investmentAmount, nftMultiplier);
  const tokensReceived = calculateTokensWithMultiplier(investmentAmount, listing.token_price || 1, nftMultiplier);
  const remainingFunding = listing.total_funding_goal - listing.current_funding_amount;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInvestmentAmount(listing.minimum_investment);
      setValidationError('');
      loadNFTStatus();
    }
  }, [isOpen, listing.minimum_investment]);

  // Load user's NFT card status
  const loadNFTStatus = async () => {
    try {
      // TODO: Get actual user ID from auth context
      const userId = 'current_user_id';
      const result = await checkUserNFTCardStatus(userId);
      
      if (result.success && result.status) {
        setNftStatus(result.status);
      }
    } catch (error) {
      console.error('Failed to load NFT status:', error);
    }
  };

  // Validate investment amount on change
  useEffect(() => {
    const validation = validateInvestmentAmount(investmentAmount, listing, userBalance);
    setValidationError(validation.error || '');
  }, [investmentAmount, listing, userBalance]);

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setInvestmentAmount(amount);
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.min(
      userBalance * percentage,
      remainingFunding,
      listing.maximum_investment || Infinity
    );
    setInvestmentAmount(Math.max(amount, listing.minimum_investment));
  };

  const handleInvest = async () => {
    const canInvestCheck = canUserInvest(listing, userBalance, hasExistingInvestment);
    if (!canInvestCheck.canInvest) {
      toast({
        title: "Cannot Invest",
        description: canInvestCheck.reason,
        variant: "destructive",
      });
      return;
    }

    if (validationError) {
      toast({
        title: "Invalid Investment",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement actual investment API call
      const investment: MarketplaceInvestment = {
        id: `inv_${Date.now()}`,
        user_id: 'current_user', // This would come from auth context
        listing_id: listing.id,
        investment_amount: investmentAmount,
        token_amount: tokensReceived,
        effective_investment_amount: effectiveAmount,
        nft_multiplier: nftMultiplier,
        status: 'pending',
        invested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Investment Successful!",
        description: `You've invested ${formatCurrency(investmentAmount)} in ${listing.title}`,
      });

      onSuccess?.(investment);
      onClose();
    } catch (error) {
      toast({
        title: "Investment Failed",
        description: "There was an error processing your investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isInvestmentValid = !validationError && investmentAmount > 0;
  const canInvest = canUserInvest(listing, userBalance, hasExistingInvestment).canInvest;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Invest in {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Listing Summary */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Expected Return</p>
                  <p className="font-semibold text-green-400">
                    {listing.expected_return_rate ? `${listing.expected_return_rate}%` : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Risk Level</p>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {listing.risk_level.charAt(0).toUpperCase() + listing.risk_level.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400">Min. Investment</p>
                  <p className="font-semibold">{formatCurrency(listing.minimum_investment)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Remaining Funding</p>
                  <p className="font-semibold">{formatCurrency(remainingFunding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Multiplier Info */}
          {nftStatus && nftMultiplier > 1 && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="font-semibold text-yellow-400">
                      {nftStatus.highestTier ? getTierDisplayName(nftStatus.highestTier) : 'NFT Card'} Benefits
                    </p>
                    <p className="text-sm text-gray-300">
                      You get a {formatNFTMultiplier(nftMultiplier)} investment multiplier with your loyalty NFT card!
                    </p>
                    {nftStatus.ownedNfts.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-400">Owned NFTs:</p>
                        <div className="flex flex-wrap gap-1">
                          {nftStatus.ownedNfts.map((nft, index) => (
                            <Badge 
                              key={index}
                              className={`text-xs ${getNFTTierColor(nft.tier)}`}
                            >
                              {nft.displayName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NFT Status Info */}
          {nftStatus && !nftStatus.hasNftCard && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-400">Get a Loyalty NFT Card</p>
                    <p className="text-sm text-gray-300">
                      Earn loyalty NFT cards in the loyalty platform to get investment multipliers and exclusive marketplace access!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment Amount Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-white font-semibold">
                Investment Amount
              </Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                  placeholder="Enter investment amount"
                  min={listing.minimum_investment}
                  max={Math.min(remainingFunding, listing.maximum_investment || Infinity)}
                />
              </div>
              {validationError && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {validationError}
                </p>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Quick amounts:</p>
              <div className="flex space-x-2">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(percentage)}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    {percentage * 100}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Investment Summary */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Investment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Investment:</span>
                  <span className="font-semibold">{formatCurrency(investmentAmount)}</span>
                </div>
                {nftMultiplier > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      NFT Multiplier ({nftMultiplier}x):
                    </span>
                    <span className="font-semibold text-purple-400">
                      +{formatCurrency(effectiveAmount - investmentAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Effective Investment:</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(effectiveAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens You'll Receive:</span>
                  <span className="font-semibold">{tokensReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Balance After:</span>
                  <span className="font-semibold">
                    {formatCurrency(userBalance - investmentAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-400 mb-1">Important Information</p>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Investments are locked until the campaign completes</li>
                    <li>• You'll receive passive income based on your token share</li>
                    <li>• All investments are subject to the terms and conditions</li>
                    {nftMultiplier > 1 && (
                      <li>• Your NFT multiplier gives you {nftMultiplier}x more tokens for the same investment</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvest}
              disabled={!isInvestmentValid || !canInvest || isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Invest {formatCurrency(investmentAmount)}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentModal;
