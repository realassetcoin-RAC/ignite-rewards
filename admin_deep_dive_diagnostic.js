/**
 * Admin Panel Deep Dive Diagnostic Script
 * 
 * This script provides comprehensive diagnostics for admin panel loading issues.
 * Run this in the browser console after logging in to get detailed information.
 */

// Wait for the page to load and Supabase to be available
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabase) {
      resolve(window.supabase);
    } else {
      const checkInterval = setInterval(() => {
        if (window.supabase) {
          clearInterval(checkInterval);
          resolve(window.supabase);
        }
      }, 100);
    }
  });
}

async function runDeepDiveDiagnostic() {
  console.log('🔍 Starting Admin Panel Deep Dive Diagnostic...');
  console.log('=' .repeat(60));
  
  const supabase = await waitForSupabase();
  
  // 1. Check authentication state
  console.log('\n📋 1. AUTHENTICATION STATE');
  console.log('-'.repeat(30));
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('❌ User fetch error:', userError);
  } else if (user) {
    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Created:', user.created_at);
    console.log('   Last sign in:', user.last_sign_in_at);
  } else {
    console.log('❌ No authenticated user found');
    return;
  }
  
  // 2. Test database functions
  console.log('\n🔧 2. DATABASE FUNCTIONS TEST');
  console.log('-'.repeat(30));
  
  const functionTests = {
    is_admin: null,
    check_admin_access: null,
    get_current_user_profile: null
  };
  
  // Test is_admin function
  try {
    const { data, error } = await supabase.rpc('is_admin');
    functionTests.is_admin = { success: !error, data, error: error?.message };
    console.log('is_admin RPC:', functionTests.is_admin.success ? '✅' : '❌', functionTests.is_admin);
  } catch (error) {
    functionTests.is_admin = { success: false, data: null, error: String(error) };
    console.log('is_admin RPC: ❌ Exception:', error);
  }
  
  // Test check_admin_access function
  try {
    const { data, error } = await supabase.rpc('check_admin_access');
    functionTests.check_admin_access = { success: !error, data, error: error?.message };
    console.log('check_admin_access RPC:', functionTests.check_admin_access.success ? '✅' : '❌', functionTests.check_admin_access);
  } catch (error) {
    functionTests.check_admin_access = { success: false, data: null, error: String(error) };
    console.log('check_admin_access RPC: ❌ Exception:', error);
  }
  
  // Test get_current_user_profile function
  try {
    const { data, error } = await supabase.rpc('get_current_user_profile');
    functionTests.get_current_user_profile = { success: !error && data && data.length > 0, data, error: error?.message };
    console.log('get_current_user_profile RPC:', functionTests.get_current_user_profile.success ? '✅' : '❌', functionTests.get_current_user_profile);
  } catch (error) {
    functionTests.get_current_user_profile = { success: false, data: null, error: String(error) };
    console.log('get_current_user_profile RPC: ❌ Exception:', error);
  }
  
  // 3. Test direct profile queries
  console.log('\n👤 3. PROFILE QUERIES TEST');
  console.log('-'.repeat(30));
  
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile query error:', profileError.message);
      console.log('   Error code:', profileError.code);
      console.log('   Error details:', profileError.details);
    } else if (profile) {
      console.log('✅ Profile found:', profile);
      console.log('   Role:', profile.role);
      console.log('   Email:', profile.email);
      console.log('   Full name:', profile.full_name);
    } else {
      console.log('❌ No profile found for user');
    }
  } catch (error) {
    console.log('❌ Profile query exception:', error);
  }
  
  // 4. Test admin verification methods
  console.log('\n🔐 4. ADMIN VERIFICATION METHODS');
  console.log('-'.repeat(30));
  
  const adminMethods = {
    rpcIsAdmin: false,
    rpcCheckAdmin: false,
    directQuery: false,
    knownAdmin: false
  };
  
  // Method 1: RPC is_admin
  if (functionTests.is_admin?.success && functionTests.is_admin.data === true) {
    adminMethods.rpcIsAdmin = true;
    console.log('✅ RPC is_admin method: SUCCESS');
  } else {
    console.log('❌ RPC is_admin method: FAILED');
  }
  
  // Method 2: RPC check_admin_access
  if (functionTests.check_admin_access?.success && functionTests.check_admin_access.data === true) {
    adminMethods.rpcCheckAdmin = true;
    console.log('✅ RPC check_admin_access method: SUCCESS');
  } else {
    console.log('❌ RPC check_admin_access method: FAILED');
  }
  
  // Method 3: Direct profile query
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!error && profile?.role === 'admin') {
      adminMethods.directQuery = true;
      console.log('✅ Direct profile query method: SUCCESS');
    } else {
      console.log('❌ Direct profile query method: FAILED');
    }
  } catch (error) {
    console.log('❌ Direct profile query method: EXCEPTION');
  }
  
  // Method 4: Known admin check
  const knownAdminEmails = ['realassetcoin@gmail.com'];
  if (user.email && knownAdminEmails.includes(user.email.toLowerCase())) {
    adminMethods.knownAdmin = true;
    console.log('✅ Known admin email method: SUCCESS');
  } else {
    console.log('❌ Known admin email method: FAILED');
  }
  
  // 5. Check application state
  console.log('\n📱 5. APPLICATION STATE');
  console.log('-'.repeat(30));
  
  // Check if React components are loaded
  if (window.React) {
    console.log('✅ React is loaded');
  } else {
    console.log('❌ React is not loaded');
  }
  
  // Check if admin utilities are available
  if (window.adminAuthFix) {
    console.log('✅ Admin auth fix utilities are loaded');
  } else {
    console.log('❌ Admin auth fix utilities are not loaded');
  }
  
  if (window.testAdminAccess) {
    console.log('✅ Test admin access utilities are loaded');
  } else {
    console.log('❌ Test admin access utilities are not loaded');
  }
  
  // Check current URL and routing
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  // 6. Generate recommendations
  console.log('\n💡 6. RECOMMENDATIONS');
  console.log('-'.repeat(30));
  
  const recommendations = [];
  
  if (!adminMethods.rpcIsAdmin && !adminMethods.rpcCheckAdmin) {
    recommendations.push('🔧 Database RPC functions are not working. Apply the consolidated database fix.');
  }
  
  if (!adminMethods.directQuery) {
    recommendations.push('👤 User profile does not exist or role is not admin. Check database.');
  }
  
  if (!adminMethods.knownAdmin) {
    recommendations.push('📧 User email is not in known admin list. Verify admin email.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All admin verification methods are working. Issue may be in frontend routing.');
  }
  
  recommendations.forEach(rec => console.log(rec));
  
  // 7. Summary
  console.log('\n📊 7. DIAGNOSTIC SUMMARY');
  console.log('-'.repeat(30));
  
  const workingMethods = Object.values(adminMethods).filter(Boolean).length;
  const totalMethods = Object.keys(adminMethods).length;
  
  console.log(`Working admin methods: ${workingMethods}/${totalMethods}`);
  console.log(`Database functions working: ${Object.values(functionTests).filter(t => t?.success).length}/${Object.keys(functionTests).length}`);
  
  if (workingMethods === 0) {
    console.log('🚨 CRITICAL: No admin verification methods are working');
    console.log('   This indicates a database configuration issue');
  } else if (workingMethods < totalMethods) {
    console.log('⚠️  PARTIAL: Some admin verification methods are working');
    console.log('   This may cause inconsistent behavior');
  } else {
    console.log('✅ ALL: All admin verification methods are working');
    console.log('   Issue is likely in frontend routing or component logic');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Deep dive diagnostic complete');
  
  return {
    user,
    functionTests,
    adminMethods,
    recommendations,
    summary: {
      workingMethods,
      totalMethods,
      status: workingMethods === 0 ? 'CRITICAL' : workingMethods < totalMethods ? 'PARTIAL' : 'ALL'
    }
  };
}

// Make the function available globally
window.runDeepDiveDiagnostic = runDeepDiveDiagnostic;

console.log('🔧 Admin deep dive diagnostic loaded. Use:');
console.log('- window.runDeepDiveDiagnostic() - Run comprehensive diagnostic');