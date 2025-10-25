import { LoyaltyNFTService } from './loyaltyNFTService';

export interface FractionalInvestment {
  id: string;
  user_id: string;
  nft_id: string;
  investment_amount: number;
  fractional_shares: number;
  asset_type: 'real_estate' | 'art' | 'collectibles' | 'commodities' | 'crypto' | 'stocks';
  asset_name: string;
  asset_description: string;
  total_shares: number;
  share_price: number;
  investment_date: string;
  status: 'active' | 'completed' | 'cancelled';
  expected_return_rate: number;
  maturity_date?: string;
}

export interface FractionalAsset {
  id: string;
  asset_name: string;
  asset_description: string;
  asset_type: string;
  total_value: number;
  total_shares: number;
  available_shares: number;
  share_price: number;
  expected_return_rate: number;
  maturity_date?: string;
  is_active: boolean;
  created_at: string;
}

export class FractionalInvestmentService {
  /**
   * Check if user is eligible for fractional investments
   */
  static async checkEligibility(userId: string): Promise<{
    isEligible: boolean;
    nftType: string;
    maxInvestmentAmount: number;
    message: string;
  }> {
    try {
      // Get user's loyalty NFT
      const loyaltyCard = await LoyaltyNFTService.getUserLoyaltyCard(userId);
      
      if (!loyaltyCard) {
        return {
          isEligible: false,
          nftType: 'none',
          maxInvestmentAmount: 0,
          message: 'No loyalty NFT found for user'
        };
      }

      const nftType = loyaltyCard.nft_types;
      if (!nftType) {
        return {
          isEligible: false,
          nftType: 'none',
          maxInvestmentAmount: 0,
          message: 'No NFT type information found'
        };
      }

      // Check if NFT is fractional eligible
      if (!nftType.is_fractional_eligible) {
        return {
          isEligible: false,
          nftType: nftType.nft_name,
          maxInvestmentAmount: 0,
          message: 'Your NFT type is not eligible for fractional investments'
        };
      }

      // Calculate max investment amount based on NFT tier
      let maxInvestmentMultiplier = 1.0;
      switch (nftType.rarity?.toLowerCase()) {
        case 'common':
          maxInvestmentMultiplier = 1.0;
          break;
        case 'less common':
          maxInvestmentMultiplier = 1.5;
          break;
        case 'rare':
          maxInvestmentMultiplier = 2.0;
          break;
        case 'very rare':
          maxInvestmentMultiplier = 3.0;
          break;
        default:
          maxInvestmentMultiplier = 1.0;
      }

      const maxInvestmentAmount = loyaltyCard.points_balance * maxInvestmentMultiplier;

      return {
        isEligible: true,
        nftType: nftType.nft_name,
        maxInvestmentAmount,
        message: `Eligible for fractional investments up to ${maxInvestmentAmount.toFixed(2)} points`
      };
    } catch (error) {
      console.error('Error checking fractional investment eligibility:', error);
      return {
        isEligible: false,
        nftType: 'none',
        maxInvestmentAmount: 0,
        message: 'Error checking eligibility'
      };
    }
  }

