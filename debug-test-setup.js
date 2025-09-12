// Debug Test Data Setup
// Run this in the browser console to debug the test data creation process

async function debugTestSetup() {
  try {
    console.log('🔍 Starting debug test setup...');
    
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    console.log('📦 Service imported successfully');
    
    // Step 1: Check current data
    console.log('📊 Step 1: Getting current data summary...');
    const currentSummary = await SimpleTestDataService.getTestDataSummary();
    console.log('Current summary:', currentSummary);
    
    // Step 2: Try to create test data
    console.log('🏗️ Step 2: Creating comprehensive test data...');
    const result = await SimpleTestDataService.createComprehensiveTestData();
    console.log('Creation result:', result);
    
    // Step 3: Check data after creation
    console.log('📊 Step 3: Getting data summary after creation...');
    const newSummary = await SimpleTestDataService.getTestDataSummary();
    console.log('New summary:', newSummary);
    
    // Step 4: Compare before and after
    console.log('📈 Step 4: Comparing before and after...');
    console.log('Before:', currentSummary.data);
    console.log('After:', newSummary.data);
    
    return {
      before: currentSummary,
      creation: result,
      after: newSummary
    };
    
  } catch (error) {
    console.error('❌ Debug setup failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return { error: error.message, stack: error.stack };
  }
}

// Test individual components
async function testIndividualComponents() {
  try {
    console.log('🧪 Testing individual components...');
    
    const { SimpleTestDataService } = await import('./src/lib/simpleTestDataService.ts');
    
    // Test clearing data
    console.log('🧹 Testing clear data...');
    const clearResult = await SimpleTestDataService.clearAllTestData();
    console.log('Clear result:', clearResult);
    
    // Test DAO data creation
    console.log('🗳️ Testing DAO data creation...');
    try {
      // We need to access the private method, so let's try a different approach
      console.log('Note: Cannot test private methods directly');
    } catch (error) {
      console.log('DAO test error:', error);
    }
    
    return { clearResult };
    
  } catch (error) {
    console.error('❌ Individual component test failed:', error);
    return { error: error.message };
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugTestSetup = debugTestSetup;
  window.testIndividualComponents = testIndividualComponents;
  
  console.log('💡 Available debug functions:');
  console.log('- debugTestSetup() - Full debug process');
  console.log('- testIndividualComponents() - Test individual components');
  console.log('- checkTables() - Check if tables exist');
  console.log('');
  console.log('🚀 Run debugTestSetup() to start debugging!');
}
