import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' }
});

async function testFrontendPlansLoading() {
  console.log('🧪 Testing Frontend Plans Loading...\n');
  
  // Test 1: Load all plans (what admin sees)
  console.log('1. Testing ALL plans (admin view):');
  try {
    const { data: allPlans, error: allError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });
    
    if (allError) {
      console.log('   ❌ All plans error:', allError.message);
    } else {
      console.log('   ✅ All plans loaded:', allPlans?.length || 0);
      allPlans?.forEach(plan => {
        console.log(`      - ${plan.name}: $${plan.price_monthly} (${plan.is_active ? 'Active' : 'Inactive'})`);
      });
    }
  } catch (error) {
    console.log('   ❌ All plans exception:', error.message);
  }
  
  // Test 2: Load only active plans (what frontend should see)
  console.log('\n2. Testing ACTIVE plans only (frontend view):');
  try {
    const { data: activePlans, error: activeError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    
    if (activeError) {
      console.log('   ❌ Active plans error:', activeError.message);
      console.log('   📋 Error details:', {
        message: activeError.message,
        code: activeError.code,
        details: activeError.details,
        hint: activeError.hint
      });
    } else {
      console.log('   ✅ Active plans loaded:', activePlans?.length || 0);
      if (activePlans && activePlans.length > 0) {
        console.log('   📋 Plans that should appear on frontend:');
        activePlans.forEach((plan, index) => {
          console.log(`      ${index + 1}. ${plan.name}: $${plan.price_monthly} (Active: ${plan.is_active})`);
          console.log(`         Description: ${plan.description || 'No description'}`);
          console.log(`         Features: ${JSON.stringify(plan.features)}`);
          console.log(`         Trial: ${plan.trial_days || 0} days`);
          console.log(`         Created: ${plan.created_at}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ No active plans found - this is why frontend is empty!');
      }
    }
  } catch (error) {
    console.log('   ❌ Active plans exception:', error.message);
  }
  
  // Test 3: Test what the frontend query exactly matches
  console.log('3. Testing exact frontend query simulation:');
  try {
    console.log('   Query: SELECT * FROM merchant_subscription_plans WHERE is_active = true ORDER BY price_monthly ASC');
    
    const { data: frontendPlans, error: frontendError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, description, price_monthly, features, trial_days, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    
    if (frontendError) {
      console.log('   ❌ Frontend query error:', frontendError.message);
    } else {
      console.log('   ✅ Frontend query success:', frontendPlans?.length || 0, 'plans');
      console.log('   📋 This is exactly what the frontend should receive:', frontendPlans);
    }
  } catch (error) {
    console.log('   ❌ Frontend query exception:', error.message);
  }
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('If you see plans in test 1 but not test 2:');
  console.log('  → Your new plan might have is_active = false');
  console.log('  → Check the admin Shops tab and ensure the plan is marked as Active');
  console.log('');
  console.log('If you see no plans in test 1:');
  console.log('  → The plans weren\'t created properly in the database');
  console.log('  → Try creating the plan again in admin');
  console.log('');
  console.log('If you see plans in both tests but frontend doesn\'t show them:');
  console.log('  → There might be a caching issue or frontend error');
  console.log('  → Check browser console when opening Join as Merchant modal');
}

testFrontendPlansLoading().catch(console.error);