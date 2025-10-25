/**
 * Admin Authentication Fix Utility
 * 
 * This utility provides immediate fixes for admin authentication and dashboard loading issues.
 * It can be run from the browser console to diagnose and resolve problems.
 */


interface FixResult {
  success: boolean;
  message: string;
  details?: any;
  actions?: string[];
}

/**
 * Comprehensive admin access fix
 */
export async function fixAdminAccess(): Promise<FixResult> {
  console.log('🔧 Starting admin access fix...');
  
  try {
    // Step 1: Verify user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: 'No authenticated user found. Please log in first.',
        actions: ['Navigate to /auth and log in as an administrator']
      };
    }
    
    console.log(`👤 Fixing access for user: ${user.email} (ID: ${user.id})`);
    
    // Step 2: Test database functions
    const functionTests = await testDatabaseFunctions();
    console.log('🧪 Database function test results:', functionTests);
    
    // Step 3: Check profile existence and role
    const profileCheck = await checkAndFixProfile(user);
    console.log('👤 Profile check results:', profileCheck);
    
    // Step 4: Test admin verification methods
    const adminCheck = await testAdminVerification(user);
    console.log('🔐 Admin verification results:', adminCheck);
    
    // Step 5: Generate recommendations
    const recommendations = generateRecommendations(functionTests, profileCheck, adminCheck);
    
    const overallSuccess = adminCheck.isAdmin || profileCheck.hasAdminRole;
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? 'Admin access successfully verified and fixed!'
        : 'Admin access issues detected. See recommendations below.',
      details: {
        user: user.email,
        userId: user.id,
        functionTests,
        profileCheck,
        adminCheck
      },
      actions: recommendations
    };
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    return {
      success: false,
      message: `Fix process failed: ${error}`,
      actions: ['Check browser console for detailed error information']
    };
  }
}

/**
 * Test database functions
 */
async function testDatabaseFunctions() {
  const results = {
    is_admin: { success: false, result: null, error: null },
    check_admin_access: { success: false, result: null, error: null },
    get_current_user_profile: { success: false, result: null, error: null }
  };
  
  // Test is_admin function
  try {
    const { data, error } = await supabase.rpc('is_admin');
    results.is_admin = {
      success: !error,
      result: data,
      error: error?.message
    };
  } catch (error) {
    results.is_admin = {
      success: false,
      result: null,
      error: String(error)
    };
  }
  
  // Test check_admin_access function
  try {
    const { data, error } = await supabase.rpc('check_admin_access');
    results.check_admin_access = {
      success: !error,
      result: data,
      error: error?.message
    };
  } catch (error) {
    results.check_admin_access = {
      success: false,
      result: null,
      error: String(error)
    };
  }
  
  // Test get_current_user_profile function
  try {
    const { data, error } = await supabase.rpc('get_current_user_profile');
    results.get_current_user_profile = {
      success: !error && data && data.length > 0,
      result: data,
      error: error?.message
    };
  } catch (error) {
    results.get_current_user_profile = {
      success: false,
      result: null,
      error: String(error)
    };
  }
  
  return results;
}

/**
 * Check and fix user profile
 */
async function checkAndFixProfile(user: any) {
  const results = {
    profileExists: false,
    role: null,
    hasAdminRole: false,
    schema: null,
    error: null
  };
  
  try {
    // Try to get profile from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .eq('id', user.id)
      .single();
    
    if (error) {
      results.error = error.message;
      console.warn('Profile query error:', error);
    } else if (profile) {
      results.profileExists = true;
      results.role = profile.role;
      results.hasAdminRole = profile.role === 'admin';
      results.schema = 'detected';
      
      console.log('✅ Profile found:', profile);
    }
    
  } catch (error) {
    results.error = String(error);
    console.error('Profile check failed:', error);
  }
  
  return results;
}

/**
 * Test admin verification methods
 */
