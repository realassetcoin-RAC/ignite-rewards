#!/usr/bin/env node

/**
 * Script to diagnose what happened when the SQL was executed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseDatabaseState() {
  console.log('🔍 Diagnosing Database State');
  console.log('============================');
  
  // Try to access tables that should exist
  const testTables = [
    'loyalty_transactions',
    'transaction_qr_codes', 
    'user_loyalty_cards',
    'profiles',
    'merchants',
    'virtual_cards'
  ];
  
  console.log('📊 Testing table access (this is what the health tab sees):');
  
  for (const table of testTables) {
    console.log(`\n🔍 ${table}:`);
    
    try {
      // This is exactly what the health tab does
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Health Tab Status: ERROR`);
        console.log(`   📋 Error: ${error.message}`);
        console.log(`   📋 Code: ${error.code || 'undefined'}`);
        
        // Check if it's a schema issue
        if (error.message?.includes('schema must be one of the following: api')) {
          console.log(`   🔍 Issue: Table not found in api schema`);
        } else if (error.message?.includes('does not exist')) {
          console.log(`   🔍 Issue: Table does not exist`);
        } else if (error.message?.includes('permission denied')) {
          console.log(`   🔍 Issue: Permission denied`);
        }
      } else {
        console.log(`   ✅ Health Tab Status: OK`);
        console.log(`   📊 Count: ${count || 0}`);
      }
    } catch (err) {
      console.log(`   ❌ Health Tab Status: ERROR`);
      console.log(`   📋 Exception: ${err.message}`);
    }
  }
  
  // Test RPC functions
  console.log('\n🔍 Testing RPC functions:');
  
  const testRpcs = [
    'is_admin',
    'generate_loyalty_number'
  ];
  
  for (const rpc of testRpcs) {
    console.log(`\n🔍 RPC ${rpc}:`);
    
    try {
      const { data, error } = await supabase.rpc(rpc);
      
      if (error) {
        console.log(`   ❌ Health Tab Status: ERROR`);
        console.log(`   📋 Error: ${error.message}`);
        console.log(`   📋 Code: ${error.code || 'undefined'}`);
      } else {
        console.log(`   ✅ Health Tab Status: OK`);
        console.log(`   📊 Result: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log(`   ❌ Health Tab Status: ERROR`);
      console.log(`   📋 Exception: ${err.message}`);
    }
  }
}

async function provideNextSteps() {
  console.log('\n🔧 Next Steps');
  console.log('=============');
  console.log('Based on the diagnosis above:');
  console.log('');
  console.log('1. If tables show ❌ ERROR:');
  console.log('   - The SQL script may not have executed completely');
  console.log('   - There might have been errors during execution');
  console.log('   - The tables might not have been created in the api schema');
  console.log('');
  console.log('2. If you see "schema must be one of the following: api":');
  console.log('   - The Supabase client is configured for api schema only');
  console.log('   - But the tables are not found in the api schema');
  console.log('   - This suggests the compatibility views were not created');
  console.log('');
  console.log('3. Recommended actions:');
  console.log('   - Check the Supabase dashboard SQL editor for any error messages');
  console.log('   - Re-run the SQL script if there were errors');
  console.log('   - Verify that the tables exist in both public and api schemas');
  console.log('');
  console.log('4. To verify the fix worked:');
  console.log('   - Go to your admin dashboard');
  console.log('   - Check the Health tab');
  console.log('   - Both loyalty_transactions and transaction_qr_codes should show green ✅');
}

async function main() {
  console.log('🚀 SQL Execution Diagnosis');
  console.log('==========================');
  console.log('Diagnosing what happened when the SQL script was executed...\n');
  
  await diagnoseDatabaseState();
  await provideNextSteps();
}

main().catch(error => {
  console.error('💥 Diagnosis failed:', error);
  process.exit(1);
});
