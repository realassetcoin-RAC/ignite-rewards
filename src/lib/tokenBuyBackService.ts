// Token Buy-Back and Burn Service
// Implements the requirement: NFT upgrades + merchant subscriptions → buy RAC → burn to dead wallet

import { databaseAdapter } from './databaseAdapter';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('TokenBuyBackService');

// Dead wallet address for burning RAC tokens
const DEAD_WALLET_ADDRESS = '11111111111111111111111111111112'; // Solana system program (dead wallet)

export interface BuyBackTransaction {
  id: string;
  user_id: string;
  transaction_type: 'nft_upgrade' | 'merchant_subscription';
  amount_usd: number;
  rac_tokens_bought: number;
  rac_tokens_burned: number;
  transaction_hash: string;
  dead_wallet_address: string;
  created_at: string;
}

export interface BuyBackStats {
  total_usd_spent: number;
  total_rac_bought: number;
  total_rac_burned: number;
  total_transactions: number;
  last_burn_date: string | null;
}

class TokenBuyBackService {
  // Get current RAC token price (mock implementation)
  private async getRACPrice(): Promise<number> {
    // In production, this would fetch from a price oracle or DEX
    // For now, using a mock price of $0.10 per RAC token
    return 0.10;
  }

  // Calculate how many RAC tokens can be bought with USD amount
  private async calculateRACTokens(usdAmount: number): Promise<number> {
    const racPrice = await this.getRACPrice();
    return Math.floor(usdAmount / racPrice);
  }

  // Execute buy-back and burn transaction
  public async executeBuyBackAndBurn(
    userId: string,
    transactionType: 'nft_upgrade' | 'merchant_subscription',
    usdAmount: number,
    originalTransactionHash?: string
  ): Promise<BuyBackTransaction> {
    try {
      logger.info('Starting buy-back and burn process', {
        userId,
        transactionType,
        usdAmount,
        originalTransactionHash
      });

      // Calculate RAC tokens to buy
      const racTokensToBuy = await this.calculateRACTokens(usdAmount);
      
      if (racTokensToBuy <= 0) {
        throw new Error('Amount too small to buy RAC tokens');
      }

      // In production, this would:
      // 1. Buy RAC tokens from a DEX (e.g., Raydium, Orca)
      // 2. Transfer tokens to dead wallet
      // 3. Get transaction hash from blockchain
      
      // For now, simulating the transaction
      const mockTransactionHash = `burn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Record the buy-back transaction
      const buyBackTransaction: Omit<BuyBackTransaction, 'id'> = {
        user_id: userId,
        transaction_type: transactionType,
        amount_usd: usdAmount,
        rac_tokens_bought: racTokensToBuy,
        rac_tokens_burned: racTokensToBuy, // All bought tokens are burned
        transaction_hash: mockTransactionHash,
        dead_wallet_address: DEAD_WALLET_ADDRESS,
        created_at: new Date().toISOString()
      };

      // Save to database
      const { data, error } = await databaseAdapter
        .from('token_buy_back_transactions')
        .insert(buyBackTransaction)
        .select()
        .single();

      if (error) {
        logger.error('Failed to save buy-back transaction:', error);
        throw new Error('Failed to record buy-back transaction');
      }

      logger.info('Buy-back and burn completed successfully', {
        transactionId: data.id,
        racTokensBurned: racTokensToBuy,
        transactionHash: mockTransactionHash
      });

      return data as BuyBackTransaction;

    } catch (error) {
      logger.error('Buy-back and burn failed:', error);
      throw error;
    }
  }

  // Get buy-back statistics
  public async getBuyBackStats(): Promise<BuyBackStats> {
    try {
      const { data, error } = await databaseAdapter
        .from('token_buy_back_transactions')
        .select('*');

      if (error) {
        logger.error('Failed to fetch buy-back stats:', error);
        throw new Error('Failed to fetch buy-back statistics');
      }

      const transactions = data || [];
      
      const stats: BuyBackStats = {
        total_usd_spent: transactions.reduce((sum, tx) => sum + tx.amount_usd, 0),
        total_rac_bought: transactions.reduce((sum, tx) => sum + tx.rac_tokens_bought, 0),
        total_rac_burned: transactions.reduce((sum, tx) => sum + tx.rac_tokens_burned, 0),
        total_transactions: transactions.length,
        last_burn_date: transactions.length > 0 
          ? transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null
      };

      return stats;

    } catch (error) {
      logger.error('Failed to get buy-back stats:', error);
      throw error;
    }
  }

  // Get user's buy-back history
  public async getUserBuyBackHistory(userId: string): Promise<BuyBackTransaction[]> {
    try {
      const { data, error } = await databaseAdapter
        .from('token_buy_back_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch user buy-back history:', error);
        throw new Error('Failed to fetch buy-back history');
      }

      return data || [];

    } catch (error) {
      logger.error('Failed to get user buy-back history:', error);
      throw error;
    }
  }

  // Trigger buy-back for NFT upgrade
  public async handleNFTUpgradePayment(
    userId: string,
    upgradePrice: number,
    nftType: string
  ): Promise<BuyBackTransaction> {
    logger.info('Handling NFT upgrade payment for buy-back', {
      userId,
      upgradePrice,
      nftType
    });

    return this.executeBuyBackAndBurn(
      userId,
      'nft_upgrade',
      upgradePrice
    );
  }

  // Trigger buy-back for merchant subscription
  public async handleMerchantSubscriptionPayment(
    userId: string,
    subscriptionPrice: number,
    planName: string
  ): Promise<BuyBackTransaction> {
    logger.info('Handling merchant subscription payment for buy-back', {
      userId,
      subscriptionPrice,
      planName
    });

    return this.executeBuyBackAndBurn(
      userId,
      'merchant_subscription',
      subscriptionPrice
    );
  }
}

export const tokenBuyBackService = new TokenBuyBackService();
export default tokenBuyBackService;
