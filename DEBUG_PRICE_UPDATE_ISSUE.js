// Debug Price Update Issue
// This script will test the specific price update operation to see what's happening

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPriceUpdateIssue() {
  console.log('🔍 Debugging Price Update Issue...\n');

  // Step 1: Find the StartUp plan
  console.log('1️⃣ Finding the StartUp plan...');
  try {
    const { data: startupPlan, error: findError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .eq('plan_name', 'StartUp')
      .single();

    if (findError) {
      console.error('❌ Error finding StartUp plan:', findError);
      return;
    }

    console.log('✅ StartUp plan found:');
    console.log(`   ID: ${startupPlan.id}`);
    console.log(`   Plan Name: ${startupPlan.plan_name}`);
    console.log(`   Current Price: ${startupPlan.price}`);
    console.log(`   Current Price Monthly: ${startupPlan.price_monthly}`);
    console.log(`   Current Price Yearly: ${startupPlan.price_yearly}`);
    console.log(`   Updated At: ${startupPlan.updated_at}`);

    // Step 2: Test the exact update operation that the frontend is doing
    console.log('\n2️⃣ Testing the exact update operation...');
    const testPayload = {
      plan_name: startupPlan.plan_name,
      description: startupPlan.description,
      price_monthly: 20, // The value you're trying to set
      price_yearly: startupPlan.price_yearly,
      monthly_points: startupPlan.monthly_points || 0,
      monthly_transactions: startupPlan.monthly_transactions || 0,
      features: startupPlan.features,
      trial_days: startupPlan.trial_days || 0,
      is_active: startupPlan.is_active,
      popular: startupPlan.popular,
      plan_number: startupPlan.plan_number,
      valid_from: startupPlan.valid_from,
      valid_until: startupPlan.valid_until,
    };

    console.log('📊 Payload being sent:');
    console.log(JSON.stringify(testPayload, null, 2));

    const { data: updateResult, error: updateError } = await supabase
      .from('merchant_subscription_plans')
      .update(testPayload)
      .eq('id', startupPlan.id)
      .select();

    if (updateError) {
      console.error('❌ Update operation failed:', updateError);
      console.error('Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Update operation completed');
      console.log('📊 Update result:', updateResult);
    }

    // Step 3: Check the data after update
    console.log('\n3️⃣ Checking data after update...');
    const { data: updatedPlan, error: checkError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .eq('id', startupPlan.id)
      .single();

    if (checkError) {
      console.error('❌ Error checking updated plan:', checkError);
    } else {
      console.log('📊 Plan after update:');
      console.log(`   Price: ${updatedPlan.price}`);
      console.log(`   Price Monthly: ${updatedPlan.price_monthly}`);
      console.log(`   Price Yearly: ${updatedPlan.price_yearly}`);
      console.log(`   Updated At: ${updatedPlan.updated_at}`);
      
      if (updatedPlan.price_monthly === 20) {
        console.log('✅ SUCCESS: Price was updated to $20!');
      } else {
        console.log('❌ ISSUE: Price was NOT updated to $20');
        console.log(`   Expected: 20, Actual: ${updatedPlan.price_monthly}`);
      }
    }

    // Step 4: Test with a simpler update
    console.log('\n4️⃣ Testing with a simpler update...');
    const { error: simpleUpdateError } = await supabase
      .from('merchant_subscription_plans')
      .update({ price_monthly: 25 })
      .eq('id', startupPlan.id);

    if (simpleUpdateError) {
      console.error('❌ Simple update failed:', simpleUpdateError);
    } else {
      console.log('✅ Simple update completed');
      
      // Check the result
      const { data: simpleResult, error: simpleCheckError } = await supabase
        .from('merchant_subscription_plans')
        .select('price_monthly')
        .eq('id', startupPlan.id)
        .single();

      if (simpleCheckError) {
        console.error('❌ Error checking simple update:', simpleCheckError);
      } else {
        console.log(`📊 Price after simple update: ${simpleResult.price_monthly}`);
      }
    }

    // Step 5: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .rpc('get_table_policies', { table_name: 'merchant_subscription_plans' });

      if (policyError) {
        console.log('ℹ️  RPC function not available, checking via query...');
        // Alternative check - try to see if we can update
        const { error: testUpdateError } = await supabase
          .from('merchant_subscription_plans')
          .update({ description: 'RLS test' })
          .eq('id', startupPlan.id);

        if (testUpdateError) {
          console.error('❌ RLS might be blocking updates:', testUpdateError);
        } else {
          console.log('✅ RLS allows updates');
        }
      } else {
        console.log('📊 RLS Policies:', policies);
      }
    } catch (error) {
      console.error('❌ Error checking RLS policies:', error);
    }

  } catch (error) {
    console.error('❌ Exception during debugging:', error);
  }

  console.log('\n🎯 Analysis:');
  console.log('- If the update operation fails, we have an RLS or permission issue');
  console.log('- If the update succeeds but the value doesn\'t change, there might be a trigger or constraint');
  console.log('- If the update succeeds and the value changes, the issue is in the frontend form loading');
}

// Run the debug
debugPriceUpdateIssue().catch(console.error);
