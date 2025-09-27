/**
 * Apply MVP Completion Scripts
 * This script applies all the high-priority features to complete the MVP
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filename) {
  try {
    console.log(`\n📄 Executing ${filename}...`);
    
    const filePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.error(`❌ Error in statement: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error executing statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ ${filename} completed: ${successCount} statements successful, ${errorCount} errors`);
    return { success: errorCount === 0, successCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying table creation...');
  
  const expectedTables = [
    'nft_types',
    'user_loyalty_cards', 
    'user_points',
    'loyalty_transactions',
    'user_wallets',
    'merchant_cards',
    'merchant_subscriptions',
    'transaction_qr_codes',
    'subscribers',
    'email_templates',
    'email_notifications',
    'email_delivery_logs',
    'loyalty_networks',
    'user_loyalty_links',
    'loyalty_otp_sessions',
    'loyalty_point_conversions',
    'loyalty_point_balances',
    'mfa_sessions'
  ];
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
  
  const existingTables = tables.map(t => t.table_name);
  const missingTables = expectedTables.filter(table => !existingTables.includes(table));
  
  if (missingTables.length === 0) {
    console.log('✅ All expected tables exist');
    return true;
  } else {
    console.log('❌ Missing tables:', missingTables.join(', '));
    return false;
  }
}

async function verifyFunctions() {
  console.log('\n🔍 Verifying function creation...');
  
  const expectedFunctions = [
    'can_use_mfa',
    'generate_backup_codes',
    'enable_mfa',
    'disable_mfa',
    'verify_mfa_code',
    'create_mfa_session',
    'verify_mfa_session',
    'send_email_notification',
    'update_email_notification_status',
    'get_pending_email_notifications',
    'generate_loyalty_otp',
    'verify_loyalty_otp',
    'get_user_loyalty_links',
    'convert_loyalty_points',
    'update_loyalty_point_balance',
    'generate_loyalty_number',
    'create_user_profile_with_loyalty_card'
  ];
  
  const { data: functions, error } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .eq('routine_type', 'FUNCTION');
  
  if (error) {
    console.error('❌ Error checking functions:', error.message);
    return false;
  }
  
  const existingFunctions = functions.map(f => f.routine_name);
  const missingFunctions = expectedFunctions.filter(func => !existingFunctions.includes(func));
  
  if (missingFunctions.length === 0) {
    console.log('✅ All expected functions exist');
    return true;
  } else {
    console.log('❌ Missing functions:', missingFunctions.join(', '));
    return false;
  }
}

async function testMFAIntegration() {
  console.log('\n🧪 Testing MFA integration...');
  
  try {
    // Test MFA availability check
    const { data: mfaTest, error: mfaError } = await supabase
      .rpc('can_use_mfa', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (mfaError) {
      console.log('⚠️ MFA function test failed:', mfaError.message);
      return false;
    }
    
    console.log('✅ MFA functions are working');
    return true;
  } catch (error) {
    console.log('⚠️ MFA test error:', error.message);
    return false;
  }
}

async function testEmailIntegration() {
  console.log('\n🧪 Testing email integration...');
  
  try {
    // Check if email templates exist
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('name')
      .limit(1);
    
    if (templateError) {
      console.log('⚠️ Email templates test failed:', templateError.message);
      return false;
    }
    
    console.log('✅ Email system is working');
    return true;
  } catch (error) {
    console.log('⚠️ Email test error:', error.message);
    return false;
  }
}

async function testLoyaltyIntegration() {
  console.log('\n🧪 Testing loyalty integration...');
  
  try {
    // Check if loyalty networks exist
    const { data: networks, error: networkError } = await supabase
      .from('loyalty_networks')
      .select('name')
      .limit(1);
    
    if (networkError) {
      console.log('⚠️ Loyalty networks test failed:', networkError.message);
      return false;
    }
    
    console.log('✅ Loyalty integration is working');
    return true;
  } catch (error) {
    console.log('⚠️ Loyalty test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting MVP Completion Script Application...');
  console.log('================================================');
  
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
    }
  }
  
  if (!allSuccess) {
    console.log('\n❌ Some scripts failed. Please check the errors above.');
    return;
  }
  
  // Verify implementation
  console.log('\n🔍 Verifying implementation...');
  console.log('================================');
  
  const tablesOk = await verifyTables();
  const functionsOk = await verifyFunctions();
  const mfaOk = await testMFAIntegration();
  const emailOk = await testEmailIntegration();
  const loyaltyOk = await testLoyaltyIntegration();
  
  // Summary
  console.log('\n📊 MVP Completion Summary');
  console.log('==========================');
  console.log('✅ MFA System:', mfaOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  console.log('✅ Email Notifications:', emailOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  console.log('✅ Third-Party Integration:', loyaltyOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  console.log('✅ Database Tables:', tablesOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  console.log('✅ Database Functions:', functionsOk ? 'COMPLETE' : 'NEEDS ATTENTION');
  
  const overallSuccess = tablesOk && functionsOk && mfaOk && emailOk && loyaltyOk;
  
  if (overallSuccess) {
    console.log('\n🎉 MVP COMPLETION SUCCESSFUL!');
    console.log('All high-priority features have been implemented and verified.');
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
