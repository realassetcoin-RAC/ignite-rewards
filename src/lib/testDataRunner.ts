import { ComprehensiveTestDataService } from './comprehensiveTestDataService';
import { DAOService } from './daoService';
// import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class TestDataRunner {
  /**
   * Run comprehensive tests for all application subsystems
   */
  static async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log('🧪 Starting comprehensive application tests...');
    
    // Test 1: Database Connection
    results.push(await this.testDatabaseConnection());
    
    // Test 2: RPC Functions
    results.push(await this.testRPCFunctions());
    
    // Test 3: Create Test Data
    results.push(await this.testCreateTestData());
    
    // Test 4: DAO Functionality
    results.push(...await this.testDAOFunctionality());
    
    // Test 5: Merchant Functionality
    results.push(...await this.testMerchantFunctionality());
    
    // Test 6: Transaction Functionality
    results.push(...await this.testTransactionFunctionality());
    
    // Test 7: Marketplace Functionality
    results.push(...await this.testMarketplaceFunctionality());
    
    // Test 8: User Integration
    results.push(await this.testUserIntegration());
    
    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    return results;
  }

  /**
   * Test database connection
   */
  private static async testDatabaseConnection(): Promise<TestResult> {
    try {
      const { error } = await supabase
        .from('dao_organizations')
        .select('count')
        .limit(1);
      
      if (error) {
        return {
          test: 'Database Connection',
          success: false,
          message: 'Failed to connect to database',
          error: error.message
        };
      }
      
      return {
        test: 'Database Connection',
        success: true,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        test: 'Database Connection',
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test RPC functions
   */
  private static async testRPCFunctions(): Promise<TestResult> {
    try {
      // Test if RPC functions exist by calling a simple one
      const { error } = await supabase.rpc('create_dao_tables');
      
      if (error) {
        return {
          test: 'RPC Functions',
          success: false,
          message: 'RPC functions not available',
          error: error.message
        };
      }
      
      return {
        test: 'RPC Functions',
        success: true,
        message: 'RPC functions are available'
      };
    } catch (error) {
      return {
        test: 'RPC Functions',
        success: false,
        message: 'RPC functions test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test creating comprehensive test data
   */
  private static async testCreateTestData(): Promise<TestResult> {
    try {
      const result = await ComprehensiveTestDataService.runComprehensiveSetup();
      
      return {
        test: 'Create Test Data',
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        test: 'Create Test Data',
        success: false,
        message: 'Failed to create test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test DAO functionality
   */
  private static async testDAOFunctionality(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      // Test getting organizations
      const orgs = await DAOService.getOrganizations();
      results.push({
        test: 'DAO - Get Organizations',
        success: orgs.length > 0,
        message: `Found ${orgs.length} organizations`,
        data: { count: orgs.length }
      });
      
      if (orgs.length > 0) {
        const daoId = orgs[0].id;
        
        // Test getting proposals
        const proposals = await DAOService.getProposals(daoId);
        results.push({
          test: 'DAO - Get Proposals',
          success: proposals.length > 0,
          message: `Found ${proposals.length} proposals`,
          data: { count: proposals.length }
        });
        
        // Test getting members
        const members = await DAOService.getMembers(daoId);
        results.push({
          test: 'DAO - Get Members',
          success: members.length > 0,
          message: `Found ${members.length} members`,
          data: { count: members.length }
        });
        
        // Test getting stats
        const stats = await DAOService.getDAOStats(daoId);
        results.push({
          test: 'DAO - Get Stats',
          success: true,
          message: 'DAO stats retrieved successfully',
          data: stats
        });
      }
    } catch (error) {
      results.push({
        test: 'DAO Functionality',
        success: false,
        message: 'DAO functionality test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return results;
  }

  /**
   * Test merchant functionality
   */
  private static async testMerchantFunctionality(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      // Test getting merchants
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .limit(5);
      
      if (error) {
        results.push({
          test: 'Merchants - Get Data',
          success: false,
          message: 'Failed to get merchants',
          error: error.message
        });
      } else {
        results.push({
          test: 'Merchants - Get Data',
          success: true,
          message: `Found ${merchants?.length || 0} merchants`,
          data: { count: merchants?.length || 0 }
        });
      }
    } catch (error) {
      results.push({
        test: 'Merchant Functionality',
        success: false,
        message: 'Merchant functionality test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return results;
  }

  /**
   * Test transaction functionality
   */
  private static async testTransactionFunctionality(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      // Test getting transactions
      const { data: transactions, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .limit(5);
      
      if (error) {
        results.push({
          test: 'Transactions - Get Data',
          success: false,
          message: 'Failed to get transactions',
          error: error.message
        });
      } else {
        results.push({
          test: 'Transactions - Get Data',
          success: true,
          message: `Found ${transactions?.length || 0} transactions`,
          data: { count: transactions?.length || 0 }
        });
      }
    } catch (error) {
      results.push({
        test: 'Transaction Functionality',
        success: false,
        message: 'Transaction functionality test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return results;
  }

  /**
   * Test marketplace functionality
   */
  private static async testMarketplaceFunctionality(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      // Test getting marketplace listings
      const { data: listings, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .limit(5);
      
      if (error) {
        results.push({
          test: 'Marketplace - Get Data',
          success: false,
          message: 'Failed to get marketplace listings',
          error: error.message
        });
      } else {
        results.push({
          test: 'Marketplace - Get Data',
          success: true,
          message: `Found ${listings?.length || 0} marketplace listings`,
          data: { count: listings?.length || 0 }
        });
      }
    } catch (error) {
      results.push({
        test: 'Marketplace Functionality',
        success: false,
        message: 'Marketplace functionality test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return results;
  }

  /**
   * Test user integration
   */
  private static async testUserIntegration(): Promise<TestResult> {
    try {
      // Test updating test data with real user IDs
      const result = await ComprehensiveTestDataService.updateWithRealUserIds();
      
      return {
        test: 'User Integration',
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        test: 'User Integration',
        success: false,
        message: 'User integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get test data summary
   */
  static async getTestDataSummary(): Promise<TestResult> {
    try {
      const result = await ComprehensiveTestDataService.getTestDataSummary();
      
      return {
        test: 'Get Test Data Summary',
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        test: 'Get Test Data Summary',
        success: false,
        message: 'Failed to get test data summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all test data
   */
  static async clearAllTestData(): Promise<TestResult> {
    try {
      const result = await ComprehensiveTestDataService.clearAllTestData();
      
      return {
        test: 'Clear All Test Data',
        success: result.success,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      return {
        test: 'Clear All Test Data',
        success: false,
        message: 'Failed to clear test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
