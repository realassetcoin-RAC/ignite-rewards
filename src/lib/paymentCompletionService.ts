// Payment Completion Service
// Handles post-payment processing including buy-back and burn for merchant subscriptions

import { tokenBuyBackService } from './tokenBuyBackService';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('PaymentCompletionService');

export interface PaymentCompletionData {
  userId: string;
  planName: string;
  subscriptionPrice: number;
  billingPeriod: string;
  paymentTransactionHash?: string;
  paymentMethod?: string;
}

export interface PaymentCompletionResult {
  success: boolean;
  buyBackTransaction?: any;
  error?: string;
}

class PaymentCompletionService {
  /**
   * Handle successful merchant subscription payment
   * This should be called after the payment gateway confirms successful payment
   */
  public async handleMerchantSubscriptionPaymentCompletion(
    paymentData: PaymentCompletionData
  ): Promise<PaymentCompletionResult> {
    try {
      logger.info('Processing merchant subscription payment completion', {
        userId: paymentData.userId,
        planName: paymentData.planName,
        subscriptionPrice: paymentData.subscriptionPrice
      });

      // Trigger buy-back and burn for the subscription payment
      const buyBackTransaction = await tokenBuyBackService.handleMerchantSubscriptionPayment(
        paymentData.userId,
        paymentData.subscriptionPrice,
        paymentData.planName
      );

      logger.info('Buy-back and burn completed successfully', {
        buyBackTransactionId: buyBackTransaction.id,
        racTokensBurned: buyBackTransaction.rac_tokens_burned
      });

      return {
        success: true,
        buyBackTransaction
      };

    } catch (error) {
      logger.error('Payment completion processing failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment completion processing failed'
      };
    }
  }

  /**
   * Handle successful NFT upgrade payment
   * This should be called after payment confirmation for NFT upgrades
   */
  public async handleNFTUpgradePaymentCompletion(
    userId: string,
    upgradePrice: number,
    nftType: string,
    paymentTransactionHash?: string
  ): Promise<PaymentCompletionResult> {
    try {
      logger.info('Processing NFT upgrade payment completion', {
        userId,
        upgradePrice,
        nftType,
        paymentTransactionHash
      });

      // Trigger buy-back and burn for the NFT upgrade payment
      const buyBackTransaction = await tokenBuyBackService.handleNFTUpgradePayment(
        userId,
        upgradePrice,
        nftType
      );

      logger.info('NFT upgrade buy-back and burn completed successfully', {
        buyBackTransactionId: buyBackTransaction.id,
        racTokensBurned: buyBackTransaction.rac_tokens_burned
      });

      return {
        success: true,
        buyBackTransaction
      };

    } catch (error) {
      logger.error('NFT upgrade payment completion processing failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NFT upgrade payment completion processing failed'
      };
    }
  }

  /**
   * Get payment data from sessionStorage (set during signup)
   */
  public getStoredPaymentData(): PaymentCompletionData | null {
    try {
      const storedData = sessionStorage.getItem('merchantPaymentData');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return {
          userId: parsed.userId,
          planName: parsed.planName,
          subscriptionPrice: parsed.subscriptionPrice,
          billingPeriod: parsed.billingPeriod,
          paymentTransactionHash: parsed.paymentTransactionHash,
          paymentMethod: parsed.paymentMethod
        };
      }
      return null;
    } catch (error) {
      logger.error('Failed to parse stored payment data:', error);
      return null;
    }
  }

  /**
   * Clear stored payment data after successful processing
   */
  public clearStoredPaymentData(): void {
    sessionStorage.removeItem('merchantPaymentData');
  }
}

export const paymentCompletionService = new PaymentCompletionService();
export default paymentCompletionService;
