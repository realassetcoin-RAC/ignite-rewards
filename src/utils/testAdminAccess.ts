/**
 * Admin Access Test Utility
 * 
 * This script can be used to test and verify admin access for specific users.
 * It's designed to be run from the browser console or as part of debugging.
 */

// import { supabase } from '@/integrations/supabase/client';
import { verifyAdminAccess, diagnoseAdminIssues } from './adminVerification';

/**
 * Test admin access for the currently logged-in user
 */
export async function testCurrentUserAdminAccess() {
  console.log('🧪 Testing admin access for current user...');
  
  try {
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ No authenticated user found:', error);
      return false;
    }
    
    console.log(`👤 Testing user: ${user.email} (ID: ${user.id})`);
    
    // Run comprehensive verification
    const result = await verifyAdminAccess();
    
    console.log('📊 Verification Results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Profile Exists: ${result.profileExists}`);
    console.log(`- Role: ${result.role}`);
    console.log(`- Is Admin: ${result.isAdmin}`);
    
    console.log('🔧 Method Results:');
    console.log(`- RPC is_admin: ${result.methods.rpcIsAdmin}`);
    console.log(`- RPC check_admin_access: ${result.methods.rpcCheckAdminAccess}`);
    console.log(`- Direct profile query: ${result.methods.directProfileQuery}`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors found:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    return result.success;
  } catch (error) {
    console.error('🚨 Test failed:', error);
    return false;
  }
}

/**
 * Test specific admin functions directly
 */
export async function testAdminFunctions() {
  console.log('🧪 Testing admin RPC functions directly...');
  
  const results = {
    is_admin: null as boolean | null,
    check_admin_access: null as boolean | null,
    profile_query: null as any,
  };
  
  // Test is_admin function
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('❌ is_admin RPC error:', error);
      results.is_admin = null;
    } else {
      console.log(`✅ is_admin RPC result: ${data}`);
      results.is_admin = data;
    }
  } catch (error) {
    console.error('❌ is_admin RPC exception:', error);
    results.is_admin = null;
  }
  
  // Test check_admin_access function
  try {
    const { data, error } = await supabase.rpc('check_admin_access');
    if (error) {
      console.error('❌ check_admin_access RPC error:', error);
      results.check_admin_access = null;
    } else {
      console.log(`✅ check_admin_access RPC result: ${data}`);
      results.check_admin_access = data;
    }
  } catch (error) {
    console.error('❌ check_admin_access RPC exception:', error);
    results.check_admin_access = null;
  }
  
  // Test direct profile query
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Profile query error:', error);
        results.profile_query = null;
      } else {
        console.log('✅ Profile query result:', profile);
        results.profile_query = profile;
      }
    }
  } catch (error) {
    console.error('❌ Profile query exception:', error);
    results.profile_query = null;
  }
  
  return results;
}

/**
 * Comprehensive admin access test
 */
export async function runComprehensiveAdminTest() {
  console.log('🚀 Starting comprehensive admin access test...');
  console.log('=====================================');
  
  // Test 1: Current user admin access
  console.log('\n📋 Test 1: Current User Admin Access');
  const userTestResult = await testCurrentUserAdminAccess();
  
  // Test 2: Direct function tests
  console.log('\n📋 Test 2: Direct Function Tests');
  const functionTestResults = await testAdminFunctions();
  
  // Test 3: Run diagnostics
  console.log('\n📋 Test 3: Diagnostic Analysis');
  await diagnoseAdminIssues();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`Overall Result: ${userTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`is_admin function: ${functionTestResults.is_admin === true ? '✅' : '❌'}`);
  console.log(`check_admin_access function: ${functionTestResults.check_admin_access === true ? '✅' : '❌'}`);
  console.log(`Profile query: ${functionTestResults.profile_query?.role === 'admin' ? '✅' : '❌'}`);
  
  return {
    success: userTestResult,
    functionTests: functionTestResults,
  };
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testAdminAccess = {
    testCurrentUser: testCurrentUserAdminAccess,
    testFunctions: testAdminFunctions,
    runComprehensive: runComprehensiveAdminTest,
  };
  
  console.log('🔧 Admin test utilities loaded. Use:');
  console.log('- window.testAdminAccess.testCurrentUser()');
  console.log('- window.testAdminAccess.testFunctions()');
  console.log('- window.testAdminAccess.runComprehensive()');
}