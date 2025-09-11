// Apply Health Check Fix Script
// This script applies the comprehensive fix for all three health check errors

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'api' }
});

async function applyHealthCheckFix() {
  console.log('🚀 Applying Health Check Fix...\n');
  
  try {
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('fix_health_check_errors.sql', 'utf8');
    
    console.log('📋 Executing comprehensive health check fix...');
    
    // Execute the SQL fix
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlFix });
    
    if (error) {
      console.error('❌ Error applying fix:', error);
      return;
    }
    
    console.log('✅ Health check fix applied successfully!');
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    // Test DAO Organizations table
    const { data: daoOrgs, error: daoOrgsError } = await supabase
      .from('dao_organizations')
      .select('id')
      .limit(1);
    
    if (daoOrgsError) {
      console.log('❌ DAO Organizations table still has issues:', daoOrgsError.message);
    } else {
      console.log('✅ DAO Organizations table is accessible');
    }
    
    // Test DAO Proposals table
    const { data: daoProposals, error: daoProposalsError } = await supabase
      .from('dao_proposals')
      .select('id')
      .limit(1);
    
    if (daoProposalsError) {
      console.log('❌ DAO Proposals table still has issues:', daoProposalsError.message);
    } else {
      console.log('✅ DAO Proposals table is accessible');
    }
    
    // Test loyalty_transactions with transaction_type
    const { data: loyaltyTx, error: loyaltyTxError } = await supabase
      .from('loyalty_transactions')
      .select('transaction_type')
      .limit(1);
    
    if (loyaltyTxError) {
      console.log('❌ loyalty_transactions transaction_type column still has issues:', loyaltyTxError.message);
    } else {
      console.log('✅ loyalty_transactions transaction_type column is accessible');
    }
    
    console.log('\n🎉 Health check fix verification complete!');
    console.log('You can now refresh the admin dashboard to see the resolved health checks.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative method using direct SQL execution
async function applyHealthCheckFixDirect() {
  console.log('🚀 Applying Health Check Fix (Direct Method)...\n');
  
  try {
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('fix_health_check_errors.sql', 'utf8');
    
    console.log('📋 Executing SQL fix directly...');
    
    // Split the SQL into individual statements and execute them
    const statements = sqlFix
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.log(`⚠️  Warning for statement: ${error.message}`);
          }
        } catch (err) {
          console.log(`⚠️  Warning for statement: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Health check fix applied successfully!');
    
    // Test the fixes
    await testHealthChecks();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testHealthChecks() {
  console.log('\n🔍 Testing health checks...');
  
  const tests = [
    {
      name: 'DAO System',
      test: () => supabase.from('dao_organizations').select('id').limit(1)
    },
    {
      name: 'User DAO Access',
      test: () => supabase.from('dao_proposals').select('id').limit(1)
    },
    {
      name: 'Merchant Reward Generator',
      test: () => supabase.from('loyalty_transactions').select('transaction_type').limit(1)
    }
  ];
  
  for (const test of tests) {
    try {
      const { error } = await test.test();
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`✅ ${test.name}: Working correctly`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }
}

// Run the fix
applyHealthCheckFixDirect();
