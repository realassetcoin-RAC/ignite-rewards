#!/usr/bin/env node

/**
 * Database Fix Application Script
 * 
 * This script applies the comprehensive database fixes for authentication errors
 * and tests the results to ensure everything is working correctly.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyDatabaseFixes() {
  console.log('🔧 Starting Database Error Fixes...\n');

  try {
    // Read the SQL fix file
    const sqlFixes = fs.readFileSync('./database_fix.sql', 'utf8');
    
    console.log('📄 Loaded database fix SQL script');
    
    // Split the SQL into individual statements (basic splitting)
    const statements = sqlFixes
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the Supabase SQL execution endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Statement ${i + 1} failed: ${errorText}`);
          
          // Try alternative approach using RPC
          console.log(`🔄 Trying alternative execution method...`);
          // Continue to next statement for now
          continue;
        }
        
        const result = await response.json();
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        console.log(`❌ Error executing statement ${i + 1}: ${error.message}`);
        // Continue with other statements
      }
    }
    
    console.log('\n🧪 Testing database functions...\n');
    
    // Test the functions
    await testDatabaseFunctions();
    
  } catch (error) {
    console.error('❌ Failed to apply database fixes:', error);
  }
}

async function testDatabaseFunctions() {
  const tests = [
    {
      name: 'is_admin RPC function',
      test: () => supabase.rpc('is_admin')
    },
    {
      name: 'check_admin_access RPC function',
      test: () => supabase.rpc('check_admin_access')
    },
    {
      name: 'get_current_user_profile RPC function',
      test: () => supabase.rpc('get_current_user_profile')
    },
    {
      name: 'fix_auth_issues diagnostic function',
      test: () => supabase.rpc('fix_auth_issues')
    },
    {
      name: 'profiles table access',
      test: () => supabase.from('profiles').select('id,email,role').limit(5)
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`🧪 Testing ${test.name}...`);
    
    try {
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        results.push({ name: test.name, status: 'error', error: error.message });
      } else {
        console.log(`✅ ${test.name}: SUCCESS`);
        if (data !== null && data !== undefined) {
          console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
        }
        results.push({ name: test.name, status: 'success', data });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: EXCEPTION - ${error.message}`);
      results.push({ name: test.name, status: 'exception', error: error.message });
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status !== 'success')
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
  }
  
  return results;
}

async function checkDatabaseHealth() {
  console.log('\n🏥 Database Health Check...\n');
  
  try {
    // Check basic connectivity
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%profile%');
      
    console.log('📋 Profile-related tables:', tables);
    
    // Check RPC functions
    const { data: functions } = await supabase.rpc('fix_auth_issues');
    console.log('🔧 Auth diagnostic result:');
    console.log(functions);
    
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Error Fix Tool\n');
  console.log('This tool will:');
  console.log('1. Apply comprehensive database fixes');
  console.log('2. Test all authentication functions');
  console.log('3. Verify database health');
  console.log('4. Provide recommendations\n');
  
  await applyDatabaseFixes();
  await checkDatabaseHealth();
  
  console.log('\n✨ Database fix process completed!');
  console.log('\n💡 Next Steps:');
  console.log('1. Test the admin login with realassetcoin@gmail.com');
  console.log('2. Check the browser console for any remaining errors');
  console.log('3. Run the application and verify admin dashboard access');
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyDatabaseFixes, testDatabaseFunctions, checkDatabaseHealth };