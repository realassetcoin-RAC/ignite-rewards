// Debug Subscription Plans Loading
// This script will help debug why subscription plans aren't showing in the admin dashboard

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions from the component
function getDefaultPointsForPlan(planType) {
  const pointsMap = {
    'startup': 1000,
    'momentum': 2500,
    'energizer': 5000,
    'cloud9': 10000,
    'super': 25000
  };
  return pointsMap[planType] || 0;
}

function getDefaultTransactionsForPlan(planType) {
  const transactionsMap = {
    'startup': 100,
    'momentum': 250,
    'energizer': 500,
    'cloud9': 1000,
    'super': 2500
  };
  return transactionsMap[planType] || 0;
}

function getDefaultEmailLimitForPlan(planType) {
  const emailMap = {
    'startup': 1,
    'momentum': 3,
    'energizer': 5,
    'cloud9': 10,
    'super': -1 // unlimited
  };
  return emailMap[planType] || 1;
}

async function debugSubscriptionPlans() {
  console.log('🔍 Debugging Subscription Plans Loading...\n');

  try {
    // 1. Test the exact query used in the component
    console.log('1️⃣ Testing the exact database query from SubscriptionPlanManager...');
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });
    
    console.log('📊 Raw query result:');
    console.log('   Data:', data ? `${data.length} records` : 'null');
    console.log('   Error:', error ? error.message : 'none');
    
    if (error) {
      console.log('❌ Database query failed:', error);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ No data returned from query');
      return;
    }

    // 2. Test the mapping logic
    console.log('\n2️⃣ Testing the mapping logic...');
    const mappedPlans = data.map(plan => {
      const mappedPlan = {
        id: plan.id,
        name: plan.plan_name || 'Unnamed Plan',
        description: plan.description || null,
        price_monthly: Number(plan.price_monthly) || 0,
        price_yearly: Number(plan.price_yearly) || 0,
        monthly_points: getDefaultPointsForPlan(plan.plan_type),
        monthly_transactions: getDefaultTransactionsForPlan(plan.plan_type),
        email_limit: plan.email_limit || getDefaultEmailLimitForPlan(plan.plan_type),
        features: plan.features || [],
        trial_days: plan.features?.trial_days ? Number(plan.features.trial_days) : 0,
        is_active: plan.is_active !== false,
        popular: plan.is_popular || false,
        plan_number: 0,
        valid_from: '',
        valid_until: '',
        created_at: plan.created_at
      };
      return mappedPlan;
    });

    console.log('✅ Mapping successful');
    console.log(`📊 Mapped ${mappedPlans.length} plans:`);
    
    mappedPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} (${plan.id})`);
      console.log(`      💰 Monthly: $${plan.price_monthly} | Yearly: $${plan.price_yearly}`);
      console.log(`      📊 Points: ${plan.monthly_points} | Transactions: ${plan.monthly_transactions}`);
      console.log(`      📧 Email Limit: ${plan.email_limit === -1 ? 'Unlimited' : plan.email_limit}`);
      console.log(`      ✅ Active: ${plan.is_active} | Popular: ${plan.popular}`);
      console.log('');
    });

    // 3. Test if the data would render properly
    console.log('3️⃣ Testing data structure for rendering...');
    const hasValidData = mappedPlans.every(plan => 
      plan.id && 
      plan.name && 
      typeof plan.price_monthly === 'number' &&
      typeof plan.is_active === 'boolean'
    );

    if (hasValidData) {
      console.log('✅ All plans have valid data structure for rendering');
    } else {
      console.log('❌ Some plans have invalid data structure');
      mappedPlans.forEach((plan, index) => {
        const isValid = plan.id && plan.name && typeof plan.price_monthly === 'number' && typeof plan.is_active === 'boolean';
        if (!isValid) {
          console.log(`   ❌ Plan ${index + 1} (${plan.name}) has invalid structure:`, plan);
        }
      });
    }

    // 4. Check for any filtering issues
    console.log('\n4️⃣ Checking for filtering issues...');
    const activePlans = mappedPlans.filter(plan => plan.is_active);
    console.log(`📊 Active plans: ${activePlans.length} out of ${mappedPlans.length} total`);

    if (activePlans.length === 0) {
      console.log('⚠️  No active plans found! This could be why nothing shows in the UI.');
    }

    // 5. Summary
    console.log('\n📋 Debug Summary:');
    console.log('==================');
    console.log(`✅ Database query: ${data ? 'Success' : 'Failed'}`);
    console.log(`✅ Data mapping: ${mappedPlans.length > 0 ? 'Success' : 'Failed'}`);
    console.log(`✅ Data structure: ${hasValidData ? 'Valid' : 'Invalid'}`);
    console.log(`✅ Active plans: ${activePlans.length} available`);
    
    if (data && mappedPlans.length > 0 && hasValidData && activePlans.length > 0) {
      console.log('\n🎉 The data should be displaying in the admin dashboard!');
      console.log('   If it\'s still not showing, the issue might be:');
      console.log('   1. Component not re-rendering after data load');
      console.log('   2. Loading state not being cleared');
      console.log('   3. Error in the React component logic');
    } else {
      console.log('\n❌ Found issues that would prevent display:');
      if (!data) console.log('   - Database query failed');
      if (mappedPlans.length === 0) console.log('   - No data to map');
      if (!hasValidData) console.log('   - Invalid data structure');
      if (activePlans.length === 0) console.log('   - No active plans');
    }

  } catch (error) {
    console.error('❌ Fatal error during debug:', error.message);
  }
}

// Run the debug
debugSubscriptionPlans().catch(console.error);
