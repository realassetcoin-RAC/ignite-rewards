import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' }
});

async function testPermissionFix() {
  console.log('🧪 Testing Permission Fix Results...\n');
  
  // Test 1: Basic table access
  console.log('1. Testing basic table access:');
  
  try {
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, price_monthly, is_active')
      .limit(5);
    
    if (plansError) {
      console.log('   ❌ Plans table error:', plansError.message);
      console.log('   📋 Error details:', plansError);
    } else {
      console.log('   ✅ Plans table accessible:', plans?.length || 0, 'records');
      if (plans && plans.length > 0) {
        console.log('   📋 Sample plans:');
        plans.forEach(plan => {
          console.log(`      - ${plan.name}: $${plan.price_monthly} (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
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
      .select('id, email, role')
      .limit(5);
    
    if (profilesError) {
      console.log('   ❌ Profiles table error:', profilesError.message);
    } else {
      console.log('   ✅ Profiles table accessible:', profiles?.length || 0, 'records');
      const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
      console.log('   👑 Admin users found:', adminCount);
    }
  } catch (error) {
    console.log('   ❌ Profiles table exception:', error.message);
  }
  
  // Test 3: Try to insert a test plan (this will fail without authentication, but should show different error)
  console.log('\n3. Testing insert permissions (will fail without auth, but should show auth error, not permission error):');
  
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
      console.log('   ⚠️  Insert error (expected):', error.message);
      if (error.message.includes('permission denied')) {
        console.log('   ❌ Still has permission issues - RLS policies may not be working');
      } else if (error.message.includes('Auth session missing') || error.message.includes('JWT')) {
        console.log('   ✅ Permission error fixed - now just needs authentication');
      }
    } else {
      console.log('   ✅ Insert succeeded:', data);
      console.log('   ⚠️  This should not happen without authentication - policies may be too permissive');
    }
  } catch (error) {
    console.log('   ❌ Insert exception:', error.message);
  }
  
  // Test 4: Authentication state
  console.log('\n4. Testing authentication:');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('   ❌ Auth error:', userError.message);
    } else if (!user) {
      console.log('   ⚠️  No authenticated user (expected for anonymous test)');
    } else {
      console.log('   ✅ Authenticated user:', user.email);
    }
  } catch (error) {
    console.log('   ❌ Auth exception:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('✅ If plans table is accessible: Permission fix worked');
  console.log('⚠️  If insert shows auth error (not permission error): RLS is working correctly');
  console.log('❌ If still getting permission denied: Need to apply the fix SQL script');
  console.log('\n🔧 Next step: If this test passes, try the admin dashboard Plans tab');
}

testPermissionFix().catch(console.error);