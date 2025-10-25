const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wndswqvqogeblksrujpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

async function testAfterRLSFix() {
  console.log('🧪 Testing subscription plan updates after RLS fix...\n');

  try {
    // Test 1: Simple read operation
    console.log('1. Testing read operation...');
    const { data: readData, error: readError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, price_monthly, display_name')
      .limit(1);
    
    if (readError) {
      console.log('❌ Read error:', readError.message);
      return;
    }
    
    console.log('✅ Read successful:', readData[0]);
    
    if (readData && readData.length > 0) {
      const plan = readData[0];
      
      // Test 2: Update operation with display_name
      console.log('\n2. Testing update operation...');
      const updatePayload = {
        plan_name: plan.plan_name,
        display_name: plan.display_name || plan.plan_name, // Ensure display_name is set
        price_monthly: 88.88,
        updated_at: new Date().toISOString()
      };
      
      const { data: updateData, error: updateError } = await supabase
        .from('merchant_subscription_plans')
        .update(updatePayload)
        .eq('id', plan.id)
        .select('id, plan_name, display_name, price_monthly, updated_at');
      
      if (updateError) {
        console.log('❌ Update error:', updateError.message);
        console.log('Error details:', updateError);
      } else if (updateData && updateData.length > 0) {
        console.log('✅ Update successful!');
        console.log('Updated record:', updateData[0]);
      } else {
        console.log('❌ Update failed: No result returned');
      }
      
      // Test 3: Insert operation with proper format
      console.log('\n3. Testing insert operation...');
      const testPlan = {
        plan_name: 'TEST_PLAN_' + Date.now(),
        display_name: 'Test Plan ' + Date.now(),
        description: 'Test plan for RLS testing',
        price_monthly: 99.99,
        price_yearly: 999.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        is_active: true,
        popular: false,
        plan_number: 999,
        features: [], // Use array instead of object
        monthly_points: 1000,
        monthly_transactions: 100,
        trial_days: 7
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('merchant_subscription_plans')
        .insert([testPlan])
        .select('id, plan_name, price_monthly');
      
      if (insertError) {
        console.log('❌ Insert error:', insertError.message);
        console.log('Error details:', insertError);
      } else if (insertData && insertData.length > 0) {
        console.log('✅ Insert successful!');
        console.log('Inserted record:', insertData[0]);
        
        // Clean up test record
        await supabase
          .from('merchant_subscription_plans')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test record cleaned up');
      } else {
        console.log('❌ Insert failed: No result returned');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

async function provideManualInstructions() {
  console.log('📋 MANUAL RLS FIX INSTRUCTIONS\n');
  console.log('Since we cannot execute SQL directly, please follow these steps:\n');
  
  console.log('1. Go to your Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/wndswqvqogeblksrujpg\n');
  
  console.log('2. Navigate to: SQL Editor\n');
  
  console.log('3. Copy and paste the contents of COMPREHENSIVE_RLS_FIX.sql\n');
  
  console.log('4. Execute the SQL script\n');
  
  console.log('5. Run this test script again to verify the fix\n');
  
  console.log('📄 SQL Script Location: COMPREHENSIVE_RLS_FIX.sql\n');
  
  // Show the SQL content
  try {
    const sqlContent = fs.readFileSync('COMPREHENSIVE_RLS_FIX.sql', 'utf8');
    console.log('📝 SQL Script Content:');
    console.log('=' .repeat(50));
    console.log(sqlContent);
    console.log('=' .repeat(50));
  } catch (error) {
    console.log('❌ Could not read SQL file:', error.message);
  }
}

async function main() {
  console.log('🔧 RLS Policy Fix for merchant_subscription_plans\n');
  
  // First, provide manual instructions
  await provideManualInstructions();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Then test the current state
  await testAfterRLSFix();
}

main().catch(console.error);
