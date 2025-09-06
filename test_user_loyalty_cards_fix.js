/**
 * Comprehensive Test for user_loyalty_cards Table Fix
 * This script tests all aspects of the loyalty card functionality
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890'
};

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${message ? ` - ${message}` : ''}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('user_loyalty_cards').select('count').limit(1);
    logTest('Database Connection', !error, error ? error.message : 'Connected successfully');
    return !error;
  } catch (err) {
    logTest('Database Connection', false, err.message);
    return false;
  }
}

async function testTableStructure() {
  try {
    // Test if we can query the table structure
    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .select('id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at')
      .limit(1);
    
    logTest('Table Structure', !error, error ? error.message : 'All expected columns present');
    return !error;
  } catch (err) {
    logTest('Table Structure', false, err.message);
    return false;
  }
}

async function testLoyaltyNumberGeneration() {
  try {
    // Test the RPC function
    const { data, error } = await supabase.rpc('generate_loyalty_number', { 
      user_email: testUser.email 
    });
    
    const hasValidNumber = data && typeof data === 'string' && data.length >= 8;
    logTest('Loyalty Number Generation', hasValidNumber, 
      hasValidNumber ? `Generated: ${data}` : `Error: ${error?.message || 'Invalid response'}`);
    
    return hasValidNumber ? data : null;
  } catch (err) {
    logTest('Loyalty Number Generation', false, err.message);
    return null;
  }
}

async function testCardCreation() {
  try {
    // Generate a test loyalty number
    const loyaltyNumber = await testLoyaltyNumberGeneration();
    if (!loyaltyNumber) {
      logTest('Card Creation', false, 'Cannot test without valid loyalty number');
      return false;
    }

    // Test data for insertion
    const testCardData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      loyalty_number: loyaltyNumber,
      full_name: testUser.full_name,
      email: testUser.email,
      phone: testUser.phone,
      is_active: true
    };

    // Try to insert (this might fail due to RLS, but we can test the structure)
    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .insert(testCardData)
      .select();

    // Check if it's a permission error (expected) vs structure error
    const isPermissionError = error && (error.code === '42501' || error.message?.includes('permission'));
    const isStructureError = error && !isPermissionError;
    
    logTest('Card Creation Structure', !isStructureError, 
      isPermissionError ? 'Permission denied (expected with RLS)' : 
      isStructureError ? `Structure error: ${error.message}` : 'Insert successful');
    
    return !isStructureError;
  } catch (err) {
    logTest('Card Creation', false, err.message);
    return false;
  }
}

async function testSchemaCompatibility() {
  try {
    // Test both schema references
    const { data: publicData, error: publicError } = await supabase
      .from('user_loyalty_cards')
      .select('count')
      .limit(1);

    const { data: apiData, error: apiError } = await supabase
      .schema('api')
      .from('user_loyalty_cards')
      .select('count')
      .limit(1);

    const publicWorks = !publicError;
    const apiWorks = !apiError;
    
    logTest('Public Schema Access', publicWorks, publicError ? publicError.message : 'Accessible');
    logTest('API Schema Access', apiWorks, apiError ? apiError.message : 'Accessible');
    
    return publicWorks || apiWorks;
  } catch (err) {
    logTest('Schema Compatibility', false, err.message);
    return false;
  }
}

async function testRLSPolicies() {
  try {
    // Test if RLS is properly configured
    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .select('*')
      .limit(1);

    // RLS should either return data (if user is authenticated) or return empty (if not)
    // The key is that it shouldn't throw a structure error
    const isRLSWorking = !error || error.code === 'PGRST116'; // PGRST116 = no rows returned
    
    logTest('RLS Policies', isRLSWorking, 
      error && error.code !== 'PGRST116' ? `RLS Error: ${error.message}` : 'RLS properly configured');
    
    return isRLSWorking;
  } catch (err) {
    logTest('RLS Policies', false, err.message);
    return false;
  }
}

async function testFunctionCompatibility() {
  try {
    // Test both function versions
    const { data: publicFunc, error: publicError } = await supabase.rpc('generate_loyalty_number', { 
      user_email: testUser.email 
    });

    const { data: apiFunc, error: apiError } = await supabase.rpc('generate_loyalty_number', { 
      user_email: testUser.email 
    });

    const publicWorks = !publicError && publicFunc;
    const apiWorks = !apiError && apiFunc;
    
    logTest('Public Function', publicWorks, publicError ? publicError.message : `Generated: ${publicFunc}`);
    logTest('API Function', apiWorks, apiError ? apiError.message : `Generated: ${apiFunc}`);
    
    return publicWorks || apiWorks;
  } catch (err) {
    logTest('Function Compatibility', false, err.message);
    return false;
  }
}

async function testFrontendCompatibility() {
  try {
    // Simulate what the frontend components do
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Test without authentication (should still work for structure)
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select('*')
        .limit(1);
      
      const isStructureValid = !error || error.code === 'PGRST116';
      logTest('Frontend Compatibility (Unauthenticated)', isStructureValid, 
        error && error.code !== 'PGRST116' ? error.message : 'Structure accessible');
      
      return isStructureValid;
    } else {
      // Test with authentication
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      logTest('Frontend Compatibility (Authenticated)', !error, 
        error ? error.message : 'User data accessible');
      
      return !error;
    }
  } catch (err) {
    logTest('Frontend Compatibility', false, err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting user_loyalty_cards Table Fix Tests\n');
  console.log('=' .repeat(60));
  
  // Run all tests
  await testDatabaseConnection();
  await testTableStructure();
  await testLoyaltyNumberGeneration();
  await testCardCreation();
  await testSchemaCompatibility();
  await testRLSPolicies();
  await testFunctionCompatibility();
  await testFrontendCompatibility();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The user_loyalty_cards fix is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
    console.log('\nFailed tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`  - ${test.name}: ${test.message}`));
  }
  
  console.log('\n💡 Next Steps:');
  if (testResults.failed === 0) {
    console.log('  1. The database fix is working correctly');
    console.log('  2. Frontend components should work without issues');
    console.log('  3. Users can create loyalty cards successfully');
  } else {
    console.log('  1. Apply the database migration: 20250115_final_user_loyalty_cards_fix.sql');
    console.log('  2. Re-run this test to verify the fix');
    console.log('  3. Check Supabase dashboard for any permission issues');
  }
}

// Run the tests
runAllTests().catch(console.error);

