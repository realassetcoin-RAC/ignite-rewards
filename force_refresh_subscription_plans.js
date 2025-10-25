const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRefreshSubscriptionPlans() {
  console.log('🔄 Force refreshing subscription plans...\n');

  try {
    // First, let's try to clear any potential cache by doing a fresh query
    console.log('1️⃣ Performing fresh query with cache busting...');
    
    const timestamp = Date.now();
    const { data: freshData, error: freshError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true })
      .limit(10);
    
    if (freshError) {
      console.log('❌ Error with fresh query:', freshError.message);
      return;
    }
    
    console.log(`✅ Fresh query successful, found ${freshData?.length || 0} plans`);
    
    if (freshData && freshData.length > 0) {
      console.log('\n📋 Current data in database:');
      freshData.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.plan_name} (${plan.plan_type})`);
        console.log(`   Features:`, JSON.stringify(plan.features, null, 2));
        
        if (plan.features) {
          const maxPoints = plan.features.max_points_distribution;
          const maxTxns = plan.features.max_transactions;
          const maxMerchants = plan.features.max_merchants;
          console.log(`   Points: ${maxPoints}, Transactions: ${maxTxns}, Merchants: ${maxMerchants}`);
        }
      });
    }

    // Now let's try to update the plans again with a more explicit approach
    console.log('\n2️⃣ Attempting explicit updates...');
    
    const updates = [
      {
        plan_type: 'startup',
        features: JSON.stringify({
          support: 'email',
          max_merchants: 1,
          max_transactions: 100,
          max_points_distribution: 100,
          analytics: 'Standard Analytics',
          support_type: 'Email and Chat Support'
        })
      },
      {
        plan_type: 'momentum',
        features: JSON.stringify({
          support: 'priority',
          max_merchants: 2,
          max_transactions: 300,
          max_points_distribution: 300,
          analytics: 'Standard Analytics',
          support_type: 'Email and Chat Support'
        })
      },
      {
        plan_type: 'energizer',
        features: JSON.stringify({
          support: 'phone',
          max_merchants: 3,
          max_transactions: 600,
          max_points_distribution: 600,
          analytics: 'Advanced Analytics',
          support_type: 'Email and Chat Support'
        })
      },
      {
        plan_type: 'cloud9',
        features: JSON.stringify({
          support: 'dedicated',
          max_merchants: 5,
          max_transactions: 1800,
          max_points_distribution: 1800,
          analytics: 'Advanced Analytics',
          support_type: 'Priority Email and Chat Support 24/7'
        })
      },
      {
        plan_type: 'super',
        features: JSON.stringify({
          support: 'white-glove',
          max_merchants: -1,
          max_transactions: 4000,
          max_points_distribution: 4000,
          analytics: 'Custom Analytics',
          support_type: 'Dedicated Account Manager, Priority Email and Chat Support 24/7'
        })
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        console.log(`   Updating ${update.plan_type}...`);
        
        const { error: updateError } = await supabase
          .from('merchant_subscription_plans')
          .update({ 
            features: update.features
          })
          .eq('plan_type', update.plan_type);

        if (updateError) {
          console.log(`❌ Error updating ${update.plan_type}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated ${update.plan_type}`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception updating ${update.plan_type}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} plans`);
    console.log(`   ❌ Failed to update: ${errorCount} plans`);

    // Wait and then verify
    console.log('\n3️⃣ Waiting 3 seconds for updates to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n4️⃣ Final verification...');
    const { data: finalData, error: finalError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, plan_type, features')
      .order('price_monthly', { ascending: true });

    if (finalError) {
      console.log('❌ Error with final verification:', finalError.message);
    } else {
      console.log('✅ Final verification successful:');
      finalData.forEach((plan, index) => {
        const maxPoints = plan.features?.max_points_distribution;
        const maxTxns = plan.features?.max_transactions;
        const maxMerchants = plan.features?.max_merchants;
        console.log(`   ${index + 1}. ${plan.plan_name}: ${maxPoints} points, ${maxTxns} transactions, ${maxMerchants} merchants`);
      });
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

forceRefreshSubscriptionPlans();
