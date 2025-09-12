// Comprehensive Test Data Setup Script
// Run this in the browser console to set up and test all application subsystems

console.log('🚀 Starting Comprehensive Test Data Setup...');

// Import the services
async function runComprehensiveSetup() {
  try {
    console.log('📦 Importing services...');
    
    // Import the comprehensive test data service
    const { ComprehensiveTestDataService } = await import('./src/lib/comprehensiveTestDataService.ts');
    
    // Import the test runner
    const { TestDataRunner } = await import('./src/lib/testDataRunner.ts');
    
    console.log('✅ Services imported successfully');
    
    // Step 1: Create comprehensive test data
    console.log('🏗️ Creating comprehensive test data...');
    const setupResult = await ComprehensiveTestDataService.runComprehensiveSetup();
    
    if (setupResult.success) {
      console.log('✅ Test data created successfully:', setupResult.data);
    } else {
      console.error('❌ Failed to create test data:', setupResult.error);
      return { success: false, error: setupResult.error };
    }
    
    // Step 2: Run comprehensive tests
    console.log('🧪 Running comprehensive tests...');
    const testResults = await TestDataRunner.runAllTests();
    
    // Display test results
    console.log('📊 Test Results:');
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
      if (result.error) {
        console.error(`   Error: ${result.error}`);
      }
    });
    
    // Step 3: Get final summary
    console.log('📈 Getting final summary...');
    const summaryResult = await TestDataRunner.getTestDataSummary();
    
    if (summaryResult.success) {
      console.log('📊 Final Test Data Summary:', summaryResult.data);
    }
    
    // Calculate success rate
    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;
    const successRate = (passed / total * 100).toFixed(1);
    
    console.log(`🎯 Overall Success Rate: ${successRate}% (${passed}/${total} tests passed)`);
    
    return {
      success: true,
      setupResult,
      testResults,
      summary: summaryResult.data,
      successRate: parseFloat(successRate)
    };
    
  } catch (error) {
    console.error('❌ Comprehensive setup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick setup function
async function quickSetup() {
  try {
    console.log('⚡ Running quick setup...');
    
    const { ComprehensiveTestDataService } = await import('./src/lib/comprehensiveTestDataService.ts');
    
    const result = await ComprehensiveTestDataService.runComprehensiveSetup();
    
    if (result.success) {
      console.log('✅ Quick setup completed successfully!');
      console.log('📊 Created data:', result.data);
    } else {
      console.error('❌ Quick setup failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Quick setup error:', error);
    return { success: false, error: error.message };
  }
}

// Test specific subsystem
async function testSubsystem(subsystem) {
  try {
    console.log(`🧪 Testing ${subsystem} subsystem...`);
    
    const { TestDataRunner } = await import('./src/lib/testDataRunner.ts');
    
    let results = [];
    switch (subsystem) {
      case 'dao':
        results = await TestDataRunner.testDAOFunctionality();
        break;
      case 'merchants':
        results = await TestDataRunner.testMerchantFunctionality();
        break;
      case 'transactions':
        results = await TestDataRunner.testTransactionFunctionality();
        break;
      case 'marketplace':
        results = await TestDataRunner.testMarketplaceFunctionality();
        break;
      default:
        console.error('❌ Unknown subsystem:', subsystem);
        return { success: false, error: 'Unknown subsystem' };
    }
    
    console.log(`📊 ${subsystem} test results:`);
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    return { success: true, results };
  } catch (error) {
    console.error(`❌ ${subsystem} test failed:`, error);
    return { success: false, error: error.message };
  }
}

// Clear all test data
async function clearAllData() {
  try {
    console.log('🧹 Clearing all test data...');
    
    const { TestDataRunner } = await import('./src/lib/testDataRunner.ts');
    
    const result = await TestDataRunner.clearAllTestData();
    
    if (result.success) {
      console.log('✅ All test data cleared successfully');
    } else {
      console.error('❌ Failed to clear test data:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Clear data error:', error);
    return { success: false, error: error.message };
  }
}

// Get current test data summary
async function getSummary() {
  try {
    console.log('📊 Getting test data summary...');
    
    const { TestDataRunner } = await import('./src/lib/testDataRunner.ts');
    
    const result = await TestDataRunner.getTestDataSummary();
    
    if (result.success) {
      console.log('📊 Test Data Summary:', result.data);
    } else {
      console.error('❌ Failed to get summary:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Get summary error:', error);
    return { success: false, error: error.message };
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.runComprehensiveSetup = runComprehensiveSetup;
  window.quickSetup = quickSetup;
  window.testSubsystem = testSubsystem;
  window.clearAllData = clearAllData;
  window.getSummary = getSummary;
  
  console.log('💡 Available functions:');
  console.log('- runComprehensiveSetup() - Full setup and testing');
  console.log('- quickSetup() - Quick test data creation');
  console.log('- testSubsystem("dao") - Test specific subsystem');
  console.log('- testSubsystem("merchants") - Test merchants');
  console.log('- testSubsystem("transactions") - Test transactions');
  console.log('- testSubsystem("marketplace") - Test marketplace');
  console.log('- clearAllData() - Clear all test data');
  console.log('- getSummary() - Get current test data summary');
  console.log('');
  console.log('🚀 Run runComprehensiveSetup() to start!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🎯 Ready to run comprehensive test setup!');
  console.log('💡 Type runComprehensiveSetup() to start the full setup and testing process.');
}
