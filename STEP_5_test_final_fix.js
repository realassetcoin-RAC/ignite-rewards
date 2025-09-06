import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' }
});

async function testFinalFix() {
  console.log('🧪 Testing Final Fix Results...\n');
  
  // Test 1: Basic table access
  console.log('1. Testing subscription plans table access:');
  
  try {
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, price_monthly, is_active, created_at')
      .limit(5);
    
    if (plansError) {
      console.log('   ❌ Plans table error:', plansError.message);
      if (plansError.message.includes('permission denied')) {
        console.log('   🔧 Still need to apply STEP 4: RLS permissions fix');
      }
    } else {
      console.log('   ✅ Plans table accessible:', plans?.length || 0, 'records');
      if (plans && plans.length > 0) {
        console.log('   📋 Available plans:');
        plans.forEach(plan => {
          console.log(`      - ${plan.name}: $${plan.price_monthly} (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log('   ⚠️  No plans found - default plans may not have been inserted');
      }
    }
  } catch (error) {
    console.log('   ❌ Plans table exception:', error.message);
  }
  
  // Test 2: Profiles table access
  console.log('\n2. Testing profiles table access:');
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .limit(10);
    
    if (profilesError) {
      console.log('   ❌ Profiles table error:', profilesError.message);
    } else {
      console.log('   ✅ Profiles table accessible:', profiles?.length || 0, 'records');
      const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
      
      if (adminCount > 0) {
        console.log('   ✅ Admin users found:', adminCount);
        const adminUsers = profiles?.filter(p => p.role === 'admin') || [];
        adminUsers.forEach(admin => {
          console.log(`      - Admin: ${admin.email}`);
        });
      } else {
        console.log('   ❌ No admin users found - need to complete STEP 3: Admin user setup');
      }
    }
  } catch (error) {
    console.log('   ❌ Profiles table exception:', error.message);
  }
  
  // Test 3: Insert permissions (should show auth error, not permission error)
  console.log('\n3. Testing insert permissions:');
  
  try {
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .insert([{
        name: 'Test Plan - DELETE ME',
        description: 'This is a test plan',
        price_monthly: 9.99,
        is_active: false
      }])
      .select();
    
    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('   ❌ Still has permission issues - need to apply STEP 4');
      } else if (error.message.includes('Auth session missing') || error.message.includes('JWT') || error.message.includes('anonymous')) {
        console.log('   ✅ Permission error fixed - now just needs authentication');
        console.log('   📋 Error (expected):', error.message);
      } else {
        console.log('   ⚠️  Unexpected error:', error.message);
      }
    } else {
      console.log('   ⚠️  Insert succeeded without authentication - policies may be too permissive');
      console.log('   📋 Created:', data);
    }
  } catch (error) {
    console.log('   ❌ Insert exception:', error.message);
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('');
  
  // Determine next steps based on results
  const plansAccessible = await testTableAccess('merchant_subscription_plans');
  const profilesAccessible = await testTableAccess('profiles');
  const adminUsersExist = await checkAdminUsers();
  
  if (!plansAccessible) {
    console.log('❌ STEP 4 NEEDED: Apply RLS permissions fix');
    console.log('   File: /workspace/STEP_4_fix_rls_permissions.sql');
  } else {
    console.log('✅ Plans table permissions are working');
  }
  
  if (!adminUsersExist) {
    console.log('❌ STEP 3 NEEDED: Set up admin user');
    console.log('   File: /workspace/STEP_3_setup_admin_user.sql');
    console.log('   Remember to replace the email address!');
  } else {
    console.log('✅ Admin user is set up');
  }
  
  if (plansAccessible && adminUsersExist) {
    console.log('');
    console.log('🎉 ALL FIXES COMPLETE! Ready to test application:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Log out and log back in');
    console.log('   3. Navigate to Admin Dashboard → Plans tab');
    console.log('   4. Test creating/editing subscription plans');
  }
}

async function testTableAccess(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    return !error || !error.message.includes('permission denied');
  } catch {
    return false;
  }
}

async function checkAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('role', 'admin')
      .limit(1);
    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}

testFinalFix().catch(console.error);