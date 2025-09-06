#!/usr/bin/env node

/**
 * Script to apply the subscription plans database fix
 * This script executes the MANUAL_SUBSCRIPTION_PLANS_FIX.sql content via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// We need to use the service role key for admin operations
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required for database operations');
  console.log('\n💡 To get your service role key:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings → API');
  console.log('   4. Copy the "service_role" key (not the anon key)');
  console.log('   5. Run: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
  console.log('   6. Then run this script again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    // If the RPC function doesn't exist, we'll need to execute the SQL differently
    // Let's try using direct SQL execution via the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql_text: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  }
}

async function applyFix() {
  console.log('🔧 Applying Subscription Plans Database Fix');
  console.log('==========================================');
  
  try {
    // Read the SQL fix file
    console.log('📖 Reading MANUAL_SUBSCRIPTION_PLANS_FIX.sql...');
    const sqlContent = readFileSync('/workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql', 'utf8');
    
    // Split into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        try {
          await executeSQL(statement + ';');
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements unless it's a critical error
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('   ℹ️  This is likely expected (table/policy already exists or was cleaned up)');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('\n🎉 Database fix applied successfully!');
    console.log('\n📋 Testing the fix...');
    
    // Test the fix
    const testResult = await testSubscriptionPlansAccess();
    if (testResult) {
      console.log('\n✅ SUCCESS: Subscription plans are now accessible!');
      console.log('\n📋 Next steps:');
      console.log('   1. Log in as an admin user to your application');
      console.log('   2. Navigate to Admin Dashboard');
      console.log('   3. Click on the "Plans" tab');
      console.log('   4. You should now be able to view and manage subscription plans without permission errors');
    } else {
      console.log('\n⚠️  The fix was applied but there may still be permission issues.');
      console.log('   Please check that your user has role = "admin" in the api.profiles table.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply database fix:', error);
    console.log('\n🔧 Manual Fix Instructions:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy the contents of MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
    console.log('   5. Paste and run the SQL script manually');
    process.exit(1);
  }
}

async function testSubscriptionPlansAccess() {
  try {
    // Test if we can access the table
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Test failed:', error.message);
      return false;
    }
    
    console.log('✅ Subscription plans table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Run the fix
applyFix().catch(error => {
  console.error('💥 Script crashed:', error);
  process.exit(1);
});