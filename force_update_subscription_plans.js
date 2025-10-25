// Force Update Subscription Plans
// This script forces the update by using a different approach

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceUpdateSubscriptionPlans() {
  console.log('🔧 Force Update Subscription Plans...\n');

  try {
    // 1. First, let's see what we're working with
    console.log('1️⃣ Checking current plans...');
    const { data: currentPlans, error: currentError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, plan_type, price_monthly, price_yearly, is_popular')
      .order('price_monthly', { ascending: true });
    
    if (currentError) {
      console.log('❌ Error loading current plans:', currentError.message);
      return;
    }
    
    console.log('📊 Current plans:');
    currentPlans?.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_name} (${plan.plan_type}) - $${plan.price_monthly}/mo`);
    });

    // 2. Delete all existing plans
    console.log('\n2️⃣ Deleting all existing plans...');
    const { error: deleteError } = await supabase
      .from('merchant_subscription_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('❌ Error deleting plans:', deleteError.message);
      return;
    }
    
    console.log('✅ All existing plans deleted');

    // 3. Insert correct plans
    console.log('\n3️⃣ Inserting correct plans...');
    
    const correctPlans = [
      {
        plan_name: 'StartUp',
        plan_type: 'startup',
        price_monthly: 20.00,
        price_yearly: 150.00,
        features: [
          '100 Points limit for distribution',
          '100 Transactions limit for distribution',
          '1 Email (Registered Signup Email) account can access',
          'Merchant Dashboard with Standard Analytics',
          'Email and Chat Support'
        ],
        is_active: true,
        is_popular: false
      },
      {
        plan_name: 'Momentum',
        plan_type: 'momentum',
        price_monthly: 50.00,
        price_yearly: 500.00,
        features: [
          '300 Points limit for distribution',
          '300 Transactions limit for distribution',
          '2 Email (Registered Signup Email) account can access',
          'Merchant Dashboard with Standard Analytics',
          'Email and Chat Support'
        ],
        is_active: true,
        is_popular: false
      },
      {
        plan_name: 'Energizer',
        plan_type: 'energizer',
        price_monthly: 100.00,
        price_yearly: 1000.00,
        features: [
          '600 Points limit for distribution',
          '600 Transactions limit for distribution',
          '3 Email (Registered Signup Email) account can access',
          'Merchant Dashboard with Advanced Analytics',
          'Email and Chat Support'
        ],
        is_active: true,
        is_popular: true  // This is the popular plan
      },
      {
        plan_name: 'Cloud9',
        plan_type: 'cloud9',
        price_monthly: 250.00,
        price_yearly: 2500.00,
        features: [
          '1800 Points limit for distribution',
          '1800 Transactions limit for distribution',
          '5 Email (Registered Signup Email) account can access',
          'Merchant Dashboard with Advanced Analytics',
          'Priority Email and Chat Support 24/7'
        ],
        is_active: true,
        is_popular: false
      },
      {
        plan_name: 'Super',
        plan_type: 'super',
        price_monthly: 500.00,
        price_yearly: 5000.00,
        features: [
          '4000 Points limit for distribution',
          '4000 Transactions limit for distribution',
          'Unlimited Email (Registered Signup Email) account can access',
          'Merchant Dashboard with Custom Analytics',
          'Dedicated Account Manager, Priority Email and Chat Support 24/7'
        ],
        is_active: true,
        is_popular: false
      }
    ];

    for (const plan of correctPlans) {
      console.log(`📝 Inserting ${plan.plan_name}...`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('merchant_subscription_plans')
        .insert(plan)
        .select();
      
      if (insertError) {
        console.log(`❌ Error inserting ${plan.plan_name}:`, insertError.message);
      } else {
        console.log(`✅ Successfully inserted ${plan.plan_name}`);
      }
    }

    // 4. Verify the final result
    console.log('\n4️⃣ Verifying final subscription plans...');
    const { data: finalPlans, error: finalError } = await supabase
      .from('merchant_subscription_plans')
      .select('plan_name, plan_type, price_monthly, price_yearly, is_popular, is_active')
      .order('price_monthly', { ascending: true });
    
    if (finalError) {
      console.log('❌ Error verifying final plans:', finalError.message);
      return;
    }
    
    console.log('✅ Final subscription plans (CORRECT product specifications):');
    if (finalPlans && finalPlans.length > 0) {
      finalPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.plan_name} (${plan.plan_type})`);
        console.log(`      💰 Monthly: $${plan.price_monthly} | Yearly: $${plan.price_yearly}`);
        console.log(`      ⭐ Popular: ${plan.is_popular ? 'Yes' : 'No'}`);
        console.log(`      ✅ Active: ${plan.is_active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('🎉 Subscription plans have been completely updated with CORRECT product specifications!');
    console.log('📋 The admin dashboard should now show the correct pricing as per your product requirements.');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the force update
forceUpdateSubscriptionPlans().catch(console.error);
