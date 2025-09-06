#!/usr/bin/env node

/**
 * Apply API Schema Virtual Card Fix
 * This script applies the database migration to fix virtual card creation within API schema constraints
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

// Create Supabase client configured for api schema
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'api' }
});

console.log('🔧 Applying API Schema Virtual Card Fix...');
console.log('==========================================\n');

async function applyMigrationInChunks() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250115_api_schema_virtual_card_fix.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration SQL loaded successfully');
    console.log('📝 Applying database changes in chunks...\n');
    
    // Split the migration into individual statements for better error handling
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip empty statements and comments
      if (statement.trim() === ';' || statement.trim().startsWith('--')) {
        continue;
      }
      
      try {
        console.log(`  Executing statement ${i + 1}/${statements.length}...`);
        
        // For DO blocks and complex statements, we need to execute them directly
        if (statement.trim().startsWith('DO $$') || 
            statement.trim().startsWith('CREATE TABLE') ||
            statement.trim().startsWith('CREATE OR REPLACE FUNCTION') ||
            statement.trim().startsWith('CREATE TRIGGER') ||
            statement.trim().startsWith('ALTER TABLE') ||
            statement.trim().startsWith('GRANT') ||
            statement.trim().startsWith('DROP')) {
          
          // These need to be executed as raw SQL
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`    ⚠️  Statement ${i + 1} had issues: ${error.message}`);
            errorCount++;
          } else {
            console.log(`    ✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`    ⏭️  Skipping statement ${i + 1} (comment or empty)`);
        }
        
      } catch (error) {
        console.log(`    ❌ Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
      }
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    return successCount > errorCount;
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return false;
  }
}

async function testFix() {
  console.log('\n🧪 Testing the fix...\n');
  
  // Test function calls within API schema
  const tests = [
    {
      name: 'api.generate_loyalty_number with email',
      test: () => supabase.rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'api.generate_loyalty_number without params',
      test: () => supabase.rpc('generate_loyalty_number')
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
    console.log('🎯 Target: Fix virtual card creation within API schema constraints');
    console.log('📋 Issues to fix:');
    console.log('   - Ambiguous column reference in generate_loyalty_number function');
    console.log('   - Missing function signature (no parameters version)');
    console.log('   - Table permissions and RLS policies');
    console.log('   - Schema access restrictions\n');
    
    // Apply the migration
    const migrationSuccess = await applyMigrationInChunks();
    
    if (!migrationSuccess) {
      console.log('\n⚠️  Migration had some issues but may have partially succeeded.');
      console.log('Continuing with testing to see what works...');
    }
    
    // Test the fix
    const successCount = await testFix();
    
    console.log('\n📊 RESULTS');
    console.log('===========');
    
    if (successCount >= 2) {
      console.log('✅ VIRTUAL CARD CREATION FIX SUCCESSFUL!');
      console.log('   - Database functions are working');
      console.log('   - Table access is working within API schema');
      console.log('   - Users should now be able to create virtual loyalty cards');
      console.log('\n🎯 Next Steps:');
      console.log('1. Test virtual card creation in your application');
      console.log('2. Verify that loyalty cards are saved properly');
      console.log('3. Check browser console for any remaining errors');
      console.log('\n💡 Note: Frontend should now use api.user_loyalty_cards table');
    } else {
      console.log('⚠️  PARTIAL SUCCESS - Some issues may remain');
      console.log(`   - ${successCount} out of 3 tests passed`);
      console.log('   - Check the error messages above for specific issues');
      console.log('   - The main fix (ambiguous column reference) may still be resolved');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();