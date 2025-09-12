// Simple Test Data Setup Script
// Run this in the browser console to set up test data using simple inserts

console.log('🚀 Starting Simple Test Data Setup...');

// Import the simple service
async function runSimpleSetup() {
  try {
    console.log('📦 Importing simple test data service...');
    
    // Import the simple test data service
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    console.log('✅ Service imported successfully');
    
    // Create comprehensive test data
    console.log('🏗️ Creating comprehensive test data...');
    const result = await SimpleTestDataService.createComprehensiveTestData();
    
    if (result.success) {
      console.log('✅ Test data created successfully!');
      console.log('📊 Created data:', result.data);
      
      // Get summary
      console.log('📈 Getting test data summary...');
      const summary = await SimpleTestDataService.getTestDataSummary();
      
      if (summary.success) {
        console.log('📊 Test Data Summary:', summary.data);
      }
      
      return {
        success: true,
        data: result.data,
        summary: summary.data
      };
    } else {
      console.error('❌ Failed to create test data:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Simple setup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick setup function
async function quickSimpleSetup() {
  try {
    console.log('⚡ Running quick simple setup...');
    
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    const result = await SimpleTestDataService.createComprehensiveTestData();
    
    if (result.success) {
      console.log('✅ Quick simple setup completed successfully!');
      console.log('📊 Created data:', result.data);
    } else {
      console.error('❌ Quick simple setup failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Quick simple setup error:', error);
    return { success: false, error: error.message };
  }
}

// Get summary
async function getSimpleSummary() {
  try {
    console.log('📊 Getting test data summary...');
    
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    const result = await SimpleTestDataService.getTestDataSummary();
    
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

// Clear all data
async function clearSimpleData() {
  try {
    console.log('🧹 Clearing all test data...');
    
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    const result = await SimpleTestDataService.clearAllTestData();
    
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

// Make functions available globally
if (typeof window !== 'undefined') {
  window.runSimpleSetup = runSimpleSetup;
  window.quickSimpleSetup = quickSimpleSetup;
  window.getSimpleSummary = getSimpleSummary;
  window.clearSimpleData = clearSimpleData;
  
  console.log('💡 Available functions:');
  console.log('- runSimpleSetup() - Full simple setup and testing');
  console.log('- quickSimpleSetup() - Quick simple test data creation');
  console.log('- getSimpleSummary() - Get current test data summary');
  console.log('- clearSimpleData() - Clear all test data');
  console.log('');
  console.log('🚀 Run runSimpleSetup() to start!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🎯 Ready to run simple test data setup!');
  console.log('💡 Type runSimpleSetup() to start the simple setup process.');
}
