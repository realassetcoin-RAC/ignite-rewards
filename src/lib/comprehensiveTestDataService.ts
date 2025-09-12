import { supabase } from '@/integrations/supabase/client';

export interface TestDataResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ComprehensiveTestDataService {
  /**
   * Create comprehensive test data for all application subsystems
   */
  static async createComprehensiveTestData(): Promise<TestDataResult> {
    try {
      console.log('🚀 Creating comprehensive test data for all subsystems...');

      // Call the RPC function to create all test data
      const { data, error } = await supabase.rpc('create_comprehensive_test_data');

      if (error) {
        console.error('RPC Error:', error);
        return {
          success: false,
          message: 'Failed to create test data',
          error: error.message
        };
      }

      console.log('✅ Comprehensive test data created successfully:', data);
      return {
        success: true,
        message: data.message || 'Comprehensive test data created successfully',
        data: data.data
      };
    } catch (error) {
      console.error('❌ Error creating comprehensive test data:', error);
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create DAO test data only
   */
  static async createDAOTestData(): Promise<TestDataResult> {
    try {
      console.log('🗳️ Creating DAO test data...');

      // First ensure tables exist
      await this.createDAOTables();

      // Create DAO test data
      const { data, error } = await supabase.rpc('create_dao_test_data');

      if (error) {
        console.error('DAO RPC Error:', error);
        return {
          success: false,
          message: 'Failed to create DAO test data',
          error: error.message
        };
      }

      console.log('✅ DAO test data created successfully:', data);
      return {
        success: true,
        message: data.message || 'DAO test data created successfully',
        data: data.data
      };
    } catch (error) {
      console.error('❌ Error creating DAO test data:', error);
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create DAO tables if they don't exist
   */
  static async createDAOTables(): Promise<TestDataResult> {
    try {
      console.log('🏗️ Creating DAO tables...');

      const { data, error } = await supabase.rpc('create_dao_tables');

      if (error) {
        console.error('Table creation error:', error);
        return {
          success: false,
          message: 'Failed to create DAO tables',
          error: error.message
        };
      }

      console.log('✅ DAO tables created successfully');
      return {
        success: true,
        message: 'DAO tables created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating DAO tables:', error);
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all test data
   */
  static async clearAllTestData(): Promise<TestDataResult> {
    try {
      console.log('🧹 Clearing all test data...');

      const { data, error } = await supabase.rpc('clear_all_test_data');

      if (error) {
        console.error('Clear data error:', error);
        return {
          success: false,
          message: 'Failed to clear test data',
          error: error.message
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
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update test data with real user IDs
   */
  static async updateWithRealUserIds(): Promise<TestDataResult> {
    try {
      console.log('👤 Updating test data with real user IDs...');

      const { data, error } = await supabase.rpc('update_test_data_with_real_users');

      if (error) {
        console.error('Update user IDs error:', error);
        return {
          success: false,
          message: 'Failed to update user IDs',
          error: error.message
        };
      }

      console.log('✅ Test data updated with real user IDs:', data);
      return {
        success: true,
        message: data.message || 'Test data updated with real user IDs',
        data: data.data
      };
    } catch (error) {
      console.error('❌ Error updating user IDs:', error);
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if test data exists
   */
  static async checkTestDataExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('dao_organizations')
        .select('id')
        .eq('id', '550e8400-e29b-41d4-a716-446655440000')
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get test data summary
   */
  static async getTestDataSummary(): Promise<TestDataResult> {
    try {
      console.log('📊 Getting test data summary...');

      // Get counts from all tables
      const [orgsResult, membersResult, proposalsResult, votesResult, merchantsResult, transactionsResult, listingsResult] = await Promise.all([
        supabase.from('dao_organizations').select('id', { count: 'exact', head: true }),
        supabase.from('dao_members').select('id', { count: 'exact', head: true }),
        supabase.from('dao_proposals').select('id', { count: 'exact', head: true }),
        supabase.from('dao_votes').select('id', { count: 'exact', head: true }),
        supabase.from('merchants').select('id', { count: 'exact', head: true }),
        supabase.from('loyalty_transactions').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true })
      ]);

      const summary = {
        dao: {
          organizations: orgsResult.count || 0,
          members: membersResult.count || 0,
          proposals: proposalsResult.count || 0,
          votes: votesResult.count || 0
        },
        merchants: merchantsResult.count || 0,
        transactions: transactionsResult.count || 0,
        listings: listingsResult.count || 0
      };

      console.log('📊 Test data summary:', summary);
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
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run comprehensive test data setup with progress tracking
   */
  static async runComprehensiveSetup(): Promise<TestDataResult> {
    try {
      console.log('🚀 Starting comprehensive test data setup...');

      const steps = [
        { name: 'Creating DAO tables', fn: () => this.createDAOTables() },
        { name: 'Creating comprehensive test data', fn: () => this.createComprehensiveTestData() },
        { name: 'Updating with real user IDs', fn: () => this.updateWithRealUserIds() }
      ];

      const results = [];
      for (const step of steps) {
        console.log(`⏳ ${step.name}...`);
        const result = await step.fn();
        results.push({ step: step.name, result });
        
        if (!result.success) {
          console.error(`❌ Failed at step: ${step.name}`, result.error);
          return {
            success: false,
            message: `Setup failed at step: ${step.name}`,
            error: result.error,
            data: { completedSteps: results }
          };
        }
        console.log(`✅ ${step.name} completed`);
      }

      // Get final summary
      const summary = await this.getTestDataSummary();

      console.log('🎉 Comprehensive test data setup completed successfully!');
      return {
        success: true,
        message: 'Comprehensive test data setup completed successfully',
        data: {
          steps: results,
          summary: summary.data
        }
      };
    } catch (error) {
      console.error('❌ Error in comprehensive setup:', error);
      return {
        success: false,
        message: 'Unexpected error in comprehensive setup',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
