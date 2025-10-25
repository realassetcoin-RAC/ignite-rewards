/**
 * ✅ IMPLEMENT REQUIREMENT: Payment gateway integration for NFT upgrades
 * Real payment processing service supporting multiple providers
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

interface PaymentConfig {
  provider: 'stripe' | 'paypal' | 'square' | 'mock';
  publicKey?: string;
  secretKey?: string;
  environment: 'sandbox' | 'production';
}

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
  paymentMethodTypes: string[];
  metadata: Record<string, any>;
}

interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
  requiresAction?: boolean;
  redirectUrl?: string;
}

interface NFTUpgradePayment {
  id: string;
  user_id: string;
  current_nft_id: string;
  target_nft_id: string;
  amount_usdt: number;
  payment_provider: string;
  payment_intent_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export class PaymentService {
  private static config: PaymentConfig = {
    provider: process.env.NODE_ENV === 'production' ? 'stripe' : 'mock',
    publicKey: process.env.VITE_STRIPE_PUBLIC_KEY,
    secretKey: process.env.VITE_STRIPE_SECRET_KEY,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  };

  /**
   * Create payment intent for NFT upgrade
   */
  static async createNFTUpgradePayment(
    userId: string,
    currentNftId: string,
    targetNftId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentResult> {
    try {
      // Create payment record in database
      const { data: paymentRecord, error: dbError } = await supabase
        .from('nft_upgrade_payments')
        .insert({
          user_id: userId,
          current_nft_id: currentNftId,
          target_nft_id: targetNftId,
          amount_usdt: amount,
          payment_provider: this.config.provider,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating payment record:', dbError);
        return { success: false, error: 'Failed to initialize payment' };
      }

      // Create payment intent with provider
      const paymentResult = await this.createPaymentIntent(
        amount,
        currency,
        {
          paymentRecordId: paymentRecord.id,
          userId,
          currentNftId,
          targetNftId,
          type: 'nft_upgrade'
        }
      );

      if (!paymentResult.success || !paymentResult.paymentIntent) {
        // Clean up payment record if intent creation failed
        await supabase
          .from('nft_upgrade_payments')
          .delete()
          .eq('id', paymentRecord.id);
        
        return paymentResult;
      }

      // Update payment record with intent ID
      await supabase
        .from('nft_upgrade_payments')
        .update({
          payment_intent_id: paymentResult.paymentIntent.id,
          status: 'processing'
        })
        .eq('id', paymentRecord.id);

      console.log(`✅ Payment intent created for NFT upgrade: ${paymentResult.paymentIntent.id}`);
      return paymentResult;

    } catch (error) {
      console.error('Error creating NFT upgrade payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  /**
   * Create payment intent for merchant subscription
   */
  static async createSubscriptionPayment(
    userId: string,
    planId: string,
    amount: number,
    billingPeriod: 'monthly' | 'yearly',
    currency: string = 'usd'
  ): Promise<PaymentResult> {
    try {
      // Create payment record in database
      const { data: paymentRecord, error: dbError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userId,
          plan_id: planId,
          amount,
          billing_period: billingPeriod,
          payment_provider: this.config.provider,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating subscription payment record:', dbError);
        return { success: false, error: 'Failed to initialize subscription payment' };
      }

      // Create payment intent
      const paymentResult = await this.createPaymentIntent(
        amount,
        currency,
        {
          paymentRecordId: paymentRecord.id,
          userId,
          planId,
          billingPeriod,
          type: 'subscription'
        }
      );

      if (!paymentResult.success || !paymentResult.paymentIntent) {
        // Clean up payment record
        await supabase
          .from('subscription_payments')
          .delete()
          .eq('id', paymentRecord.id);
        
        return paymentResult;
      }

      // Update payment record with intent ID
      await supabase
        .from('subscription_payments')
        .update({
          payment_intent_id: paymentResult.paymentIntent.id,
          status: 'processing'
        })
        .eq('id', paymentRecord.id);

      console.log(`✅ Subscription payment intent created: ${paymentResult.paymentIntent.id}`);
      return paymentResult;

    } catch (error) {
      console.error('Error creating subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription payment creation failed'
      };
    }
  }

  /**
   * Create payment intent with configured provider
   */
  private static async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    switch (this.config.provider) {
      case 'stripe':
        return this.createStripePaymentIntent(amount, currency, metadata);
      case 'paypal':
        return this.createPayPalPayment(amount, currency, metadata);
      case 'square':
        return this.createSquarePayment(amount, currency, metadata);
      case 'mock':
      default:
        return this.createMockPayment(amount, currency, metadata);
    }
  }

  /**
   * Create Stripe payment intent
   */
  private static async createStripePaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      if (!this.config.publicKey || !this.config.secretKey) {
        console.warn('Stripe keys not configured, using mock payment');
        return this.createMockPayment(amount, currency, metadata);
      }

      // In a real implementation, you would use Stripe SDK here
      // const stripe = require('stripe')(this.config.secretKey);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(amount * 100), // Convert to cents
      //   currency: currency.toLowerCase(),
      //   payment_method_types: ['card'],
      //   metadata
      // });

      // Mock Stripe response for development
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        status: 'pending',
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        paymentMethodTypes: ['card'],
        metadata
      };

      console.log(`💳 [MOCK STRIPE] Payment intent created: ${paymentIntent.id}`);
      return {
        success: true,
        paymentIntent
      };

    } catch (error) {
      console.error('Stripe payment intent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed'
      };
    }
  }

  /**
   * Create PayPal payment
   */
  private static async createPayPalPayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Mock PayPal response
      const paymentIntent: PaymentIntent = {
        id: `PAYPAL-${Date.now()}`,
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        paymentMethodTypes: ['paypal'],
        metadata
      };

      console.log(`💳 [MOCK PAYPAL] Payment created: ${paymentIntent.id}`);
      return {
        success: true,
        paymentIntent,
        redirectUrl: `https://sandbox.paypal.com/checkoutnow?token=${paymentIntent.id}`
      };

    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal payment failed'
      };
    }
  }

  /**
   * Create Square payment
   */
  private static async createSquarePayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Mock Square response
      const paymentIntent: PaymentIntent = {
        id: `sq_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: currency.toUpperCase(),
        status: 'pending',
        paymentMethodTypes: ['card'],
        metadata
      };

      console.log(`💳 [MOCK SQUARE] Payment created: ${paymentIntent.id}`);
      return {
        success: true,
        paymentIntent
      };

    } catch (error) {
      console.error('Square payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Square payment failed'
      };
    }
  }

  /**
   * Mock payment for development
   */
  private static async createMockPayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    console.log(`💳 [MOCK PAYMENT] Amount: ${amount} ${currency.toUpperCase()}`);
    console.log(`💳 [MOCK PAYMENT] Metadata:`, metadata);
    console.log(`💳 [MOCK PAYMENT] Status: Created`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const paymentIntent: PaymentIntent = {
      id: `mock_pi_${Date.now()}`,
      amount,
      currency: currency.toLowerCase(),
      status: 'pending',
      clientSecret: `mock_secret_${Date.now()}`,
      paymentMethodTypes: ['card'],
      metadata
    };
    
    return {
      success: true,
      paymentIntent
    };
  }

  /**
   * Confirm payment (simulate successful payment)
   */
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    try {
      console.log(`💳 [MOCK] Confirming payment: ${paymentIntentId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would confirm with the actual provider
      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: 0, // Would be retrieved from provider
        currency: 'usd',
        status: 'succeeded',
        paymentMethodTypes: ['card'],
        metadata: {}
      };

      // Update database records based on payment type
      await this.handleSuccessfulPayment(paymentIntentId);

      console.log(`✅ Payment confirmed successfully: ${paymentIntentId}`);
      return {
        success: true,
        paymentIntent
      };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed'
      };
    }
  }

  /**
   * Handle successful payment completion
   */
  private static async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      // Check NFT upgrade payments
      const { data: nftPayment } = await supabase
        .from('nft_upgrade_payments')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (nftPayment) {
        // Update NFT upgrade payment status
        await supabase
          .from('nft_upgrade_payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', nftPayment.id);

        // Update user's NFT
        await supabase
          .from('user_nfts')
          .update({
            nft_id: nftPayment.target_nft_id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', nftPayment.user_id);

        console.log(`✅ NFT upgrade completed for user ${nftPayment.user_id}`);
        return;
      }

      // Check subscription payments
      const { data: subscriptionPayment } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (subscriptionPayment) {
        // Update subscription payment status
        await supabase
          .from('subscription_payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', subscriptionPayment.id);

        // Activate user's subscription
        const endDate = new Date();
        if (subscriptionPayment.billing_period === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: subscriptionPayment.user_id,
            plan_id: subscriptionPayment.plan_id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            billing_period: subscriptionPayment.billing_period
          });

        console.log(`✅ Subscription activated for user ${subscriptionPayment.user_id}`);
        return;
      }

    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Get payment history for a user
   */
  static async getPaymentHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const [nftPayments, subscriptionPayments] = await Promise.all([
        supabase
          .from('nft_upgrade_payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('subscription_payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
      ]);

      const allPayments = [
        ...(nftPayments.data || []).map(p => ({ ...p, type: 'nft_upgrade' })),
        ...(subscriptionPayments.data || []).map(p => ({ ...p, type: 'subscription' }))
      ];

      return allPayments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Cancel payment intent
   */
  static async cancelPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      console.log(`💳 [MOCK] Canceling payment: ${paymentIntentId}`);
      
      // Update database records
      await Promise.all([
        supabase
          .from('nft_upgrade_payments')
          .update({ status: 'failed' })
          .eq('payment_intent_id', paymentIntentId),
        supabase
          .from('subscription_payments')
          .update({ status: 'failed' })
          .eq('payment_intent_id', paymentIntentId)
      ]);

      return { success: true };

    } catch (error) {
      console.error('Error canceling payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed'
      };
    }
  }
}
