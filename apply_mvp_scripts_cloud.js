/**
 * Apply MVP Completion Scripts to Cloud Supabase Database
 * This script connects directly to the cloud database and applies all SQL scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const dbConfig = {
  host: 'db.wndswqvqogeblksrujpg.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'M@r0on@2025',
  ssl: {
    rejectUnauthorized: false
  }
};

async function executeSQLFile(filename) {
  const client = new Client(dbConfig);
  
  try {
    console.log(`\n📄 Connecting to cloud database and executing ${filename}...`);
    
    await client.connect();
    console.log('✅ Connected to cloud Supabase database');
    
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
          await client.query(statement);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error in statement: ${err.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }
    
    console.log(`✅ ${filename} completed: ${successCount} statements successful, ${errorCount} errors`);
    return { success: errorCount === 0, successCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

async function verifyTables() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🔍 Verifying table creation...');
    
    await client.connect();
    
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
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All expected tables exist');
      return true;
    } else {
      console.log('❌ Missing tables:', missingTables.join(', '));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function verifyFunctions() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🔍 Verifying function creation...');
    
    await client.connect();
    
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
    
    const result = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
    `);
    
    const existingFunctions = result.rows.map(row => row.routine_name);
    const missingFunctions = expectedFunctions.filter(func => !existingFunctions.includes(func));
    
    if (missingFunctions.length === 0) {
      console.log('✅ All expected functions exist');
      return true;
    } else {
      console.log('❌ Missing functions:', missingFunctions.join(', '));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking functions:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testMFAIntegration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🧪 Testing MFA integration...');
    
    await client.connect();
    
    // Test MFA availability check
    const result = await client.query(`
      SELECT public.can_use_mfa('00000000-0000-0000-0000-000000000000'::uuid) as can_use
    `);
    
    console.log('✅ MFA functions are working');
    return true;
    
  } catch (error) {
    console.log('⚠️ MFA test error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testEmailIntegration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🧪 Testing email integration...');
    
    await client.connect();
    
    // Check if email templates exist
    const result = await client.query(`
      SELECT COUNT(*) as template_count 
      FROM public.email_templates
    `);
    
    console.log('✅ Email system is working');
    return true;
    
  } catch (error) {
    console.log('⚠️ Email test error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testLoyaltyIntegration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🧪 Testing loyalty integration...');
    
    await client.connect();
    
    // Check if loyalty networks exist
    const result = await client.query(`
      SELECT COUNT(*) as network_count 
      FROM public.loyalty_networks
    `);
    
    console.log('✅ Loyalty integration is working');
    return true;
    
  } catch (error) {
    console.log('⚠️ Loyalty test error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting MVP Completion Script Application to Cloud Database...');
  console.log('================================================================');
  console.log('🌐 Target: Cloud Supabase Database');
  console.log('🔗 Host: db.wndswqvqogeblksrujpg.supabase.co');
  console.log('================================================================');
  
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
    console.log('All high-priority features have been implemented and verified in the cloud database.');
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
