// Web3 Investment Service
// Handles all Web3 investment operations for asset initiatives

import { supabase } from '@/integrations/supabase/client';

export interface AssetInitiative {
  id: string;
  name: string;
  description: string;
  category: string;
  impact_score: number;
  risk_level: 'low' | 'medium' | 'high';
  expected_return: number;
  min_investment: number;
  max_investment: number;
  current_funding: number;
  target_funding: number;
  multi_sig_wallet_address: string;
  multi_sig_threshold: number;
  multi_sig_signers: string[];
  blockchain_network: string;
  supported_currencies: string[];
  hot_wallet_address: string;
  cold_wallet_address: string;
  is_web3_enabled: boolean;
}

export interface UserWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: 'metamask' | 'phantom' | 'trust_wallet' | 'hardware' | 'custodial';
  blockchain_network: 'ethereum' | 'solana' | 'bitcoin' | 'polygon';
  verification_status: 'pending' | 'verified' | 'failed';
  is_primary: boolean;
  is_active: boolean;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  asset_initiative_id: string;
  investment_amount: number;
  currency_type: 'USDT' | 'SOL' | 'ETH' | 'BTC' | 'RAC';
  investment_type: 'direct_web3' | 'rac_conversion' | 'custodial';
  transaction_hash?: string;
  blockchain_network: string;
  from_wallet_address: string;
  to_wallet_address: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  current_value: number;
  total_returns: number;
  return_percentage: number;
  invested_at: string;
  confirmed_at?: string;
}

export interface RACConversion {
  id: string;
  user_id: string;
  rac_amount: number;
  target_currency: 'USDT' | 'ETH' | 'SOL' | 'BTC';
  converted_amount: number;
  exchange_rate: number;
  dex_provider: 'uniswap' | 'pancakeswap' | 'raydium' | 'jupiter';
  transaction_hash?: string;
  status: 'pending' | 'completed' | 'failed';
  converted_at: string;
  completed_at?: string;
}

export class Web3InvestmentService {
  // Get all available asset initiatives
  static async getAssetInitiatives(): Promise<AssetInitiative[]> {
    const { data, error } = await supabase
      .from('asset_initiatives')
      .select('*')
      .eq('is_active', true)
      .eq('is_web3_enabled', true)
      .order('impact_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch asset initiatives: ${error.message}`);
    }

    return data || [];
  }

  // Get user's connected wallets
  static async getUserWallets(userId: string): Promise<UserWallet[]> {
    const { data, error } = await supabase
      .from('user_wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user wallets: ${error.message}`);
    }

    return data || [];
  }

