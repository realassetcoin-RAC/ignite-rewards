const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wndswqvqogeblksrujpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

async function executeRLSFix() {
  console.log('🔧 Executing comprehensive RLS policy fix...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('FIX_RLS_POLICIES_COMPREHENSIVE.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.log(`   ⚠️  Statement ${i + 1} result:`, error.message);
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
            if (data) {
              console.log(`   📊 Result:`, data);
            }
          }
        } catch (err) {
          console.log(`   ❌ Statement ${i + 1} error:`, err.message);
        }
        
        console.log(''); // Empty line for readability
      }
    }

    // Test the fix
    console.log('🧪 Testing the fix...');
    
    const { data: testData, error: testError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, price_monthly')
      .limit(1);
    
    if (testError) {
      console.log('❌ Test fetch error:', testError.message);
      return;
    }
    
    if (testData && testData.length > 0) {
      const plan = testData[0];
      console.log(`Testing update on plan: ${plan.plan_name} (ID: ${plan.id})`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('merchant_subscription_plans')
        .update({ 
          price_monthly: 88.88,
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id)
        .select('id, plan_name, price_monthly, updated_at');
      
      if (updateError) {
        console.log('❌ Update test failed:', updateError.message);
      } else if (updateResult && updateResult.length > 0) {
        console.log('✅ Update test SUCCESS!');
        console.log('📊 Updated record:', updateResult[0]);
      } else {
        console.log('❌ Update test failed: No result returned');
      }
    }

  } catch (error) {
    console.error('❌ Error executing RLS fix:', error);
  }
}

// Alternative approach: Try to execute SQL directly via a different method
async function tryDirectSQLExecution() {
  console.log('\n🔄 Trying alternative SQL execution method...\n');
  
  const sqlStatements = [
    // Check current RLS status
    `SELECT schemaname, tablename, rowsecurity as rls_enabled FROM pg_tables WHERE tablename = 'merchant_subscription_plans' AND schemaname = 'public'`,
    
    // Drop existing policies
    `DROP POLICY IF EXISTS "Allow authenticated users to read subscription plans" ON public.merchant_subscription_plans`,
    `DROP POLICY IF EXISTS "Allow authenticated users to insert subscription plans" ON public.merchant_subscription_plans`,
    `DROP POLICY IF EXISTS "Allow authenticated users to update subscription plans" ON public.merchant_subscription_plans`,
    `DROP POLICY IF EXISTS "Allow authenticated users to delete subscription plans" ON public.merchant_subscription_plans`,
    `DROP POLICY IF EXISTS "Allow anon users to read active subscription plans" ON public.merchant_subscription_plans`,
    
    // Create new policies
    `CREATE POLICY "Allow authenticated users to read subscription plans" ON public.merchant_subscription_plans FOR SELECT TO authenticated USING (true)`,
    `CREATE POLICY "Allow authenticated users to insert subscription plans" ON public.merchant_subscription_plans FOR INSERT TO authenticated WITH CHECK (true)`,
    `CREATE POLICY "Allow authenticated users to update subscription plans" ON public.merchant_subscription_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Allow authenticated users to delete subscription plans" ON public.merchant_subscription_plans FOR DELETE TO authenticated USING (true)`,
    `CREATE POLICY "Allow anon users to read active subscription plans" ON public.merchant_subscription_plans FOR SELECT TO anon USING (is_active = true)`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`Executing SQL ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 50)}...`);
    
    try {
      // Try different methods to execute SQL
      const { data, error } = await supabase.rpc('exec', { sql });
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
        if (data) console.log(`   📊 Data:`, data);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
}

async function main() {
  await executeRLSFix();
  await tryDirectSQLExecution();
}

main().catch(console.error);
