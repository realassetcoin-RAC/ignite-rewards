// Direct Test Data Setup Script
// Run this in the browser console to set up test data without RPC dependencies

console.log('🚀 Starting Direct Test Data Setup...');

// Import the direct service
async function runDirectSetup() {
  try {
    console.log('📦 Importing direct test data service...');
    
    // Import the direct test data service
    const { DirectTestDataService } = await import('./src/lib/directTestDataService.ts');
    
    console.log('✅ Service imported successfully');
    
    // Create comprehensive test data
    console.log('🏗️ Creating comprehensive test data...');
    const result = await DirectTestDataService.createComprehensiveTestData();
    
    if (result.success) {
      console.log('✅ Test data created successfully!');
      console.log('📊 Created data:', result.data);
      
      // Get summary
      console.log('📈 Getting test data summary...');
      const summary = await DirectTestDataService.getTestDataSummary();
      
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
    console.error('❌ Direct setup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick setup function
async function quickDirectSetup() {
  try {
    console.log('⚡ Running quick direct setup...');
    
    const { DirectTestDataService } = await import('./src/lib/directTestDataService.ts');
    
    const result = await DirectTestDataService.createComprehensiveTestData();
    
    if (result.success) {
      console.log('✅ Quick direct setup completed successfully!');
      console.log('📊 Created data:', result.data);
    } else {
      console.error('❌ Quick direct setup failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Quick direct setup error:', error);
    return { success: false, error: error.message };
  }
}

// Get summary
async function getDirectSummary() {
  try {
    console.log('📊 Getting test data summary...');
    
    const { DirectTestDataService } = await import('./src/lib/directTestDataService.ts');
    
    const result = await DirectTestDataService.getTestDataSummary();
    
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
async function clearDirectData() {
  try {
    console.log('🧹 Clearing all test data...');
    
    const { DirectTestDataService } = await import('./src/lib/directTestDataService.ts');
    
    const result = await DirectTestDataService.clearAllTestData();
    
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
  window.runDirectSetup = runDirectSetup;
  window.quickDirectSetup = quickDirectSetup;
  window.getDirectSummary = getDirectSummary;
  window.clearDirectData = clearDirectData;
  
  console.log('💡 Available functions:');
  console.log('- runDirectSetup() - Full direct setup and testing');
  console.log('- quickDirectSetup() - Quick direct test data creation');
  console.log('- getDirectSummary() - Get current test data summary');
  console.log('- clearDirectData() - Clear all test data');
  console.log('');
  console.log('🚀 Run runDirectSetup() to start!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🎯 Ready to run direct test data setup!');
  console.log('💡 Type runDirectSetup() to start the direct setup process.');
}
