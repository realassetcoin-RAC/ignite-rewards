import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Test both schema configurations
const supabaseDefault = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseApiSchema = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' }
});

async function testCurrentState() {
  console.log('🔍 Testing Current Database State...\n');
  
  // Test 1: Check profiles table access (used by AdminDashboard)
  console.log('1. Testing profiles table access (AdminDashboard auth):');
  
  try {
    const { data: profilesDefault, error: profilesDefaultError } = await supabaseDefault
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profilesDefaultError) {
      console.log('   ❌ Default schema profiles error:', profilesDefaultError.message);
    } else {
      console.log('   ✅ Default schema profiles accessible:', profilesDefault?.length || 0, 'records');
    }
  } catch (error) {
    console.log('   ❌ Default schema profiles exception:', error.message);
  }
  
  try {
    const { data: profilesApi, error: profilesApiError } = await supabaseApiSchema
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profilesApiError) {
      console.log('   ❌ API schema profiles error:', profilesApiError.message);
    } else {
      console.log('   ✅ API schema profiles accessible:', profilesApi?.length || 0, 'records');
    }
  } catch (error) {
    console.log('   ❌ API schema profiles exception:', error.message);
  }
  
  // Test 2: Check merchant_subscription_plans access (used by SubscriptionPlanManager)
  console.log('\n2. Testing merchant_subscription_plans access (SubscriptionPlanManager):');
  
  try {
    const { data: plansDefault, error: plansDefaultError } = await supabaseDefault
      .from('merchant_subscription_plans')
      .select('*')
      .limit(1);
    
    if (plansDefaultError) {
      console.log('   ❌ Default schema plans error:', plansDefaultError.message);
    } else {
      console.log('   ✅ Default schema plans accessible:', plansDefault?.length || 0, 'records');
    }
  } catch (error) {
    console.log('   ❌ Default schema plans exception:', error.message);
  }
  
  try {
    const { data: plansApi, error: plansApiError } = await supabaseApiSchema
      .from('merchant_subscription_plans')
      .select('*')
      .limit(1);
    
    if (plansApiError) {
      console.log('   ❌ API schema plans error:', plansApiError.message);
    } else {
      console.log('   ✅ API schema plans accessible:', plansApi?.length || 0, 'records');
      if (plansApi && plansApi.length > 0) {
        console.log('   📋 Sample plan:', plansApi[0].name, '-', plansApi[0].price_monthly);
      }
    }
  } catch (error) {
    console.log('   ❌ API schema plans exception:', error.message);
  }
  
  // Test 3: Check if we can authenticate and get user
  console.log('\n3. Testing authentication state:');
  
  try {
    const { data: { user }, error: userError } = await supabaseApiSchema.auth.getUser();
    
    if (userError) {
      console.log('   ❌ Auth error:', userError.message);
    } else if (!user) {
      console.log('   ⚠️  No authenticated user (expected for this test)');
    } else {
      console.log('   ✅ Authenticated user:', user.email);
      
      // Try to get profile for authenticated user
      const { data: userProfile, error: profileError } = await supabaseApiSchema
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.log('   ❌ User profile error:', profileError.message);
      } else {
        console.log('   ✅ User profile found:', userProfile?.email, 'role:', userProfile?.role);
      }
    }
  } catch (error) {
    console.log('   ❌ Auth exception:', error.message);
  }
  
  // Test 4: Test different table access patterns
  console.log('\n4. Testing table access patterns:');
  
  const testTables = [
    { table: 'profiles', schema: 'default' },
    { table: 'profiles', schema: 'api' },
    { table: 'merchant_subscription_plans', schema: 'default' },
    { table: 'merchant_subscription_plans', schema: 'api' }
  ];
  
  for (const test of testTables) {
    const client = test.schema === 'api' ? supabaseApiSchema : supabaseDefault;
    try {
      const { data, error } = await client
        .from(test.table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`   ❌ ${test.schema}.${test.table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${test.schema}.${test.table}: ${data?.length || 0} records accessible`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.schema}.${test.table}: Exception - ${error.message}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('The AdminDashboard checks profiles table for admin role.');
  console.log('The SubscriptionPlanManager uses API schema client to access merchant_subscription_plans.');
  console.log('Both need to work with the same schema and have proper permissions.');
  console.log('\n🔍 Check the results above to identify the mismatch.');
}

testCurrentState().catch(console.error);