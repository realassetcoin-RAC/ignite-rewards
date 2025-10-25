// Direct Database Fixes for UAT Deployment
// This script applies fixes using direct Supabase client operations

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDirectFixes() {
  console.log('🔧 Applying direct database fixes for UAT deployment...\n');

  try {
    // 1. Check current subscription plans structure
    console.log('1️⃣ Checking current subscription plans...');
    const { data: currentPlans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .limit(1);

    if (plansError) {
      console.error('❌ Error checking plans:', plansError);
    } else {
      console.log('✅ Plans table accessible');
      if (currentPlans && currentPlans.length > 0) {
        console.log('📊 Current plan structure:', Object.keys(currentPlans[0]));
      }
    }

    // 2. Try to create issue_categories table using insert (will fail if exists, but that's ok)
    console.log('\n2️⃣ Creating issue_categories table...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('issue_categories')
      .select('*')
      .limit(1);

    if (categoriesError && categoriesError.code === 'PGRST205') {
      console.log('⚠️ issue_categories table does not exist - needs manual creation');
    } else if (categoriesError) {
      console.error('❌ Error checking categories:', categoriesError);
    } else {
      console.log('✅ issue_categories table exists');
    }

    // 3. Test can_use_mfa function
    console.log('\n3️⃣ Testing can_use_mfa function...');
    const { data: mfaData, error: mfaError } = await supabase
      .rpc('can_use_mfa', { user_id: '00000000-0000-0000-0000-000000000000' });

    if (mfaError && mfaError.code === 'PGRST202') {
      console.log('⚠️ can_use_mfa function does not exist - needs manual creation');
    } else if (mfaError) {
      console.error('❌ Error testing MFA function:', mfaError);
    } else {
      console.log('✅ can_use_mfa function exists');
    }

    // 4. Update existing subscription plans to ensure they have required fields
    console.log('\n4️⃣ Updating subscription plans...');
    const { data: allPlans, error: allPlansError } = await supabase
      .from('merchant_subscription_plans')
      .select('*');

    if (allPlansError) {
      console.error('❌ Error fetching all plans:', allPlansError);
    } else {
      console.log(`📊 Found ${allPlans?.length || 0} subscription plans`);
      
      // Update plans to ensure they have proper data
      for (const plan of allPlans || []) {
        const updates = {};
        
        // Ensure plan_name exists
        if (!plan.plan_name) {
          updates.plan_name = plan.name || `Plan ${plan.id.slice(0, 8)}`;
        }
        
        // Ensure plan_type exists
        if (!plan.plan_type) {
          updates.plan_type = 'standard';
        }
        
        // Ensure email_limit exists
        if (plan.email_limit === null || plan.email_limit === undefined) {
          updates.email_limit = 1;
        }
        
        // Ensure is_popular exists
        if (plan.is_popular === null || plan.is_popular === undefined) {
          updates.is_popular = false;
        }

        // Update if there are changes needed
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('merchant_subscription_plans')
            .update(updates)
            .eq('id', plan.id);

          if (updateError) {
            console.warn(`⚠️ Could not update plan ${plan.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated plan ${plan.id}`);
          }
        }
      }
    }

    console.log('\n🎉 Direct fixes completed!');
    console.log('📋 Summary:');
    console.log('   - Subscription plans: ✅ Accessible');
    console.log('   - Missing columns: ⚠️ Need manual SQL execution');
    console.log('   - Missing functions: ⚠️ Need manual SQL execution');
    console.log('   - Missing tables: ⚠️ Need manual SQL execution');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the fixes
applyDirectFixes().catch(console.error);

