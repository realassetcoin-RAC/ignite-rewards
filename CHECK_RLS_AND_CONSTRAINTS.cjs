const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wndswqvqogeblksrujpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

async function checkRLSAndConstraints() {
  console.log('🔍 Checking RLS policies and constraints for merchant_subscription_plans...\n');

  try {
    // Check RLS policies
    console.log('1. Checking RLS policies:');
    const { data: policies, error: policiesError } = await supabase.rpc('get_table_policies', {
      table_name: 'merchant_subscription_plans'
    });
    
    if (policiesError) {
      console.log('   Error getting policies:', policiesError.message);
    } else {
      console.log('   Policies found:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
        });
      }
    }

    // Check table constraints
    console.log('\n2. Checking table constraints:');
    const { data: constraints, error: constraintsError } = await supabase.rpc('get_table_constraints', {
      table_name: 'merchant_subscription_plans'
    });
    
    if (constraintsError) {
      console.log('   Error getting constraints:', constraintsError.message);
    } else {
      console.log('   Constraints found:', constraints?.length || 0);
      if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
    }

    // Check triggers
    console.log('\n3. Checking triggers:');
    const { data: triggers, error: triggersError } = await supabase.rpc('get_table_triggers', {
      table_name: 'merchant_subscription_plans'
    });
    
    if (triggersError) {
      console.log('   Error getting triggers:', triggersError.message);
    } else {
      console.log('   Triggers found:', triggers?.length || 0);
      if (triggers && triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name}: ${trigger.event_manipulation.join(', ')}`);
        });
      }
    }

    // Test simple update
    console.log('\n4. Testing simple update:');
    const { data: testData, error: testError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, price_monthly')
      .limit(1);
    
    if (testError) {
      console.log('   Error fetching test data:', testError.message);
    } else if (testData && testData.length > 0) {
      const plan = testData[0];
      console.log(`   Testing update on plan: ${plan.plan_name} (ID: ${plan.id})`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('merchant_subscription_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', plan.id)
        .select('id, plan_name, updated_at');
      
      if (updateError) {
        console.log('   Update error:', updateError.message);
      } else {
        console.log('   Update result:', updateResult);
        console.log('   Update successful:', updateResult && updateResult.length > 0);
      }
    }

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  }
}

// Create the RPC functions if they don't exist
async function createDiagnosticFunctions() {
  console.log('Creating diagnostic RPC functions...');
  
  const functions = [
    {
      name: 'get_table_policies',
      sql: `
        CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
        RETURNS TABLE(policyname text, cmd text, permissive boolean, roles text[], qual text, with_check text)
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            pol.polname::text as policyname,
            pol.polcmd::text as cmd,
            pol.polpermissive as permissive,
            pol.polroles::text[] as roles,
            pol.polqual::text as qual,
            pol.polwithcheck::text as with_check
          FROM pg_policy pol
          JOIN pg_class cls ON pol.polrelid = cls.oid
          JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
          WHERE nsp.nspname = 'public' AND cls.relname = table_name;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'get_table_constraints',
      sql: `
        CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
        RETURNS TABLE(constraint_name text, constraint_type text)
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            con.conname::text as constraint_name,
            con.contype::text as constraint_type
          FROM pg_constraint con
          JOIN pg_class cls ON con.conrelid = cls.oid
          JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
          WHERE nsp.nspname = 'public' AND cls.relname = table_name;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'get_table_triggers',
      sql: `
        CREATE OR REPLACE FUNCTION get_table_triggers(table_name text)
        RETURNS TABLE(trigger_name text, event_manipulation text[])
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            tg.tgname::text as trigger_name,
            tg.tgtype::text[] as event_manipulation
          FROM pg_trigger tg
          JOIN pg_class cls ON tg.tgrelid = cls.oid
          JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
          WHERE nsp.nspname = 'public' AND cls.relname = table_name AND NOT tg.tgisinternal;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];

  for (const func of functions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
      if (error) {
        console.log(`   Function ${func.name} creation failed:`, error.message);
      } else {
        console.log(`   Function ${func.name} created successfully`);
      }
    } catch (err) {
      console.log(`   Function ${func.name} creation error:`, err.message);
    }
  }
}

async function main() {
  await createDiagnosticFunctions();
  console.log('\n' + '='.repeat(50) + '\n');
  await checkRLSAndConstraints();
}

main().catch(console.error);
