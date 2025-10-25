const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wndswqvqogeblksrujpg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA');

async function testAuthenticationAndRLS() {
  console.log('Testing authentication and RLS...\n');
  
  // Check current auth status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Current user:', user ? user.email : 'Not authenticated');
  console.log('Auth error:', authError);
  
  // Test simple read operation
  console.log('\nTesting read operation...');
  const { data: readData, error: readError } = await supabase
    .from('merchant_subscription_plans')
    .select('id, plan_name, price_monthly')
    .limit(1);
  
  console.log('Read result:', readData);
  console.log('Read error:', readError);
  
  if (readData && readData.length > 0) {
    const plan = readData[0];
    console.log('\nTesting update operation...');
    
    // Try a minimal update
    const { data: updateData, error: updateError } = await supabase
      .from('merchant_subscription_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', plan.id)
      .select('id, plan_name, updated_at');
    
    console.log('Update result:', updateData);
    console.log('Update error:', updateError);
    
    if (updateError) {
      console.log('\nUpdate error details:');
      console.log('Error code:', updateError.code);
      console.log('Error message:', updateError.message);
      console.log('Error details:', updateError.details);
      console.log('Error hint:', updateError.hint);
    }
  }
  
  // Test with a different approach - try to insert a test record
  console.log('\nTesting insert operation...');
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
    features: {},
    monthly_points: 1000,
    monthly_transactions: 100,
    trial_days: 7
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('merchant_subscription_plans')
    .insert([testPlan])
    .select('id, plan_name, price_monthly');
  
  console.log('Insert result:', insertData);
  console.log('Insert error:', insertError);
  
  if (insertError) {
    console.log('\nInsert error details:');
    console.log('Error code:', insertError.code);
    console.log('Error message:', insertError.message);
    console.log('Error details:', insertError.details);
    console.log('Error hint:', insertError.hint);
  }
}

testAuthenticationAndRLS().catch(console.error);
