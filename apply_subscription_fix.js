import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMzMTIxMCwiZXhwIjoyMDcxOTA3MjEwfQ.sEKdnwUTLGh4yXvG6Ksn3rY1JQUB3Lw8oBNRPFp-5Wg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'api'
  }
});

async function runDiagnostic() {
  console.log('🔍 Running diagnostic...\n');
  
  try {
    // Check if API schema exists
    const { data: apiSchema, error: apiSchemaError } = await supabase.rpc('exec_sql', {
      sql: "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') as exists"
    });
    
    if (apiSchemaError) {
      console.log('Using direct SQL check instead...');
      
      // Check if merchant_subscription_plans table exists in api schema
      const { data: apiTable, error: apiTableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'api')
        .eq('table_name', 'merchant_subscription_plans');
        
      console.log('API schema table check:', apiTableError ? 'Error: ' + apiTableError.message : `Found ${apiTable?.length || 0} tables`);
      
      // Check if table exists in public schema
      const { data: publicTable, error: publicTableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', 'merchant_subscription_plans');
        
      console.log('Public schema table check:', publicTableError ? 'Error: ' + publicTableError.message : `Found ${publicTable?.length || 0} tables`);
    }
    
    // Try to query the merchant_subscription_plans table
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .limit(1);
      
    console.log('Plans table query:', plansError ? 'Error: ' + plansError.message : `Success - found ${plans?.length || 0} plans`);
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', userError ? 'Not authenticated' : user ? user.email : 'No user');
    
  } catch (error) {
    console.error('Diagnostic error:', error.message);
  }
}

async function applyFix() {
  console.log('🔧 Applying comprehensive fix...\n');
  
  try {
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('/workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlFix
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('DO $$'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          if (error) {
            console.log(`Statement ${i + 1} error:`, error.message);
            // Continue with other statements
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`Statement ${i + 1} exception:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n✅ Fix application completed');
    
  } catch (error) {
    console.error('Fix application error:', error.message);
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying fix...\n');
  
  try {
    // Try to query the plans table
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('*');
      
    if (plansError) {
      console.log('❌ Plans table query failed:', plansError.message);
    } else {
      console.log(`✅ Plans table query successful - found ${plans?.length || 0} plans`);
      if (plans && plans.length > 0) {
        console.log('Sample plan:', plans[0].name);
      }
    }
    
    // Check policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM pg_policies WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans'"
    });
    
    if (!policiesError && policies) {
      console.log(`✅ Found ${policies.length} RLS policies`);
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting subscription plans fix...\n');
  
  await runDiagnostic();
  await applyFix();
  await verifyFix();
  
  console.log('\n🎉 Process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Ensure your user has admin role in the profiles table');
  console.log('2. Clear browser cache and log out/in');
  console.log('3. Test the Plans tab in admin dashboard');
}

main().catch(console.error);