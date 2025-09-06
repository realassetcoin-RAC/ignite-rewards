#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'api'
  }
});

console.log('🧪 Verifying Shops Tab (Subscription Plans) Fix');
console.log('===============================================\n');

async function verifyFix() {
  try {
    console.log('📋 Step 1: Testing subscription plans access...');
    
    // Test if we can access the subscription plans table
    const { data: plans, error } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ FAILED: Still getting permission error');
      console.log(`   Error: ${error.message}`);
      console.log('\n🔧 Next Steps:');
      console.log('   1. Apply the SQL fix in your Supabase Dashboard');
      console.log('   2. Use the contents of: MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
      console.log('   3. Make sure your user has role = "admin" in api.profiles table');
      return false;
    }
    
    console.log('✅ SUCCESS: Can access subscription plans table');
    console.log(`   Found ${plans.length} subscription plans`);
    
    if (plans.length > 0) {
      console.log('\n📊 Available Plans:');
      plans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.name} - $${plan.price_monthly}/month (${plan.is_active ? 'Active' : 'Inactive'})`);
      });
    } else {
      console.log('⚠️  No subscription plans found - you may need to create some');
    }
    
    console.log('\n🎉 SHOPS TAB FIX VERIFICATION: SUCCESS!');
    console.log('   The admin dashboard "Plans" tab should now work correctly.');
    
    return true;
    
  } catch (error) {
    console.log('❌ FAILED: Unexpected error during verification');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run the verification
verifyFix().then(success => {
  if (!success) {
    console.log('\n📋 Troubleshooting Guide:');
    console.log('   1. Check if you applied the SQL fix in Supabase Dashboard');
    console.log('   2. Verify your user has admin role: UPDATE api.profiles SET role = \'admin\' WHERE email = \'your-email\';');
    console.log('   3. Clear browser cache and log in again');
    console.log('   4. Check the SHOPS_TAB_PERMISSION_ERROR_SOLUTION.md file for detailed instructions');
  }
  
  process.exit(success ? 0 : 1);
});