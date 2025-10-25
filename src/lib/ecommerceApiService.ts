import { databaseAdapter } from '@/lib/databaseAdapter';

export interface EcommerceTransaction {
  transaction_id: string;
  merchant_id: string;
  customer_email: string;
  amount: number;
  receipt_number: string;
  transaction_date: string;
  customer_name?: string;
  comments?: string;
  currency: string;
  payment_method: string;
  items?: EcommerceItem[];
}

export interface EcommerceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface EcommerceApiResponse {
  success: boolean;
  transaction_id?: string;
  points_awarded?: number;
  message: string;
  error_code?: string;
}

export interface EcommerceIntegration {
  id: string;
  merchant_id: string;
  platform: 'shopify' | 'woocommerce' | 'magento' | 'custom';
  api_key: string;
  webhook_url?: string;
  is_active: boolean;
  created_at: string;
}

export class EcommerceApiService {
  /**
   * Process a direct transaction from ecommerce platform
   */
  static async processDirectTransaction(
    transaction: EcommerceTransaction,
    apiKey: string
  ): Promise<EcommerceApiResponse> {
    try {
      // Validate API key and get merchant
      const { data: integration, error: integrationError } = await supabase
        .from('ecommerce_integrations')
        .select(`
          *,
          merchants!inner(*)
        `)
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'Invalid or inactive API key',
          error_code: 'INVALID_API_KEY'
        };
      }

      // Validate merchant ID matches
      if (integration.merchant_id !== transaction.merchant_id) {
        return {
          success: false,
          message: 'Merchant ID mismatch',
          error_code: 'MERCHANT_MISMATCH'
        };
      }

      // Find customer by email
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .select('id, loyalty_number')
        .eq('email', transaction.customer_email)
        .single();

      if (customerError || !customer) {
        return {
          success: false,
          message: 'Customer not found in loyalty system',
          error_code: 'CUSTOMER_NOT_FOUND'
        };
      }

      // Calculate points based on merchant's point rate
      const pointsAwarded = Math.floor(transaction.amount * integration.merchants.point_rate);

      // Create loyalty transaction
      const { data: loyaltyTransaction, error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: customer.id,
          merchant_id: transaction.merchant_id,
          loyalty_number: customer.loyalty_number,
          transaction_amount: transaction.amount,
          transaction_date: transaction.transaction_date,
          receipt_number: transaction.receipt_number,
          customer_name: transaction.customer_name,
          comments: transaction.comments,
          points_awarded: pointsAwarded,
          source: 'ecommerce_api',
          payment_method: transaction.payment_method,
          currency: transaction.currency
        })
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Award points to customer
      const { error: pointsError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: customer.id,
          points: pointsAwarded,
          source: 'transaction',
          description: `Ecommerce transaction from ${integration.merchants.business_name}`,
          transaction_id: loyaltyTransaction.id
        });

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't fail the transaction for points error
      }

      // Create point release delay record (30-day delay)
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 30);

      await supabase
        .from('point_release_delays')
        .insert({
          user_id: customer.id,
          transaction_id: loyaltyTransaction.id,
          points_amount: pointsAwarded,
          release_date: releaseDate.toISOString()
        });

      return {
        success: true,
        transaction_id: loyaltyTransaction.id,
        points_awarded: pointsAwarded,
        message: 'Transaction processed successfully'
      };

    } catch (error) {
      console.error('Ecommerce API error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error_code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Create ecommerce integration for merchant
   */
  static async createIntegration(
    merchantId: string,
    platform: string,
    apiKey: string,
    webhookUrl?: string
  ): Promise<{ success: boolean; integration?: EcommerceIntegration; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ecommerce_integrations')
        .insert({
          merchant_id: merchantId,
          platform: platform as any,
          api_key: apiKey,
          webhook_url: webhookUrl,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        integration: data
      };
    } catch (error) {
      console.error('Error creating integration:', error);
      return {
        success: false,
        error: 'Failed to create integration'
      };
    }
  }

  /**
   * Get merchant's ecommerce integrations
   */
  static async getMerchantIntegrations(merchantId: string): Promise<EcommerceIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('ecommerce_integrations')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting integrations:', error);
      return [];
    }
  }

  /**
   * Update integration status
   */
  static async updateIntegrationStatus(
    integrationId: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ecommerce_integrations')
        .update({ is_active: isActive })
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating integration:', error);
      return {
        success: false,
        error: 'Failed to update integration'
      };
    }
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ecommerce_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting integration:', error);
      return {
        success: false,
        error: 'Failed to delete integration'
      };
    }
  }

  /**
   * Validate webhook signature (for security)
   */
  static validateWebhookSignature(): boolean {
    // Implement webhook signature validation
    // This is a simplified version - implement proper HMAC validation
    return true;
  }

  /**
   * Process webhook from ecommerce platform
   */
  static async processWebhook(
    payload: any,
    signature: string,
    integrationId: string
  ): Promise<EcommerceApiResponse> {
    try {
      // Get integration details
      const { data: integration, error: integrationError } = await supabase
        .from('ecommerce_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'Integration not found',
          error_code: 'INTEGRATION_NOT_FOUND'
        };
      }

      // Validate webhook signature
      if (!this.validateWebhookSignature(JSON.stringify(payload), signature, integration.api_key)) {
        return {
          success: false,
          message: 'Invalid webhook signature',
          error_code: 'INVALID_SIGNATURE'
        };
      }

      // Process the webhook payload based on platform
      switch (integration.platform) {
        case 'shopify':
          return this.processShopifyWebhook();
        case 'woocommerce':
          return this.processWooCommerceWebhook();
        case 'magento':
          return this.processMagentoWebhook();
        default:
          return {
            success: false,
            message: 'Unsupported platform',
            error_code: 'UNSUPPORTED_PLATFORM'
          };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: 'Webhook processing failed',
        error_code: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Process Shopify webhook
   */
  private static async processShopifyWebhook(): Promise<EcommerceApiResponse> {
    // Implement Shopify-specific webhook processing
    // This would parse Shopify order data and create loyalty transactions
    return {
      success: false,
      message: 'Shopify webhook processing not implemented',
      error_code: 'NOT_IMPLEMENTED'
    };
  }

  /**
   * Process WooCommerce webhook
   */
  private static async processWooCommerceWebhook(): Promise<EcommerceApiResponse> {
    // Implement WooCommerce-specific webhook processing
    return {
      success: false,
      message: 'WooCommerce webhook processing not implemented',
      error_code: 'NOT_IMPLEMENTED'
    };
  }

  /**
   * Process Magento webhook
   */
  private static async processMagentoWebhook(): Promise<EcommerceApiResponse> {
    // Implement Magento-specific webhook processing
    return {
      success: false,
      message: 'Magento webhook processing not implemented',
      error_code: 'NOT_IMPLEMENTED'
    };
  }
}
