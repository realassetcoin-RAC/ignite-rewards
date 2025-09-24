#!/usr/bin/env node

/**
 * Health Tab Fix Application Script (Supabase Client)
 * 
 * This script applies the comprehensive health tab fixes using the Supabase client
 * to resolve all warnings and errors in the admin dashboard health tab.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyHealthTabFix() {
  console.log('🔌 Connecting to Supabase...');
  console.log('📖 Reading health tab fix SQL...');
  
  try {
    const sqlContent = fs.readFileSync(path.join(__dirname, 'HEALTH_TAB_FIX.sql'), 'utf8');
    console.log('✅ SQL file loaded successfully');
    
    // Split SQL into manageable chunks
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('🚀 Applying health tab fixes...');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute statements in batches
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        // Use RPC to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('');
    console.log(`📊 Execution Summary: ${successCount} successful, ${errorCount} errors`);
    
    // Test the fixes
    await testHealthTabComponents();
    
  } catch (error) {
    console.error('❌ Error during health tab fix:', error.message);
    console.log('');
    console.log('🔧 Manual deployment required:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project (wndswqvqogeblksrujpg)');
    console.log('   3. Open SQL Editor');
    console.log('   4. Copy the contents of: HEALTH_TAB_FIX.sql');
    console.log('   5. Paste and run it in the SQL editor');
  }
}

async function testHealthTabComponents() {
  console.log('');
  console.log('🧪 Testing health tab components...');
  
  const tests = [
    {
      name: 'profiles table',
      test: () => supabase.from('profiles').select('id').limit(1)
    },
    {
      name: 'merchants table',
      test: () => supabase.from('merchants').select('id').limit(1)
    },
    {
      name: 'user_wallets table',
      test: () => supabase.from('user_wallets').select('id').limit(1)
    },
    {
      name: 'merchant_cards table',
      test: () => supabase.from('merchant_cards').select('id').limit(1)
    },
    {
      name: 'subscribers table',
      test: () => supabase.from('subscribers').select('id').limit(1)
    },
    {
      name: 'is_admin RPC',
      test: () => supabase.rpc('is_admin')
    },
    {
      name: 'check_admin_access RPC',
      test: () => supabase.rpc('check_admin_access')
    }
  ];
  
  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  
  for (const test of tests) {
    try {
      const { data, error } = await test.test();
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
          console.log(`⚠️  ${test.name}: WARNING - ${error.message}`);
          warningCount++;
        } else {
          console.log(`❌ ${test.name}: ERROR - ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ ${test.name}: OK`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: EXCEPTION - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('');
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ OK: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (warningCount === 0 && errorCount === 0) {
    console.log('');
    console.log('🎉 ALL HEALTH TAB ISSUES RESOLVED!');
    console.log('   The admin dashboard health tab should now show all green checkmarks.');
  } else {
    console.log('');
    console.log('⚠️  Some issues remain. Manual SQL execution may be required.');
  }
}

// Run the health tab fix
applyHealthTabFix().catch(console.error);


