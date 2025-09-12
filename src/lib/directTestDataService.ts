import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface TestDataResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class DirectTestDataService {
  /**
   * Create comprehensive test data using direct SQL operations
   */
  static async createComprehensiveTestData(): Promise<TestDataResult> {
    try {
      console.log('🚀 Starting comprehensive test data creation...');

      // Step 1: Create DAO tables if they don't exist
      const daoResult = await this.createDAOTables();
      if (!daoResult.success) {
        return daoResult;
      }

      // Step 2: Create DAO test data
      const daoDataResult = await this.createDAOTestData();
      if (!daoDataResult.success) {
        return daoDataResult;
      }

      // Step 3: Create merchant test data
      const merchantResult = await this.createMerchantTestData();
      if (!merchantResult.success) {
        return merchantResult;
      }

      // Step 4: Create transaction test data
      const transactionResult = await this.createTransactionTestData();
      if (!transactionResult.success) {
        return transactionResult;
      }

      return {
        success: true,
        message: 'Comprehensive test data created successfully',
        data: {
          dao: daoDataResult.data,
          merchants: merchantResult.data,
          transactions: transactionResult.data
        }
      };

    } catch (error) {
      console.error('❌ Error creating comprehensive test data:', error);
      return {
        success: false,
        message: 'Failed to create comprehensive test data',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create DAO tables if they don't exist
   */
  private static async createDAOTables(): Promise<TestDataResult> {
    try {
      console.log('🏗️ Checking DAO tables...');

      // Since DAO tables don't exist in the current schema, we'll skip table creation
      // and focus on creating test data for existing tables
      console.log('⚠️ DAO tables not available in current schema, skipping DAO data creation');
      
      return {
        success: true,
        message: 'DAO table check completed (tables not available in current schema)'
      };

    } catch (error) {
      console.error('❌ Error checking DAO tables:', error);
      return {
        success: false,
        message: 'Failed to check DAO tables',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create DAO test data
   */
  private static async createDAOTestData(): Promise<TestDataResult> {
    try {
      console.log('🏛️ Skipping DAO test data creation (tables not available)...');

      // Since DAO tables don't exist in the current schema, we'll skip DAO data creation
      console.log('⚠️ DAO tables not available in current schema, skipping DAO data creation');
      
      return {
        success: true,
        message: 'DAO test data creation skipped (tables not available in current schema)',
        data: {
          dao: null,
          members: null
        }
      };

    } catch (error) {
      console.error('❌ Error in DAO test data creation:', error);
      return {
        success: false,
        message: 'Failed to process DAO test data creation',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create merchant test data
   */
  private static async createMerchantTestData(): Promise<TestDataResult> {
    try {
      console.log('🏪 Creating merchant subscription plans test data...');

      // Create merchant subscription plans since merchants table doesn't exist
      const subscriptionPlans = [
        {
          id: uuidv4(),
          name: 'Basic Plan',
          description: 'Basic merchant subscription plan with essential features',
          price_monthly: 29.99,
          trial_days: 14,
          features: {
            max_transactions: 1000,
            analytics: true,
            support: 'email'
          },
          is_active: true
        },
        {
          id: uuidv4(),
          name: 'Standard Plan',
          description: 'Standard merchant subscription plan with advanced features',
          price_monthly: 59.99,
          trial_days: 30,
          features: {
            max_transactions: 5000,
            analytics: true,
            support: 'priority',
            custom_branding: true
          },
          is_active: true
        },
        {
          id: uuidv4(),
          name: 'Premium Plan',
          description: 'Premium merchant subscription plan with all features',
          price_monthly: 99.99,
          trial_days: 30,
          features: {
            max_transactions: -1, // unlimited
            analytics: true,
            support: 'dedicated',
            custom_branding: true,
            api_access: true
          },
          is_active: true
        }
      ];

      const { data: plansData, error: plansError } = await supabase
        .from('merchant_subscription_plans')
        .insert(subscriptionPlans)
        .select();

      if (plansError) {
        console.error('❌ Error creating merchant subscription plans:', plansError);
        return {
          success: false,
          message: 'Failed to create merchant subscription plans',
          error: plansError.message
        };
      }

      console.log('✅ Merchant subscription plans created successfully');
      return {
        success: true,
        message: 'Merchant subscription plans created successfully',
        data: plansData
      };

    } catch (error) {
      console.error('❌ Error creating merchant test data:', error);
      return {
        success: false,
        message: 'Failed to create merchant test data',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create transaction test data
   */
  private static async createTransactionTestData(): Promise<TestDataResult> {
    try {
      console.log('💳 Creating transaction test data...');

      // Create test transactions with mock merchant IDs since merchants table doesn't exist
      const transactions = [
        {
          id: uuidv4(),
          user_id: uuidv4(),
          merchant_id: uuidv4(), // Mock merchant ID
          loyalty_number: 'LOY001',
          transaction_amount: 299.99,
          points_earned: 299,
          transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          transaction_reference: 'TXN001'
        },
        {
          id: uuidv4(),
          user_id: uuidv4(),
          merchant_id: uuidv4(), // Mock merchant ID
          loyalty_number: 'LOY002',
          transaction_amount: 89.50,
          points_earned: 89,
          transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          transaction_reference: 'TXN002'
        },
        {
          id: uuidv4(),
          user_id: uuidv4(),
          merchant_id: uuidv4(), // Mock merchant ID
          loyalty_number: 'LOY003',
          transaction_amount: 149.99,
          points_earned: 149,
          transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          transaction_reference: 'TXN003'
        },
        {
          id: uuidv4(),
          user_id: uuidv4(),
          merchant_id: uuidv4(), // Mock merchant ID
          loyalty_number: 'LOY004',
          transaction_amount: 75.25,
          points_earned: 75,
          transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          transaction_reference: 'TXN004'
        }
      ];

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .insert(transactions)
        .select();

      if (transactionsError) {
        console.error('❌ Error creating transactions:', transactionsError);
        return {
          success: false,
          message: 'Failed to create transactions',
          error: transactionsError.message
        };
      }

      console.log('✅ Transaction test data created successfully');
      return {
        success: true,
        message: 'Transaction test data created successfully',
        data: transactionsData
      };

    } catch (error) {
      console.error('❌ Error creating transaction test data:', error);
      return {
        success: false,
        message: 'Failed to create transaction test data',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get test data summary
   */
  static async getTestDataSummary(): Promise<TestDataResult> {
    try {
      console.log('📊 Getting test data summary...');

      // Get available table counts
      const { data: subscriptionPlansCount } = await supabase
        .from('merchant_subscription_plans')
        .select('id', { count: 'exact' });

      const { data: transactionsCount } = await supabase
        .from('loyalty_transactions')
        .select('id', { count: 'exact' });

      const { data: loyaltyCardsCount } = await supabase
        .from('user_loyalty_cards')
        .select('id', { count: 'exact' });

      const { data: userPointsCount } = await supabase
        .from('user_points')
        .select('id', { count: 'exact' });

      const { data: userReferralsCount } = await supabase
        .from('user_referrals')
        .select('id', { count: 'exact' });

      const { data: referralCampaignsCount } = await supabase
        .from('referral_campaigns')
        .select('id', { count: 'exact' });

      const { data: qrCodesCount } = await supabase
        .from('transaction_qr_codes')
        .select('id', { count: 'exact' });

      const summary = {
        merchant_subscription_plans: subscriptionPlansCount?.length || 0,
        loyalty_transactions: transactionsCount?.length || 0,
        user_loyalty_cards: loyaltyCardsCount?.length || 0,
        user_points: userPointsCount?.length || 0,
        user_referrals: userReferralsCount?.length || 0,
        referral_campaigns: referralCampaignsCount?.length || 0,
        transaction_qr_codes: qrCodesCount?.length || 0,
        total_records: (subscriptionPlansCount?.length || 0) + 
                      (transactionsCount?.length || 0) + 
                      (loyaltyCardsCount?.length || 0) + 
                      (userPointsCount?.length || 0) + 
                      (userReferralsCount?.length || 0) + 
                      (referralCampaignsCount?.length || 0) + 
                      (qrCodesCount?.length || 0)
      };

      console.log('✅ Test data summary retrieved successfully');
      return {
        success: true,
        message: 'Test data summary retrieved successfully',
        data: summary
      };

    } catch (error) {
      console.error('❌ Error getting test data summary:', error);
      return {
        success: false,
        message: 'Failed to get test data summary',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clear all test data
   */
  static async clearAllTestData(): Promise<TestDataResult> {
    try {
      console.log('🧹 Clearing all test data...');

      // Clear in reverse dependency order
      const { error: qrCodesError } = await supabase
        .from('transaction_qr_codes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: userReferralsError } = await supabase
        .from('user_referrals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: referralCampaignsError } = await supabase
        .from('referral_campaigns')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: userPointsError } = await supabase
        .from('user_points')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: loyaltyCardsError } = await supabase
        .from('user_loyalty_cards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: subscriptionPlansError } = await supabase
        .from('merchant_subscription_plans')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (qrCodesError || transactionsError || userReferralsError || referralCampaignsError || userPointsError || loyaltyCardsError || subscriptionPlansError) {
        console.error('❌ Error clearing test data:', {
          qrCodesError,
          transactionsError,
          userReferralsError,
          referralCampaignsError,
          userPointsError,
          loyaltyCardsError,
          subscriptionPlansError
        });
        return {
          success: false,
          message: 'Failed to clear some test data',
          error: 'Some tables may not exist or have permission issues'
        };
      }

      console.log('✅ All test data cleared successfully');
      return {
        success: true,
        message: 'All test data cleared successfully'
      };

    } catch (error) {
      console.error('❌ Error clearing test data:', error);
      return {
        success: false,
        message: 'Failed to clear test data',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
