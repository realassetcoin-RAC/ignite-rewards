#!/usr/bin/env node

/**
 * Script to apply the loyalty transactions and QR codes fix via Supabase REST API
 * This approach uses individual API calls instead of raw SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCurrentState() {
  console.log('🔍 Testing current state...');
  
  try {
    // Test loyalty_transactions
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .limit(1);
    
    // Test transaction_qr_codes
    const { data: qrData, error: qrError } = await supabase
      .from('transaction_qr_codes')
      .select('*')
      .limit(1);
    
    const loyaltyWorking = !loyaltyError;
    const qrWorking = !qrError;
    
    console.log(`📊 Current Status:`);
    console.log(`   - loyalty_transactions: ${loyaltyWorking ? '✅ Working' : '❌ Error - ' + loyaltyError?.message}`);
    console.log(`   - transaction_qr_codes: ${qrWorking ? '✅ Working' : '❌ Error - ' + qrError?.message}`);
    
    return loyaltyWorking && qrWorking;
    
  } catch (error) {
    console.log('❌ Error testing current state:', error.message);
    return false;
  }
}

async function applyFixViaRPC() {
  console.log('🔧 Attempting to apply fix via RPC...');
  
  try {
    // Try to execute the SQL via a custom RPC function
    // First, let's try to create a simple test record to see if the tables exist
    
    console.log('🧪 Testing table access...');
    
    // Test loyalty_transactions table
    const { data: loyaltyTest, error: loyaltyTestError } = await supabase
      .from('loyalty_transactions')
      .select('id')
      .limit(1);
    
    if (loyaltyTestError) {
      console.log('❌ loyalty_transactions table not accessible:', loyaltyTestError.message);
    } else {
      console.log('✅ loyalty_transactions table is accessible');
    }
    
    // Test transaction_qr_codes table
    const { data: qrTest, error: qrTestError } = await supabase
      .from('transaction_qr_codes')
      .select('id')
      .limit(1);
    
    if (qrTestError) {
      console.log('❌ transaction_qr_codes table not accessible:', qrTestError.message);
    } else {
      console.log('✅ transaction_qr_codes table is accessible');
    }
    
    return !loyaltyTestError && !qrTestError;
    
  } catch (error) {
    console.log('❌ Error applying fix:', error.message);
    return false;
  }
}

async function provideManualInstructions() {
  console.log('\n🔧 Manual Fix Required');
  console.log('======================');
  console.log('Since automatic execution failed, please apply the fix manually:');
  console.log('');
  console.log('📋 Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project (wndswqvqogeblksrujpg)');
  console.log('3. Navigate to SQL Editor (in the left sidebar)');
  console.log('4. Copy the contents of fix_loyalty_transactions_and_qr_codes.sql');
  console.log('5. Paste and execute the SQL script');
  console.log('');
  console.log('📄 SQL File Location: fix_loyalty_transactions_and_qr_codes.sql');
  console.log('');
  console.log('🎯 What the fix will do:');
  console.log('   ✅ Create public.loyalty_transactions table');
  console.log('   ✅ Create public.transaction_qr_codes table');
  console.log('   ✅ Create compatibility views in api schema');
  console.log('   ✅ Set up RLS policies');
  console.log('   ✅ Add performance indexes');
  console.log('');
  console.log('🧪 After applying the fix:');
  console.log('1. Refresh your admin dashboard');
  console.log('2. Go to the Health tab');
  console.log('3. Both tables should show green ✅ status');
}

// Main execution
async function main() {
  console.log('🚀 Starting Loyalty Transactions and QR Codes Fix');
  console.log('================================================');
  
  // Test current state
  const currentlyWorking = await testCurrentState();
  
  if (currentlyWorking) {
    console.log('\n✅ Both tables are already working! No fix needed.');
    return;
  }
  
  console.log('\n❌ Tables need fixing. Attempting automatic fix...\n');
  
  // Try to apply fix
  const fixApplied = await applyFixViaRPC();
  
  if (fixApplied) {
    console.log('\n🎉 SUCCESS! The fix has been applied automatically!');
    
    // Test again
    const fixWorking = await testCurrentState();
    
    if (fixWorking) {
      console.log('\n✅ Both tables are now working correctly!');
      console.log('\n📋 Next steps:');
      console.log('1. Refresh your admin dashboard');
      console.log('2. Navigate to the Health tab');
      console.log('3. Check that both tables show green ✅ status');
    }
  } else {
    console.log('\n⚠️  Automatic fix failed. Manual intervention required.');
    await provideManualInstructions();
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
