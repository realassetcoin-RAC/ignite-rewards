#!/usr/bin/env node

/**
 * Apply API Schema Fix Script
 * 
 * This script applies the admin dashboard fix by creating functions in the api schema
 * and setting up the admin profile.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyApiSchemaFix() {
  console.log('🔧 Applying API Schema Fix...');
  
  // Read the API schema fix script
  const fixScriptPath = path.join(__dirname, 'api_schema_fix.sql');
  
  if (!fs.existsSync(fixScriptPath)) {
    console.log('❌ api_schema_fix.sql not found');
    return { success: false, error: 'Fix script not found' };
  }
  
  const fixScript = fs.readFileSync(fixScriptPath, 'utf8');
  
  try {
    // Split the script into individual statements
    const statements = fixScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT \'Testing'))
      .filter(stmt => !stmt.includes('SELECT \'Admin profile check:'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          // Use the SQL editor endpoint
          const { data, error } = await supabase
            .from('_sql')
            .select('*')
            .eq('query', statement);
          
          if (error) {
            console.log(`⚠️ Statement ${i + 1} warning: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.log(`⚠️ Statement ${i + 1} exception: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    if (successCount > 0) {
      console.log('✅ API schema fix applied');
      return { success: true, error: null };
    } else {
      console.log('❌ API schema fix failed');
      return { success: false, error: 'All statements failed' };
    }
  } catch (err) {
    console.log(`❌ API schema fix failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testApiFunctions() {
  console.log('\n🧪 Testing API Functions...');
  
  try {
    // Test is_admin function
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
    console.log(`is_admin: ${isAdminError ? '❌ Error' : '✅ Working'} - ${isAdminError?.message || isAdmin}`);
    
    // Test check_admin_access function
    const { data: checkAdmin, error: checkAdminError } = await supabase.rpc('check_admin_access');
    console.log(`check_admin_access: ${checkAdminError ? '❌ Error' : '✅ Working'} - ${checkAdminError?.message || checkAdmin}`);
    
    // Test get_current_user_profile function
    const { data: profile, error: profileError } = await supabase.rpc('get_current_user_profile');
    console.log(`get_current_user_profile: ${profileError ? '❌ Error' : '✅ Working'} - ${profileError?.message || 'Profile data available'}`);
    
    // Test profiles table access
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    console.log(`profiles table: ${profilesError ? '❌ Error' : '✅ Working'} - ${profilesError?.message || 'Table accessible'}`);
    
    return {
      is_admin: !isAdminError,
      check_admin_access: !checkAdminError,
      get_current_user_profile: !profileError,
      profiles_table: !profilesError
    };
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Starting API Schema Fix...\n');
    
    // Apply the fix
    const fixResult = await applyApiSchemaFix();
    
    if (fixResult.success) {
      // Test the functions
      const testResults = await testApiFunctions();
      
      if (testResults) {
        const workingFunctions = Object.values(testResults).filter(Boolean).length;
        const totalFunctions = Object.keys(testResults).length;
        
        console.log(`\n📋 Test Results: ${workingFunctions}/${totalFunctions} functions working`);
        
        if (workingFunctions === totalFunctions) {
          console.log('✅ All functions are working! Admin dashboard should now load correctly.');
        } else {
          console.log('⚠️ Some functions are still not working. Check the errors above.');
        }
      }
    } else {
      console.log(`❌ Fix failed: ${fixResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();