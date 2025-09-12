// Simple test script to verify DAO setup
// This can be run in the browser console to test the setup

console.log('🧪 Testing DAO Setup...');

// Test 1: Check if SetupDAOTestData is available
if (typeof window !== 'undefined' && window.SetupDAOTestData) {
  console.log('✅ SetupDAOTestData is available');
} else {
  console.log('❌ SetupDAOTestData is not available');
}

// Test 2: Check if DAOService is available
if (typeof window !== 'undefined' && window.DAOService) {
  console.log('✅ DAOService is available');
} else {
  console.log('❌ DAOService is not available');
}

// Test 3: Check if Supabase client is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client is available');
} else {
  console.log('❌ Supabase client is not available');
}

console.log('🎯 To test the setup:');
console.log('1. Go to the DAO Voting page');
console.log('2. Look for the "Setup Test Data" button');
console.log('3. Click it to create test data');
console.log('4. The page should reload and show DAO proposals');

// If running in browser, add some helper functions
if (typeof window !== 'undefined') {
  window.testDAOSetup = async function() {
    try {
      console.log('🚀 Testing DAO setup...');
      
      // Import the setup service
      const { SetupDAOTestData } = await import('./src/lib/setupDAOTestData.ts');
      
      // Check if test data exists
      const exists = await SetupDAOTestData.checkTestDataExists();
      console.log('Test data exists:', exists);
      
      if (!exists) {
        console.log('Setting up test data...');
        const result = await SetupDAOTestData.setupTestData();
        console.log('Setup result:', result);
      }
      
      return { success: true, message: 'Test completed' };
    } catch (error) {
      console.error('Test failed:', error);
      return { success: false, message: error.message };
    }
  };
  
  console.log('💡 You can run testDAOSetup() in the console to test the setup');
}
