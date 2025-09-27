/**
 * Apply MVP Completion Scripts using REST API
 * This script uses the Supabase REST API directly to avoid schema cache issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from cloud-supabase.env
dotenv.config({ path: 'cloud-supabase.env' });

// Supabase configuration from cloud-supabase.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables from cloud-supabase.env:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

async function executeSQLFile(filename) {
  try {
    console.log(`\n📄 Executing ${filename}...`);
    
    const filePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Use REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: sqlContent })
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log(`✅ ${filename} completed successfully`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Error executing ${filename}:`, error);
      return { success: false, error: error };
    }
    
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function executeSQLStatement(statement, description) {
  try {
    console.log(`\n📄 ${description}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: statement })
    });
    
    if (response.ok) {
      console.log(`✅ ${description} completed successfully`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Error in ${description}:`, error);
      return { success: false, error: error };
    }
    
  } catch (error) {
    console.error(`❌ Failed ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying table creation...');
  
  const expectedTables = [
    'nft_types', 'user_loyalty_cards', 'user_points', 'loyalty_transactions',
    'user_wallets', 'merchant_cards', 'merchant_subscriptions', 'transaction_qr_codes',
    'subscribers', 'email_templates', 'email_notifications', 'email_delivery_logs',
    'loyalty_networks', 'user_loyalty_links', 'loyalty_otp_sessions',
    'loyalty_point_conversions', 'loyalty_point_balances', 'mfa_sessions'
  ];
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN (${expectedTables.map(t => `'${t}'`).join(', ')})
          ORDER BY table_name
        `
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      const existingTables = result.map(row => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length === 0) {
        console.log('✅ All expected tables exist');
        return true;
      } else {
        console.log('❌ Missing tables:', missingTables.join(', '));
        return false;
      }
    } else {
      console.log('⚠️ Could not verify tables due to API error');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Could not verify tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting MVP Completion Script Application via REST API...');
  console.log('=============================================================');
  console.log('🌐 Target: Cloud Supabase Database');
  console.log('🔗 URL:', supabaseUrl);
  console.log('=============================================================');
  
  // Try to execute SQL files one by one
  const scripts = [
    'complete_mfa_integration.sql',
    'complete_email_notification_system.sql', 
    'complete_third_party_integration.sql',
    'add_missing_database_tables.sql'
  ];
  
  let allSuccess = true;
  
  // Execute all SQL scripts
  for (const script of scripts) {
    const result = await executeSQLFile(script);
    if (!result.success) {
      allSuccess = false;
      console.log(`\n⚠️ ${script} failed, but continuing with other scripts...`);
    }
    
    // Wait a bit between scripts to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (!allSuccess) {
    console.log('\n⚠️ Some scripts failed. Trying alternative approach...');
    console.log('\n💡 Manual Application Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/wndswqvqogeblksrujpg/sql');
    console.log('2. Copy and paste each SQL file content one by one');
    console.log('3. Execute each script manually');
    console.log('\n📁 Files to apply:');
    scripts.forEach(script => console.log(`   - ${script}`));
    return;
  }
  
  // Verify implementation
  console.log('\n🔍 Verifying implementation...');
  console.log('================================');
  
  const tablesOk = await verifyTables();
  
  // Summary
  console.log('\n📊 MVP Completion Summary');
  console.log('==========================');
  console.log('✅ Database Tables:', tablesOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  
  if (tablesOk) {
    console.log('\n🎉 MVP COMPLETION SUCCESSFUL!');
    console.log('All high-priority features have been implemented.');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the MFA system in the frontend');
    console.log('2. Test email notifications');
    console.log('3. Test third-party loyalty integration');
    console.log('4. Verify all database tables are working');
    console.log('5. Run comprehensive application tests');
  } else {
    console.log('\n⚠️ MVP COMPLETION PARTIAL');
    console.log('Some features need attention. Please review the errors above.');
  }
}

// Run the script
main().catch(console.error);