  /**
   * Get available fractional assets
   */
  static async getAvailableAssets(): Promise<FractionalAsset[]> {
    try {
      const { data, error } = await supabase
        .from('fractional_assets')
        .select('*')
        .eq('is_active', true)
        .gt('available_shares', 0)
        .order('expected_return_rate', { ascending: false });

      if (error) {
        console.error('Error fetching fractional assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching fractional assets:', error);
      return [];
    }
  }

  /**
   * Invest in a fractional asset
   */
  static async investInFractionalAsset(
    userId: string,
    assetId: string,
    investmentAmount: number
  ): Promise<{ success: boolean; shares: number; message: string }> {
    try {
      // Check eligibility first
      const eligibility = await this.checkEligibility(userId);
      
      if (!eligibility.isEligible) {
        return {
          success: false,
          shares: 0,
          message: eligibility.message
        };
      }

      if (investmentAmount > eligibility.maxInvestmentAmount) {
        return {
          success: false,
          shares: 0,
          message: `Investment amount exceeds maximum allowed (${eligibility.maxInvestmentAmount.toFixed(2)} points)`
        };
      }

      // Get the fractional asset
      const { data: asset, error: assetError } = await supabase
        .from('fractional_assets')
        .select('*')
        .eq('id', assetId)
        .eq('is_active', true)
        .single();

      if (assetError || !asset) {
        return {
          success: false,
          shares: 0,
          message: 'Asset not found or not available'
        };
      }

      // Calculate shares to be purchased
      const shares = Math.floor(investmentAmount / asset.share_price);
      
      if (shares <= 0) {
        return {
          success: false,
          shares: 0,
          message: 'Investment amount is too low to purchase any shares'
        };
      }

      if (shares > asset.available_shares) {
        return {
          success: false,
          shares: 0,
          message: `Not enough shares available. Maximum: ${asset.available_shares} shares`
        };
      }

      // Get user's loyalty NFT
      const loyaltyCard = await LoyaltyNFTService.getUserLoyaltyCard(userId);
      
      if (!loyaltyCard) {
        return {
          success: false,
          shares: 0,
          message: 'No loyalty NFT found for user'
        };
      }

      // Check if user has enough points
      if (loyaltyCard.points_balance < investmentAmount) {
        return {
          success: false,
          shares: 0,
          message: 'Insufficient points balance'
        };
      }

      // Create fractional investment record
      const { error: investmentError } = await supabase
        .from('fractional_investments')
        .insert([{
          user_id: userId,
          nft_id: loyaltyCard.id,
          investment_amount: investmentAmount,
          fractional_shares: shares,
          asset_type: asset.asset_type,
          asset_name: asset.asset_name,
          asset_description: asset.asset_description,
          total_shares: asset.total_shares,
          share_price: asset.share_price,
          investment_date: new Date().toISOString(),
          status: 'active',
          expected_return_rate: asset.expected_return_rate,
          maturity_date: asset.maturity_date
        }]);

      if (investmentError) {
        console.error('Error creating fractional investment:', investmentError);
        return {
          success: false,
          shares: 0,
          message: 'Failed to create investment record'
        };
      }

      // Update asset available shares
      await supabase
        .from('fractional_assets')
        .update({
          available_shares: asset.available_shares - shares,
          updated_at: new Date().toISOString()
        })
        .eq('id', assetId);

      // Deduct points from user's balance
      await supabase
        .from('user_loyalty_cards')
        .update({
          points_balance: loyaltyCard.points_balance - investmentAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', loyaltyCard.id);

      return {
        success: true,
        shares,
        message: `Successfully invested ${investmentAmount} points for ${shares} shares in ${asset.asset_name}`
      };
    } catch (error) {
      console.error('Error investing in fractional asset:', error);
      return {
        success: false,
        shares: 0,
        message: 'Failed to invest in fractional asset'
      };
    }
  }

  /**
   * Get user's fractional investments
   */
  static async getUserFractionalInvestments(userId: string): Promise<FractionalInvestment[]> {
    try {
      const { data, error } = await supabase
        .from('fractional_investments')
        .select('*')
        .eq('user_id', userId)
        .order('investment_date', { ascending: false });

      if (error) {
        console.error('Error fetching user fractional investments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user fractional investments:', error);
      return [];
    }
  }

  /**
   * Calculate potential returns for a fractional investment
   */
  static async calculatePotentialReturns(
    assetId: string,
    investmentAmount: number
  ): Promise<{
    shares: number;
    expectedAnnualReturn: number;
    expectedTotalReturn: number;
    maturityDate?: string;
  }> {
    try {
      const { data: asset, error } = await supabase
        .from('fractional_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error || !asset) {
        return {
          shares: 0,
          expectedAnnualReturn: 0,
          expectedTotalReturn: 0
        };
      }

      const shares = Math.floor(investmentAmount / asset.share_price);
      const expectedAnnualReturn = investmentAmount * (asset.expected_return_rate / 100);
      
      let expectedTotalReturn = expectedAnnualReturn;
      if (asset.maturity_date) {
        const maturityDate = new Date(asset.maturity_date);
        const currentDate = new Date();
        const yearsToMaturity = (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        expectedTotalReturn = expectedAnnualReturn * yearsToMaturity;
      }

      return {
        shares,
        expectedAnnualReturn,
        expectedTotalReturn,
        maturityDate: asset.maturity_date
      };
    } catch (error) {
      console.error('Error calculating potential returns:', error);
      return {
        shares: 0,
        expectedAnnualReturn: 0,
        expectedTotalReturn: 0
      };
    }
  }

  /**
   * Get fractional investment statistics for a user
   */
  static async getFractionalInvestmentStats(userId: string): Promise<{
    totalInvestments: number;
    totalAmount: number;
    totalShares: number;
    expectedAnnualReturns: number;
    activeInvestments: number;
    completedInvestments: number;
  }> {
    try {
      const investments = await this.getUserFractionalInvestments(userId);

      const totalInvestments = investments.length;
      const totalAmount = investments.reduce((sum, inv) => sum + inv.investment_amount, 0);
      const totalShares = investments.reduce((sum, inv) => sum + inv.fractional_shares, 0);
      const expectedAnnualReturns = investments.reduce((sum, inv) => 
        sum + (inv.investment_amount * inv.expected_return_rate / 100), 0);
      const activeInvestments = investments.filter(inv => inv.status === 'active').length;
      const completedInvestments = investments.filter(inv => inv.status === 'completed').length;

      return {
        totalInvestments,
        totalAmount,
        totalShares,
        expectedAnnualReturns,
        activeInvestments,
        completedInvestments
      };
    } catch (error) {
      console.error('Error fetching fractional investment stats:', error);
      return {
        totalInvestments: 0,
        totalAmount: 0,
        totalShares: 0,
        expectedAnnualReturns: 0,
        activeInvestments: 0,
        completedInvestments: 0
      };
    }
  }

  /**
   * Withdraw from a fractional investment (if allowed)
   */
  static async withdrawFromFractionalInvestment(
    userId: string,
    investmentId: string
  ): Promise<{ success: boolean; amount: number; message: string }> {
    try {
      // Get the investment record
      const { data: investment, error: fetchError } = await supabase
        .from('fractional_investments')
        .select('*')
        .eq('id', investmentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !investment) {
        return {
          success: false,
          amount: 0,
          message: 'Investment not found'
        };
      }

      if (investment.status !== 'active') {
        return {
          success: false,
          amount: 0,
          message: 'Investment is not active'
        };
      }

      // Check if withdrawal is allowed (e.g., before maturity date)
      if (investment.maturity_date) {
        const maturityDate = new Date(investment.maturity_date);
        const currentDate = new Date();
        
        if (currentDate < maturityDate) {
          return {
            success: false,
            amount: 0,
            message: 'Withdrawal not allowed before maturity date'
          };
        }
      }

      // Calculate withdrawal amount (with potential penalties)
      let withdrawalAmount = investment.investment_amount;
      
      // Apply early withdrawal penalty if applicable
      if (investment.maturity_date) {
        const maturityDate = new Date(investment.maturity_date);
        const currentDate = new Date();
        const daysToMaturity = (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysToMaturity > 0) {
          // 5% penalty for early withdrawal
          withdrawalAmount = withdrawalAmount * 0.95;
        }
      }

      // Update investment status
      await supabase
        .from('fractional_investments')
        .update({
          status: 'completed',
          withdrawal_date: new Date().toISOString(),
          withdrawal_amount: withdrawalAmount
        })
        .eq('id', investmentId);

      // Add points back to user's balance
      const loyaltyCard = await LoyaltyNFTService.getUserLoyaltyCard(userId);
      if (loyaltyCard) {
        await supabase
          .from('user_loyalty_cards')
          .update({
            points_balance: loyaltyCard.points_balance + withdrawalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', loyaltyCard.id);
      }

      return {
        success: true,
        amount: withdrawalAmount,
        message: `Successfully withdrew ${withdrawalAmount.toFixed(2)} points from fractional investment`
      };
    } catch (error) {
      console.error('Error withdrawing from fractional investment:', error);
      return {
        success: false,
        amount: 0,
        message: 'Failed to withdraw from fractional investment'
      };
    }
  }
}
