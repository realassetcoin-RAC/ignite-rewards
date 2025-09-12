// Test Schema Fix
// Run this in the browser console to test if the schema fix works

async function testSchemaFix() {
  try {
    console.log('🧪 Testing schema fix...');
    
    const { RobustTestDataService } = await import('./src/lib/robustTestDataService.ts');
    
    console.log('📦 Service imported successfully');
    
    // Test creating comprehensive test data
    console.log('🏗️ Testing comprehensive test data creation...');
    const result = await RobustTestDataService.createComprehensiveTestData();
    
    console.log('📊 Result:', result);
    
    if (result.success) {
      console.log('✅ Schema fix successful! Test data created successfully.');
      console.log('📈 Data created:', result.data);
    } else {
      console.log('❌ Schema fix failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return { success: false, error: error.message };
  }
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.testSchemaFix = testSchemaFix;
  console.log('💡 Run testSchemaFix() to test the schema fix');
}
