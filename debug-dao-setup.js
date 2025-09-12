// Debug script to test DAO setup
// Run this in the browser console to debug the setup

console.log('🔍 Debugging DAO Setup...');

// Test 1: Check if we can access the setup service
async function testSetupService() {
  try {
    console.log('Testing SetupDAOTestData service...');
    
    // Import the service
    const { SetupDAOTestData } = await import('./src/lib/setupDAOTestData.ts');
    
    // Check if test data exists
    const exists = await SetupDAOTestData.checkTestDataExists();
    console.log('Test data exists:', exists);
    
    return { success: true, exists };
  } catch (error) {
    console.error('Error testing setup service:', error);
    return { success: false, error: error.message };
  }
}

// Test 2: Check DAO service
async function testDAOService() {
  try {
    console.log('Testing DAOService...');
    
    // Import the service
    const { DAOService } = await import('./src/lib/daoService.ts');
    
    // Try to get organizations
    const orgs = await DAOService.getOrganizations();
    console.log('Organizations found:', orgs.length);
    console.log('Organizations:', orgs);
    
    if (orgs.length > 0) {
      // Try to get proposals
      const proposals = await DAOService.getProposals(orgs[0].id);
      console.log('Proposals found:', proposals.length);
      console.log('Proposals:', proposals);
    }
    
    return { success: true, orgs: orgs.length, proposals: orgs.length > 0 ? (await DAOService.getProposals(orgs[0].id)).length : 0 };
  } catch (error) {
    console.error('Error testing DAO service:', error);
    return { success: false, error: error.message };
  }
}

// Test 3: Check Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Import supabase
    const { supabase } = await import('./src/integrations/supabase/client.ts');
    
    // Try a simple query
    const { data, error } = await supabase.from('dao_organizations').select('count').limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful');
    return { success: true };
  } catch (error) {
    console.error('Error testing Supabase:', error);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all DAO setup tests...');
  
  const results = {
    setupService: await testSetupService(),
    daoservice: await testDAOService(),
    supabase: await testSupabaseConnection()
  };
  
  console.log('📊 Test Results:', results);
  
  // Summary
  const allPassed = Object.values(results).every(r => r.success);
  console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
  
  return results;
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testDAOSetup = testSetupService;
  window.testDAOService = testDAOService;
  window.testSupabaseConnection = testSupabaseConnection;
  window.runAllDAOTests = runAllTests;
  
  console.log('💡 Available functions:');
  console.log('- testDAOSetup() - Test the setup service');
  console.log('- testDAOService() - Test the DAO service');
  console.log('- testSupabaseConnection() - Test Supabase connection');
  console.log('- runAllDAOTests() - Run all tests');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runAllTests();
}
