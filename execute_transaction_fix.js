#!/usr/bin/env node

/**
 * Script to execute SQL fix for loyalty_transactions and transaction_qr_codes
 * This uses direct PostgreSQL connection to execute the SQL
 */

import { readFileSync } from 'fs';
import { Client } from 'pg';

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

async function executeSQLFix() {
  console.log('🔧 Applying Loyalty Transactions and QR Codes Database Fix');
  console.log('========================================================');
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Read the SQL fix file
    console.log('📖 Reading fix_loyalty_transactions_and_qr_codes.sql...');
    const sqlContent = readFileSync('fix_loyalty_transactions_and_qr_codes.sql', 'utf8');
    
    // Execute the SQL
    console.log('🚀 Executing SQL migration...');
    const result = await client.query(sqlContent);
    
    console.log('✅ SQL migration executed successfully!');
    console.log('📊 Result:', result);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    console.error('📋 Full error:', error);
    return false;
  } finally {
    // Always close the connection
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Test the fix after application
async function testFix() {
  console.log('\n🧪 Testing the fix...');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Test loyalty_transactions table
    console.log('🔍 Testing loyalty_transactions table...');
    const loyaltyResult = await client.query('SELECT COUNT(*) as count FROM public.loyalty_transactions');
    console.log(`✅ loyalty_transactions: ${loyaltyResult.rows[0].count} records`);
    
    // Test transaction_qr_codes table
    console.log('🔍 Testing transaction_qr_codes table...');
    const qrResult = await client.query('SELECT COUNT(*) as count FROM public.transaction_qr_codes');
    console.log(`✅ transaction_qr_codes: ${qrResult.rows[0].count} records`);
    
    // Test api views
    console.log('🔍 Testing API compatibility views...');
    const apiLoyaltyResult = await client.query('SELECT COUNT(*) as count FROM api.loyalty_transactions');
    console.log(`✅ api.loyalty_transactions view: ${apiLoyaltyResult.rows[0].count} records`);
    
    const apiQrResult = await client.query('SELECT COUNT(*) as count FROM api.transaction_qr_codes');
    console.log(`✅ api.transaction_qr_codes view: ${apiQrResult.rows[0].count} records`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Loyalty Transactions and QR Codes Fix');
  console.log('================================================');
  
  // First test current state
  console.log('🔍 Testing current state...');
  const currentlyWorking = await testFix();
  
  if (currentlyWorking) {
    console.log('✅ Both tables are already working! No fix needed.');
    return;
  }
  
  console.log('❌ Tables need fixing. Applying migration...\n');
  
  // Apply the fix
  const fixApplied = await executeSQLFix();
  
  if (fixApplied) {
    // Test again
    console.log('\n🧪 Testing after fix...');
    const fixWorking = await testFix();
    
    if (fixWorking) {
      console.log('\n🎉 SUCCESS! The loyalty transactions and QR codes fix has been applied successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Refresh your admin dashboard');
      console.log('2. Navigate to the Health tab');
      console.log('3. Check that both tables show green ✅ status:');
      console.log('   - Table loyalty_transactions');
      console.log('   - Table transaction_qr_codes');
    } else {
      console.log('\n⚠️  The fix was applied but may need additional configuration.');
      console.log('Please check the admin dashboard health tab for current status.');
    }
  } else {
    console.log('\n❌ Fix failed. Please check the error messages above.');
    console.log('You may need to apply the fix manually via the Supabase dashboard.');
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
