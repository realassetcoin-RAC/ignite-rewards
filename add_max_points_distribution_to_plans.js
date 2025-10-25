const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMaxPointsDistributionToPlans() {
  console.log('🔧 Adding max_points_distribution to subscription plan features...\n');

  try {
    // First, get all subscription plans
    console.log('1️⃣ Getting current subscription plans...');
    const { data: plans, error: getError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, plan_type, features')
      .order('price_monthly', { ascending: true });
    
    if (getError) {
      console.log('❌ Error loading subscription plans:', getError.message);
      return;
    }
    
    console.log(`✅ Found ${plans?.length || 0} subscription plans`);
    
    if (plans && plans.length > 0) {
      console.log('\n2️⃣ Updating subscription plans with max_points_distribution...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const plan of plans) {
        try {
          // Define max_points_distribution based on plan type
          let maxPointsDistribution = 0;
          
          switch (plan.plan_type) {
            case 'startup':
              maxPointsDistribution = 1000; // 1000 points per month
              break;
            case 'momentum':
              maxPointsDistribution = 5000; // 5000 points per month
              break;
            case 'energizer':
              maxPointsDistribution = 10000; // 10000 points per month
              break;
            case 'cloud9':
              maxPointsDistribution = 25000; // 25000 points per month
              break;
            case 'super':
              maxPointsDistribution = -1; // Unlimited points
              break;
            default:
              maxPointsDistribution = 1000; // Default fallback
          }
          
          // Update the features JSONB to include max_points_distribution
          const updatedFeatures = {
            ...plan.features,
            max_points_distribution: maxPointsDistribution
          };
          
          const { error: updateError } = await supabase
            .from('merchant_subscription_plans')
            .update({ features: updatedFeatures })
            .eq('id', plan.id);
          
          if (updateError) {
            console.log(`❌ Error updating ${plan.plan_name}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`✅ Updated ${plan.plan_name}: ${maxPointsDistribution} points/month`);
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Exception updating ${plan.plan_name}:`, err.message);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Successfully updated: ${successCount} plans`);
      console.log(`   ❌ Failed to update: ${errorCount} plans`);
    }

    // Verify the updates
    console.log('\n3️⃣ Verifying updates...');
    const { data: updatedPlans, error: verifyError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, plan_type, features')
      .order('price_monthly', { ascending: true });
    
    if (verifyError) {
      console.log('❌ Error verifying updates:', verifyError.message);
    } else {
      console.log('✅ Verification successful:');
      updatedPlans.forEach((plan, index) => {
        const maxPoints = plan.features?.max_points_distribution;
        const maxTxns = plan.features?.max_transactions;
        console.log(`   ${index + 1}. ${plan.plan_name}: ${maxPoints} points, ${maxTxns} transactions`);
      });
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

addMaxPointsDistributionToPlans();
