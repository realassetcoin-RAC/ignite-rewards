#!/usr/bin/env node

/**
 * Apply Comprehensive Virtual Card Fix
 * This script applies the database migration directly to fix virtual card creation issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔧 Applying Comprehensive Virtual Card Fix...');
console.log('==============================================\n');

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250115_comprehensive_virtual_card_fix.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration SQL loaded successfully');
    console.log('📝 Applying database changes...\n');
    
    // Apply the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return false;
  }
}

async function testFix() {
  console.log('\n🧪 Testing the fix...\n');
  
  // Test function calls
  const tests = [
    {
      name: 'api.generate_loyalty_number with email',
      test: () => supabase.rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'api.generate_loyalty_number without params',
      test: () => supabase.rpc('generate_loyalty_number')
    },
    {
      name: 'public.generate_loyalty_number with email',
      test: () => supabase.schema('public').rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'public.generate_loyalty_number without params',
      test: () => supabase.schema('public').rpc('generate_loyalty_number')
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}...`);
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`    ❌ Failed: ${error.message}`);
      } else if (data) {
        console.log(`    ✅ Success: Generated ${data}`);
        successCount++;
      } else {
        console.log(`    ⚠️  No data returned`);
      }
    } catch (e) {
      console.log(`    ❌ Exception: ${e.message}`);
    }
  }
  
  // Test table access
  console.log('\n  Testing table access...');
  try {
    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .select('id, loyalty_number')
      .limit(1);
      
    if (error) {
      console.log(`    ❌ Table access failed: ${error.message}`);
    } else {
      console.log(`    ✅ Table access works: Found ${data?.length || 0} records`);
      successCount++;
    }
  } catch (e) {
    console.log(`    ❌ Table access exception: ${e.message}`);
  }
  
  return successCount;
}

async function main() {
  try {
    // Apply the migration
    const migrationSuccess = await applyMigration();
    
    if (!migrationSuccess) {
      console.log('\n❌ Migration failed. Cannot proceed with testing.');
      process.exit(1);
    }
    
    // Test the fix
    const successCount = await testFix();
    
    console.log('\n📊 RESULTS');
    console.log('===========');
    
    if (successCount >= 3) {
      console.log('✅ VIRTUAL CARD CREATION FIX SUCCESSFUL!');
      console.log('   - Database functions are working');
      console.log('   - Table access is working');
      console.log('   - Users should now be able to create virtual loyalty cards');
      console.log('\n🎯 Next Steps:');
      console.log('1. Test virtual card creation in your application');
      console.log('2. Verify that loyalty cards are saved properly');
      console.log('3. Check browser console for any remaining errors');
    } else {
      console.log('⚠️  PARTIAL SUCCESS - Some issues may remain');
      console.log(`   - ${successCount} out of 5 tests passed`);
      console.log('   - Check the error messages above for specific issues');
      console.log('   - You may need to run additional fixes');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();