  // Connect and verify a new wallet
  static async connectWallet(
    userId: string,
    walletAddress: string,
    walletType: UserWallet['wallet_type'],
    blockchainNetwork: UserWallet['blockchain_network'],
    verificationData: any
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('verify_wallet_ownership', {
        p_user_id: userId,
        p_wallet_address: walletAddress,
        p_wallet_type: walletType,
        p_blockchain_network: blockchainNetwork,
        p_verification_data: verificationData
      });

      if (error) {
        throw new Error(`Failed to verify wallet: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return false;
    }
  }

  // Get wallet balance for a specific currency
  static async getWalletBalance(
    walletAddress: string,
    currency: string,
    blockchainNetwork: string
  ): Promise<number> {
    try {
      // This would integrate with actual blockchain APIs
      // For now, return mock data
      const mockBalances: Record<string, number> = {
        'USDT': 1000.00,
        'ETH': 2.5,
        'SOL': 50.0,
        'BTC': 0.1,
        'RAC': 5000.0
      };

      return mockBalances[currency] || 0;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  // Execute investment transaction
  static async executeInvestment(
    userId: string,
    assetInitiativeId: string,
    investmentAmount: number,
    currencyType: InvestmentTransaction['currency_type'],
    investmentType: InvestmentTransaction['investment_type'],
    fromWalletAddress: string,
    toWalletAddress: string,
    blockchainNetwork: string
  ): Promise<string> {
    try {
      // This would integrate with actual blockchain transactions
      // For now, simulate transaction
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Create investment record
      const { data, error } = await supabase.rpc('create_asset_investment', {
        p_user_id: userId,
        p_asset_initiative_id: assetInitiativeId,
        p_investment_amount: investmentAmount,
        p_currency_type: currencyType,
        p_investment_type: investmentType,
        p_transaction_hash: mockTransactionHash,
        p_blockchain_network: blockchainNetwork,
        p_from_wallet_address: fromWalletAddress,
        p_to_wallet_address: toWalletAddress
      });

      if (error) {
        throw new Error(`Failed to create investment: ${error.message}`);
      }

      return mockTransactionHash;
    } catch (error) {
      console.error('Investment execution failed:', error);
      throw error;
    }
  }

  // Confirm investment transaction
  static async confirmInvestment(
    investmentId: string,
    transactionHash: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('confirm_asset_investment', {
        p_investment_id: investmentId,
        p_transaction_hash: transactionHash
      });

      if (error) {
        throw new Error(`Failed to confirm investment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Investment confirmation failed:', error);
      return false;
    }
  }

  // Get user's investment portfolio
  static async getUserPortfolio(userId: string): Promise<InvestmentTransaction[]> {
    const { data, error } = await supabase
      .from('asset_investments')
      .select(`
        *,
        asset_initiatives (
          name,
          description,
          category,
          impact_score,
          expected_return
        )
      `)
      .eq('user_id', userId)
      .order('invested_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user portfolio: ${error.message}`);
    }

    return data || [];
  }

  // Convert RAC to other currencies
  static async convertRAC(
    userId: string,
    racAmount: number,
    targetCurrency: RACConversion['target_currency'],
    dexProvider: RACConversion['dex_provider']
  ): Promise<RACConversion> {
    try {
      // Get current exchange rate (mock for now)
      const exchangeRates: Record<string, number> = {
        'USDT': 0.5,
        'ETH': 0.0002,
        'SOL': 0.01,
        'BTC': 0.00001
      };

      const exchangeRate = exchangeRates[targetCurrency] || 1;
      const convertedAmount = racAmount * exchangeRate;

      // Create conversion record
      const { data, error } = await supabase
        .from('rac_conversions')
        .insert({
          user_id: userId,
          rac_amount: racAmount,
          target_currency: targetCurrency,
          converted_amount: convertedAmount,
          exchange_rate: exchangeRate,
          dex_provider: dexProvider,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create RAC conversion: ${error.message}`);
      }

      // Simulate DEX transaction
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Update conversion with transaction hash
      const { data: updatedData, error: updateError } = await supabase
        .from('rac_conversions')
        .update({
          transaction_hash: mockTransactionHash,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update RAC conversion: ${updateError.message}`);
      }

      return updatedData;
    } catch (error) {
      console.error('RAC conversion failed:', error);
      throw error;
    }
  }

  // Get investment returns
  static async getInvestmentReturns(investmentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('investment_returns')
      .select('*')
      .eq('investment_id', investmentId)
      .order('return_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch investment returns: ${error.message}`);
    }

    return data || [];
  }

  // Get exchange rates
  static async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // This would integrate with actual exchange rate APIs
      // For now, return mock data
      return {
        'RAC_USDT': 0.5,
        'RAC_ETH': 0.0002,
        'RAC_SOL': 0.01,
        'RAC_BTC': 0.00001,
        'USDT_ETH': 0.0004,
        'USDT_SOL': 0.02,
        'USDT_BTC': 0.00002
      };
    } catch (error) {
      console.error('Failed to get exchange rates:', error);
      return {};
    }
  }

  // Validate investment amount
  static validateInvestmentAmount(
    amount: number,
    currency: string,
    assetInitiative: AssetInitiative,
    userBalance: number
  ): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Investment amount must be greater than 0' };
    }

    if (amount < assetInitiative.min_investment) {
      return { 
        isValid: false, 
        error: `Minimum investment amount is ${assetInitiative.min_investment} ${currency}` 
      };
    }

    if (amount > assetInitiative.max_investment) {
      return { 
        isValid: false, 
        error: `Maximum investment amount is ${assetInitiative.max_investment} ${currency}` 
      };
    }

    if (amount > userBalance) {
      return { 
        isValid: false, 
        error: `Insufficient balance. Available: ${userBalance} ${currency}` 
      };
    }

    if (!assetInitiative.supported_currencies.includes(currency)) {
      return { 
        isValid: false, 
        error: `Currency ${currency} is not supported for this asset initiative` 
      };
    }

    return { isValid: true };
  }
}
