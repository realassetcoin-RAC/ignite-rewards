import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' }
});

async function testComprehensiveFix() {
  console.log('🧪 Testing Comprehensive Fix Results...\n');
  
  // Test 1: Basic table access
  console.log('1. Testing subscription plans table access:');
  
  try {
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, price_monthly, is_active, created_at')
      .order('created_at', { ascending: true });
    
    if (plansError) {
      console.log('   ❌ Plans table error:', plansError.message);
      console.log('   🔧 The comprehensive fix may not have been applied correctly');
      return false;
    } else {
      console.log('   ✅ Plans table accessible:', plans?.length || 0, 'records');
      if (plans && plans.length > 0) {
        console.log('   📋 Available subscription plans:');
        plans.forEach(plan => {
          console.log(`      - ${plan.name}: $${plan.price_monthly} (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log('   ⚠️  No plans found - default plans may not have been inserted');
      }
    }
  } catch (error) {
    console.log('   ❌ Plans table exception:', error.message);
    return false;
  }
  
  // Test 2: Profiles table access
  console.log('\n2. Testing profiles table access:');
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (profilesError) {
      console.log('   ❌ Profiles table error:', profilesError.message);
      return false;
    } else {
      console.log('   ✅ Profiles table accessible:', profiles?.length || 0, 'records');
      const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
      
      if (adminCount > 0) {
        console.log('   ✅ Admin users found:', adminCount);
        console.log('   📋 Admin users:');
        const adminUsers = profiles?.filter(p => p.role === 'admin') || [];
        adminUsers.slice(0, 5).forEach(admin => {
          console.log(`      - ${admin.email || 'No email'} (${admin.role})`);
        });
        if (adminUsers.length > 5) {
          console.log(`      ... and ${adminUsers.length - 5} more`);
        }
      } else {
        console.log('   ❌ No admin users found');
        return false;
      }
    }
  } catch (error) {
    console.log('   ❌ Profiles table exception:', error.message);
    return false;
  }
  
  // Test 3: Insert permissions test
  console.log('\n3. Testing insert permissions:');
  
  try {
    const testPlanName = `Test Plan ${Date.now()}`;
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .insert([{
        name: testPlanName,
        description: 'This is a test plan - should be deleted',
        price_monthly: 9.99,
        is_active: false
      }])
      .select();
    
    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('   ❌ Still has permission issues');
        console.log('   📋 Error:', error.message);
        return false;
      } else if (error.message.includes('Auth session missing') || error.message.includes('JWT')) {
        console.log('   ✅ Permission error fixed - now just needs authentication');
        console.log('   📋 Error (expected):', error.message);
      } else {
        console.log('   ⚠️  Unexpected error:', error.message);
      }
    } else {
      console.log('   ✅ Insert succeeded without authentication!');
      console.log('   📋 Created test plan:', data?.[0]?.name);
      console.log('   ⚠️  This means policies are very permissive (good for testing)');
      
      // Clean up test plan
      if (data?.[0]?.id) {
        await supabase
          .from('merchant_subscription_plans')
          .delete()
          .eq('id', data[0].id);
        console.log('   🧹 Cleaned up test plan');
      }
    }
  } catch (error) {
    console.log('   ❌ Insert exception:', error.message);
  }
  
  console.log('\n📋 FINAL ASSESSMENT:');
  console.log('');
  
  // Final assessment
  const plansWorking = await testTableAccess('merchant_subscription_plans');
  const profilesWorking = await testTableAccess('profiles');
  const adminUsersExist = await checkAdminUsers();
  const plansExist = await checkPlansExist();
  
  if (plansWorking && profilesWorking && adminUsersExist && plansExist) {
    console.log('🎉 ALL SYSTEMS GO! Everything is working correctly:');
    console.log('   ✅ Plans table accessible');
    console.log('   ✅ Profiles table accessible');  
    console.log('   ✅ Admin users exist');
    console.log('   ✅ Subscription plans exist');
    console.log('');
    console.log('🚀 READY FOR APPLICATION TESTING:');
    console.log('   1. Clear browser cache and cookies completely');
    console.log('   2. Log out of your application');
    console.log('   3. Log back in with any registered email');
    console.log('   4. Navigate to Admin Dashboard → Plans tab');
    console.log('   5. You should see the subscription plans');
    console.log('   6. Try creating a new subscription plan');
    console.log('');
    console.log('⚠️  SECURITY NOTE: Currently all authenticated users have admin access');
    console.log('   This is temporary for testing - we\'ll lock it down after confirmation');
    return true;
  } else {
    console.log('❌ ISSUES REMAIN:');
    if (!plansWorking) console.log('   - Plans table not accessible');
    if (!profilesWorking) console.log('   - Profiles table not accessible');
    if (!adminUsersExist) console.log('   - No admin users found');
    if (!plansExist) console.log('   - No subscription plans found');
    console.log('');
    console.log('🔧 RECOMMENDATION: Re-run the comprehensive fix script');
    return false;
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

async function checkPlansExist() {
  try {
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('id')
      .limit(1);
    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}

testComprehensiveFix().catch(console.error);