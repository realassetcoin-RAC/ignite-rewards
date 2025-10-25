// Debug Subscription Plans Loading Issue
// This script will help identify why the subscription plans are stuck on "Loading plans..."

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSubscriptionLoading() {
  console.log('🔍 Debugging Subscription Plans Loading Issue...\n');

  try {
    // 1. Test direct Supabase query
    console.log('1️⃣ Testing direct Supabase query...');
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });
    
    if (error) {
      console.log('❌ Direct Supabase query failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
      
      // Check if it's a permission issue
      if (error.message.includes('permission denied') || error.message.includes('JWT')) {
        console.log('🔐 This appears to be a permission/authentication issue');
        console.log('   The admin user may not have proper permissions to read the table');
      }
      
      // Check if it's a schema issue
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('🗃️ The merchant_subscription_plans table does not exist');
        console.log('   This would cause the loading to hang indefinitely');
      }
      
      return;
    }
    
    console.log('✅ Direct Supabase query successful');
    console.log(`📊 Found ${data?.length || 0} subscription plans`);
    
    if (data && data.length > 0) {
      console.log('📋 Plans found:');
      data.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.plan_name} - $${plan.price_monthly}/mo`);
      });
    }

    // 2. Test with different query patterns
    console.log('\n2️⃣ Testing different query patterns...');
    
    // Test without order
    const { data: data2, error: error2 } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, price_monthly, is_active');
    
    if (error2) {
      console.log('❌ Simple query failed:', error2.message);
    } else {
      console.log('✅ Simple query successful:', data2?.length || 0, 'plans');
    }

    // 3. Check table permissions
    console.log('\n3️⃣ Checking table permissions...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'merchant_subscription_plans');
    
    if (tableError) {
      console.log('❌ Cannot check table info:', tableError.message);
    } else {
      console.log('📋 Table info:', tableInfo);
    }

    // 4. Test with RLS policies
    console.log('\n4️⃣ Testing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'merchant_subscription_plans');
    
    if (policyError) {
      console.log('❌ Cannot check RLS policies:', policyError.message);
    } else {
      console.log('🔒 RLS policies:', policies);
    }

    // 5. Summary and recommendations
    console.log('\n📋 Summary and Recommendations:');
    console.log('================================');
    
    if (error) {
      console.log('❌ ISSUE: Database query is failing');
      console.log('   SOLUTION: Fix the database query or permissions');
      
      if (error.message.includes('permission denied')) {
        console.log('   - Check RLS policies on merchant_subscription_plans table');
        console.log('   - Ensure the admin user has proper permissions');
        console.log('   - Consider using service role key for admin operations');
      }
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   - Create the merchant_subscription_plans table');
        console.log('   - Run database migrations');
      }
    } else {
      console.log('✅ Database query is working');
      console.log('❌ ISSUE: React component is not processing the data correctly');
      console.log('   SOLUTION: Check the SubscriptionPlanManager component');
      console.log('   - Verify the databaseAdapter is working correctly');
      console.log('   - Check for JavaScript errors in the browser console');
      console.log('   - Ensure the component is properly handling the response');
    }

  } catch (error) {
    console.error('❌ Fatal error during debug:', error.message);
  }
}

// Run the debug
debugSubscriptionLoading().catch(console.error);