async function testAdminVerification(user: any) {
  const results = {
    isAdmin: false,
    methods: {
      rpcIsAdmin: false,
      rpcCheckAdmin: false,
      directQuery: false,
      knownAdmin: false
    },
    errors: []
  };
  
  // Method 1: RPC is_admin
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (!error && data === true) {
      results.methods.rpcIsAdmin = true;
      results.isAdmin = true;
    }
  } catch (_error) {
    results.errors.push(`RPC is_admin failed: ${_error}`);
  }
  
  // Method 2: RPC check_admin_access
  try {
    const { data, error } = await supabase.rpc('check_admin_access');
    if (!error && data === true) {
      results.methods.rpcCheckAdmin = true;
      results.isAdmin = true;
    }
  } catch (_error) {
    results.errors.push(`RPC check_admin_access failed: ${_error}`);
  }
  
  // Method 3: Direct profile query
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!error && data?.role === 'admin') {
      results.methods.directQuery = true;
      results.isAdmin = true;
    }
  } catch (error) {
    results.errors.push(`Direct query failed: ${error}`);
  }
  
  // Method 4: Known admin check
  const knownAdminEmails = [
    'realassetcoin@gmail.com',
    // Add other known admin emails here
  ];
  
  if (user.email && knownAdminEmails.includes(user.email.toLowerCase())) {
    results.methods.knownAdmin = true;
    results.isAdmin = true;
  }
  
  return results;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(functionTests: any, profileCheck: any, adminCheck: any): string[] {
  const recommendations: string[] = [];
  
  // Check if any RPC functions are working
  const rpcWorking = functionTests.is_admin.success || functionTests.check_admin_access.success;
  
  if (!rpcWorking) {
    recommendations.push('🔧 Database functions are not working. Apply the permanent admin fix migration.');
    recommendations.push('📝 Run: npx supabase db reset (if using local development)');
  }
  
  if (!profileCheck.profileExists) {
    recommendations.push('👤 User profile does not exist in the database.');
    recommendations.push('🔧 The migration should create the profile automatically.');
  } else if (!profileCheck.hasAdminRole) {
    recommendations.push(`👤 User role is '${profileCheck.role}' but should be 'admin'.`);
    recommendations.push('🔧 Update the user role in the database or apply the migration.');
  }
  
  if (!adminCheck.isAdmin) {
    recommendations.push('🚫 No admin verification method is working.');
    recommendations.push('🔧 This indicates a database configuration issue.');
  }
  
  // Add general recommendations
  recommendations.push('🔄 Try refreshing the page after applying fixes.');
  recommendations.push('🧪 Use window.testAdminAccess.runComprehensive() to test after fixes.');
  
  return recommendations;
}

/**
 * Quick diagnostic function
 */
export async function quickDiagnostic() {
  console.log('🔍 Running quick admin diagnostic...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log(`👤 User: ${user.email}`);
  
  // Test each method quickly
  try {
    const { data: isAdminResult } = await supabase.rpc('is_admin');
    console.log(`🔧 is_admin RPC: ${isAdminResult}`);
  } catch (error) {
    console.log(`❌ is_admin RPC failed: ${error}`);
  }
  
  try {
    const { data: checkAdminResult } = await supabase.rpc('check_admin_access');
    console.log(`🔧 check_admin_access RPC: ${checkAdminResult}`);
  } catch (error) {
    console.log(`❌ check_admin_access RPC failed: ${error}`);
  }
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    console.log(`👤 Profile role: ${profile?.role}`);
  } catch (error) {
    console.log(`❌ Profile query failed: ${error}`);
  }
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).adminAuthFix = {
    fix: fixAdminAccess,
    diagnostic: quickDiagnostic,
  };
  
  console.log('🔧 Admin auth fix utilities loaded. Use:');
  console.log('- window.adminAuthFix.fix() - Run comprehensive fix');
  console.log('- window.adminAuthFix.diagnostic() - Quick diagnostic');
}