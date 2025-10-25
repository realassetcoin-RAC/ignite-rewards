/**
 * ✅ IMPLEMENT REQUIREMENT: Ecommerce API integration for direct transactions
 * RESTful API endpoints for merchant integrations and third-party ecommerce platforms
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

interface EcommerceTransaction {
  merchant_id: string;
  customer_email?: string;
  customer_loyalty_number?: string;
  transaction_amount: number;
  currency: string;
  order_id: string;
  product_ids?: string[];
  discount_code?: string;
  transaction_metadata?: Record<string, any>;
}

interface EcommerceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface LoyaltyReward {
  points_earned: number;
  tier_bonus: number;
  total_points: number;
  redemption_code?: string;
}

interface MerchantConfig {
  id: string;
  api_key: string;
  webhook_url?: string;
  points_per_dollar: number;
  minimum_transaction: number;
  maximum_points: number;
  active_campaigns?: string[];
}

export class EcommerceAPI {
  private static readonly API_VERSION = 'v1';
  private static readonly BASE_PATH = '/api/ecommerce';

  /**
   * Process ecommerce transaction and award loyalty points
   */
  static async processTransaction(
    apiKey: string,
    transaction: EcommerceTransaction
  ): Promise<EcommerceResponse<LoyaltyReward>> {
    try {
      console.log('🛒 Processing ecommerce transaction:', transaction.order_id);

      // Validate API key and get merchant config
      const merchantConfig = await this.validateApiKey(apiKey);
      if (!merchantConfig) {
        return {
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        };
      }

      // Validate transaction data
      const validationError = this.validateTransaction(transaction);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          code: 'VALIDATION_ERROR'
        };
      }

      // Check if transaction already exists
      const existingTransaction = await this.checkDuplicateTransaction(
        merchantConfig.id,
        transaction.order_id
      );
      
      if (existingTransaction) {
        return {
          success: false,
          error: 'Transaction already processed',
          code: 'DUPLICATE_TRANSACTION'
        };
      }

      // Find customer by email or loyalty number
      const customer = await this.findCustomer(
        transaction.customer_email,
        transaction.customer_loyalty_number
      );

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found. Customer must have a PointBridge account.',
          code: 'CUSTOMER_NOT_FOUND'
        };
      }

      // Calculate loyalty points
      const loyaltyReward = this.calculateLoyaltyPoints(
        transaction.transaction_amount,
        merchantConfig,
        customer
      );

      // Create transaction record
      const { data: transactionRecord, error: transactionError } = await supabase
        .from('ecommerce_transactions')
        .insert({
          merchant_id: merchantConfig.id,
          user_id: customer.id,
          order_id: transaction.order_id,
          transaction_amount: transaction.transaction_amount,
          currency: transaction.currency,
          points_earned: loyaltyReward.points_earned,
          tier_bonus: loyaltyReward.tier_bonus,
          discount_code: transaction.discount_code,
          product_ids: transaction.product_ids,
          transaction_metadata: transaction.transaction_metadata,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        return {
          success: false,
          error: 'Failed to process transaction',
          code: 'DATABASE_ERROR'
        };
      }

      // Award points to customer
      await this.awardLoyaltyPoints(customer.id, loyaltyReward.points_earned);

      // Update merchant monthly points tracking
      await this.updateMerchantPointsUsage(merchantConfig.id, loyaltyReward.points_earned);

      // Send webhook notification if configured
      if (merchantConfig.webhook_url) {
        this.sendWebhookNotification(merchantConfig.webhook_url, {
          event: 'transaction.completed',
          transaction: transactionRecord,
          loyalty_reward: loyaltyReward
        });
      }

      console.log('✅ Ecommerce transaction processed successfully');
      return {
        success: true,
        data: loyaltyReward
      };

    } catch (error) {
      console.error('Error processing ecommerce transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get customer loyalty information
   */
  static async getCustomerLoyalty(
    apiKey: string,
    customerEmail: string
  ): Promise<EcommerceResponse<any>> {
    try {
      const merchantConfig = await this.validateApiKey(apiKey);
      if (!merchantConfig) {
        return {
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        };
      }

      const customer = await this.findCustomer(customerEmail);
      if (!customer) {
        return {
          success: false,
          error: 'Customer not found',
          code: 'CUSTOMER_NOT_FOUND'
        };
      }

      // Get customer's loyalty card info
      const { data: loyaltyCard } = await supabase
        .from('user_loyalty_cards')
        .select('*')
        .eq('user_id', customer.id)
        .single();

      // Get transaction history with this merchant
      const { data: transactions } = await supabase
        .from('ecommerce_transactions')
        .select('*')
        .eq('merchant_id', merchantConfig.id)
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        data: {
          customer: {
            id: customer.id,
            email: customer.email,
            loyalty_number: loyaltyCard?.loyalty_number,
            points_balance: loyaltyCard?.points_balance || 0,
            tier_level: loyaltyCard?.tier_level || 'bronze',
            member_since: loyaltyCard?.created_at
          },
          recent_transactions: transactions || [],
          total_transactions: transactions?.length || 0,
          total_spent: transactions?.reduce((sum, t) => sum + t.transaction_amount, 0) || 0
        }
      };

    } catch (error) {
      console.error('Error getting customer loyalty info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Apply discount code and get discount amount
   */
  static async applyDiscountCode(
    apiKey: string,
    discountCode: string,
    orderAmount: number
  ): Promise<EcommerceResponse<any>> {
    try {
      const merchantConfig = await this.validateApiKey(apiKey);
      if (!merchantConfig) {
        return {
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        };
      }

      // Check if discount code exists and is valid
      const { data: discount, error } = await supabase
        .from('merchant_discount_codes')
        .select('*')
        .eq('merchant_id', merchantConfig.id)
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !discount) {
        return {
          success: false,
          error: 'Invalid or expired discount code',
          code: 'INVALID_DISCOUNT_CODE'
        };
      }

      // Check usage limits
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        return {
          success: false,
          error: 'Discount code usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED'
        };
      }

      // Check minimum order amount
      if (discount.minimum_order_amount && orderAmount < discount.minimum_order_amount) {
        return {
          success: false,
          error: `Minimum order amount of $${discount.minimum_order_amount} required`,
          code: 'MINIMUM_ORDER_NOT_MET'
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = (orderAmount * discount.discount_value) / 100;
        if (discount.max_discount_amount) {
          discountAmount = Math.min(discountAmount, discount.max_discount_amount);
        }
      } else if (discount.discount_type === 'fixed') {
        discountAmount = Math.min(discount.discount_value, orderAmount);
      }

      return {
        success: true,
        data: {
          discount_code: discount.code,
          discount_amount: discountAmount,
          discount_type: discount.discount_type,
          description: discount.description,
          final_amount: Math.max(0, orderAmount - discountAmount)
        }
      };

    } catch (error) {
      console.error('Error applying discount code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Validate API key and get merchant configuration
   */
  private static async validateApiKey(apiKey: string): Promise<MerchantConfig | null> {
    try {
      const { data: merchant, error } = await supabase
        .from('merchants')
        .select(`
          id,
          api_key,
          webhook_url,
          points_per_dollar,
          minimum_transaction,
          maximum_points,
          merchant_subscription_plans (
            monthly_points,
            monthly_transactions
          )
        `)
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single();

      if (error || !merchant) {
        return null;
      }

      return {
        id: merchant.id,
        api_key: merchant.api_key,
        webhook_url: merchant.webhook_url,
        points_per_dollar: merchant.points_per_dollar || 1,
        minimum_transaction: merchant.minimum_transaction || 0,
        maximum_points: merchant.maximum_points || 1000
      };

    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Validate transaction data
   */
  private static validateTransaction(transaction: EcommerceTransaction): string | null {
    if (!transaction.merchant_id) {
      return 'Merchant ID is required';
    }

    if (!transaction.order_id) {
      return 'Order ID is required';
    }

    if (!transaction.transaction_amount || transaction.transaction_amount <= 0) {
      return 'Valid transaction amount is required';
    }

    if (!transaction.currency) {
      return 'Currency is required';
    }

    if (!transaction.customer_email && !transaction.customer_loyalty_number) {
      return 'Customer email or loyalty number is required';
    }

    return null;
  }

  /**
   * Check for duplicate transaction
   */
  private static async checkDuplicateTransaction(
    merchantId: string,
    orderId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('ecommerce_transactions')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('order_id', orderId)
      .single();

    return !error && !!data;
  }

  /**
   * Find customer by email or loyalty number
   */
  private static async findCustomer(
    email?: string,
    loyaltyNumber?: string
  ): Promise<any> {
    if (email) {
      const { data: user } = await databaseAdapter.supabase.auth.admin.getUserByEmail(email);
      if (user) {
        return user;
      }
    }

    if (loyaltyNumber) {
      const { data: loyaltyCard } = await supabase
        .from('user_loyalty_cards')
        .select('user_id, profiles(*)')
        .eq('loyalty_number', loyaltyNumber)
        .single();

      if (loyaltyCard) {
        return {
          id: loyaltyCard.user_id,
          email: loyaltyCard.profiles?.email
        };
      }
    }

    return null;
  }

  /**
   * Calculate loyalty points based on transaction amount and customer tier
   */
  private static calculateLoyaltyPoints(
    amount: number,
    merchantConfig: MerchantConfig,
    customer: any
  ): LoyaltyReward {
    const basePoints = Math.floor(amount * merchantConfig.points_per_dollar);
    
    // Apply tier bonus (mock implementation)
    const tierMultipliers = {
      bronze: 1.0,
      silver: 1.2,
      gold: 1.5,
      platinum: 2.0
    };
    
    const tierMultiplier = tierMultipliers[customer.tier_level as keyof typeof tierMultipliers] || 1.0;
    const tierBonus = Math.floor(basePoints * (tierMultiplier - 1));
    const totalPoints = basePoints + tierBonus;

    // Apply maximum points limit
    const finalPoints = Math.min(totalPoints, merchantConfig.maximum_points);

    return {
      points_earned: basePoints,
      tier_bonus: tierBonus,
      total_points: finalPoints
    };
  }

  /**
   * Award loyalty points to customer
   */
  private static async awardLoyaltyPoints(userId: string, points: number): Promise<void> {
    await supabase
      .from('user_loyalty_cards')
      .update({
        points_balance: databaseAdapter.supabase.sql`points_balance + ${points}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  /**
   * Update merchant monthly points usage
   */
  private static async updateMerchantPointsUsage(
    merchantId: string,
    pointsUsed: number
  ): Promise<void> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    await supabase
      .from('merchant_monthly_points')
      .update({
        points_distributed: databaseAdapter.supabase.sql`points_distributed + ${pointsUsed}`,
        updated_at: new Date().toISOString()
      })
      .eq('merchant_id', merchantId)
      .eq('year', year)
      .eq('month', month);
  }

  /**
   * Send webhook notification to merchant
   */
  private static async sendWebhookNotification(
    webhookUrl: string,
    payload: any
  ): Promise<void> {
    try {
      console.log(`🔗 [MOCK WEBHOOK] Sending to: ${webhookUrl}`);
      console.log(`🔗 [MOCK WEBHOOK] Payload:`, payload);
      
      // In a real implementation, you would send HTTP POST request
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-PointBridge-Signature': generateSignature(payload)
      //   },
      //   body: JSON.stringify(payload)
      // });

    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  }

  /**
   * Generate API documentation
   */
  static getApiDocumentation(): any {
    return {
      version: this.API_VERSION,
      base_url: `${window.location.origin}${this.BASE_PATH}`,
      endpoints: {
        'POST /transaction': {
          description: 'Process ecommerce transaction and award loyalty points',
          auth: 'API Key (Header: X-API-Key)',
          body: {
            merchant_id: 'string (required)',
            customer_email: 'string (optional if loyalty_number provided)',
            customer_loyalty_number: 'string (optional if email provided)',
            transaction_amount: 'number (required)',
            currency: 'string (required, default: USD)',
            order_id: 'string (required, unique)',
            product_ids: 'array of strings (optional)',
            discount_code: 'string (optional)',
            transaction_metadata: 'object (optional)'
          },
          response: {
            success: 'boolean',
            data: {
              points_earned: 'number',
              tier_bonus: 'number',
              total_points: 'number'
            }
          }
        },
        'GET /customer/{email}': {
          description: 'Get customer loyalty information',
          auth: 'API Key (Header: X-API-Key)',
          response: {
            success: 'boolean',
            data: {
              customer: 'object',
              recent_transactions: 'array',
              total_transactions: 'number',
              total_spent: 'number'
            }
          }
        },
        'POST /discount/apply': {
          description: 'Apply discount code and calculate discount',
          auth: 'API Key (Header: X-API-Key)',
          body: {
            discount_code: 'string (required)',
            order_amount: 'number (required)'
          },
          response: {
            success: 'boolean',
            data: {
              discount_amount: 'number',
              final_amount: 'number'
            }
          }
        }
      }
    };
  }
}
