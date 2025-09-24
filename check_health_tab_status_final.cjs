#!/usr/bin/env node

/**
 * Final Health Tab Status Check
 * 
 * This script checks the current status and provides specific guidance
 * for resolving any remaining health tab issues.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHealthTabStatus() {
  console.log('🔍 FINAL HEALTH TAB STATUS CHECK');
  console.log('=================================\n');
  
  // Test basic connectivity first
  console.log('1️⃣ TESTING BASIC CONNECTIVITY:');
  console.log('-------------------------------');
  
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`❌ Auth connectivity: ${authError.message}`);
    } else {
      console.log(`✅ Auth connectivity: OK (session: ${authData?.session ? 'active' : 'none'})`);
    }
  } catch (error) {
    console.log(`❌ Auth connectivity: ${error.message}`);
  }

  // Test a simple table query
  console.log('\n2️⃣ TESTING CORE TABLES:');
  console.log('-------------------------');
  
  const coreTables = ['profiles', 'merchants', 'virtual_cards'];
  let workingTables = 0;
  
  for (const table of coreTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('schema cache')) {
          console.log(`⚠️  ${table}: Schema cache issue - database may be restarting`);
        } else if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table missing - needs to be created`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: OK`);
        workingTables++;
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  // Test RPC functions
  console.log('\n3️⃣ TESTING RPC FUNCTIONS:');
  console.log('---------------------------');
  
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      if (error.message.includes('schema cache')) {
        console.log(`⚠️  is_admin: Schema cache issue - database may be restarting`);
      } else if (error.message.includes('does not exist')) {
        console.log(`❌ is_admin: Function missing - needs to be created`);
      } else {
        console.log(`❌ is_admin: ${error.message}`);
      }
    } else {
      console.log(`✅ is_admin: OK (result: ${data})`);
    }
  } catch (error) {
    console.log(`❌ is_admin: ${error.message}`);
  }

  // Check Supabase project status
  console.log('\n4️⃣ SUPABASE PROJECT STATUS:');
  console.log('-----------------------------');
  
  try {
    // Try to access the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Supabase REST API: Accessible');
    } else if (response.status === 503) {
      console.log('❌ Supabase REST API: Service Unavailable (project may be paused)');
    } else {
      console.log(`⚠️  Supabase REST API: Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Supabase REST API: ${error.message}`);
  }

  // Provide recommendations
  console.log('\n5️⃣ RECOMMENDATIONS:');
  console.log('---------------------');
  
  if (workingTables === 0) {
    console.log('🔧 IMMEDIATE ACTIONS NEEDED:');
    console.log('   1. Check your Supabase dashboard for project status');
    console.log('   2. Ensure your project is not paused or suspended');
    console.log('   3. If paused, resume/restart your project');
    console.log('   4. Wait 2-3 minutes for the database to fully restart');
    console.log('   5. Re-run the HEALTH_TAB_FIX.sql script');
  } else if (workingTables < coreTables.length) {
    console.log('🔧 PARTIAL FIXES NEEDED:');
    console.log('   1. Some tables are working, others need to be created');
    console.log('   2. Re-run the HEALTH_TAB_FIX.sql script');
    console.log('   3. Check for any specific error messages in the SQL execution');
  } else {
    console.log('✅ CORE FUNCTIONALITY WORKING:');
    console.log('   1. Basic tables are accessible');
    console.log('   2. Check your admin dashboard health tab');
    console.log('   3. If warnings persist, they may be non-critical');
  }

  console.log('\n6️⃣ NEXT STEPS:');
  console.log('----------------');
  console.log('   1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('   2. Check project status and ensure it\'s active');
  console.log('   3. If needed, run the HEALTH_TAB_FIX.sql script again');
  console.log('   4. Wait for database operations to complete');
  console.log('   5. Refresh your admin dashboard and check the health tab');
  console.log('   6. All items should show as "OK" (green) when fully resolved');

  return { workingTables, coreTables: coreTables.length };
}

// Run the status check
checkHealthTabStatus().catch(console.error);


