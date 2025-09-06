#!/usr/bin/env node

/**
 * Script to check the actual database state after the fix
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseState() {
  console.log('🔍 Checking Database State After Fix');
  console.log('===================================');
  
  // Test what tables are actually accessible
  const tablesToTest = [
    'loyalty_transactions',
    'transaction_qr_codes',
    'user_loyalty_cards',
    'profiles',
    'merchants'
  ];
  
  console.log('📊 Testing table accessibility:');
  
  for (const table of tablesToTest) {
    console.log(`\n🔍 Testing ${table}...`);
    
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   📋 Code: ${error.code}`);
        console.log(`   📋 Details: ${error.details}`);
        console.log(`   📋 Hint: ${error.hint}`);
      } else {
        console.log(`   ✅ Success! Count: ${count || 0}`);
        if (data && data.length > 0) {
          console.log(`   📊 Sample fields:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Test RPC functions
  console.log('\n🔍 Testing RPC functions:');
  
  const rpcsToTest = [
    'is_admin',
    'generate_loyalty_number'
  ];
  
  for (const rpc of rpcsToTest) {
    console.log(`\n🔍 Testing RPC ${rpc}...`);
    
    try {
      const { data, error } = await supabase.rpc(rpc);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   📋 Code: ${error.code}`);
      } else {
        console.log(`   ✅ Success! Result:`, data);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Database State Check');
  console.log('======================');
  console.log('Checking what tables and functions are actually accessible...\n');
  
  await checkDatabaseState();
  
  console.log('\n📊 Summary');
  console.log('==========');
  console.log('This shows what the admin dashboard health tab will see.');
  console.log('If tables show ✅, they should appear green in the health tab.');
  console.log('If tables show ❌, they will appear red in the health tab.');
}

main().catch(error => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});
