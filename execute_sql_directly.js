#!/usr/bin/env node

/**
 * Script to execute the SQL fix directly via Supabase REST API
 * This breaks down the SQL into smaller, executable parts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSQLDirectly() {
  console.log('🔧 Executing SQL Fix Directly via Supabase API');
  console.log('==============================================');
  
  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current state...');
    
    // Try to access tables in both schemas
    const { data: apiLoyalty, error: apiLoyaltyError } = await supabase
      .from('api.loyalty_transactions')
      .select('*')
      .limit(1);
    
    const { data: apiQr, error: apiQrError } = await supabase
      .from('api.transaction_qr_codes')
      .select('*')
      .limit(1);
    
    console.log(`   - api.loyalty_transactions: ${apiLoyaltyError ? '❌ ' + apiLoyaltyError.message : '✅ Accessible'}`);
    console.log(`   - api.transaction_qr_codes: ${apiQrError ? '❌ ' + apiQrError.message : '✅ Accessible'}`);
    
    // Step 2: Try to create tables via RPC
    console.log('\n🔨 Step 2: Attempting to create tables...');
    
    // Create loyalty_transactions table
    const { data: loyaltyResult, error: loyaltyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          loyalty_number TEXT NOT NULL,
          merchant_id UUID NOT NULL,
          transaction_amount DECIMAL(10,2) NOT NULL,
          points_earned INTEGER NOT NULL DEFAULT 0,
          transaction_type TEXT NOT NULL DEFAULT 'purchase',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `
    });
    
    if (loyaltyError) {
      console.log('❌ Failed to create loyalty_transactions:', loyaltyError.message);
    } else {
      console.log('✅ Created loyalty_transactions table');
    }
    
    // Create transaction_qr_codes table
    const { data: qrResult, error: qrError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.transaction_qr_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          qr_code_data TEXT NOT NULL UNIQUE,
          merchant_id UUID NOT NULL,
          transaction_amount DECIMAL(10,2) NOT NULL,
          reward_points INTEGER NOT NULL DEFAULT 0,
          used_by_loyalty_number TEXT,
          is_used BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (qrError) {
      console.log('❌ Failed to create transaction_qr_codes:', qrError.message);
    } else {
      console.log('✅ Created transaction_qr_codes table');
    }
    
    // Step 3: Test access to new tables
    console.log('\n🧪 Step 3: Testing new tables...');
    
    const { data: newLoyalty, error: newLoyaltyError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .limit(1);
    
    const { data: newQr, error: newQrError } = await supabase
      .from('transaction_qr_codes')
      .select('*')
      .limit(1);
    
    console.log(`   - public.loyalty_transactions: ${newLoyaltyError ? '❌ ' + newLoyaltyError.message : '✅ Accessible'}`);
    console.log(`   - public.transaction_qr_codes: ${newQrError ? '❌ ' + newQrError.message : '✅ Accessible'}`);
    
    return !newLoyaltyError && !newQrError;
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    return false;
  }
}

async function provideAlternativeInstructions() {
  console.log('\n🔧 Alternative: Use Supabase Dashboard');
  console.log('=====================================');
  console.log('Since direct API execution has limitations, please use the dashboard:');
  console.log('');
  console.log('📋 Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select project: wndswqvqogeblksrujpg');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste this SQL:');
  console.log('');
  
  // Read and display the SQL content
  try {
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('fix_loyalty_transactions_and_qr_codes.sql', 'utf8');
    console.log('```sql');
    console.log(sqlContent);
    console.log('```');
  } catch (error) {
    console.log('(SQL content from fix_loyalty_transactions_and_qr_codes.sql)');
  }
  
  console.log('');
  console.log('5. Click "Run" to execute');
  console.log('6. Check admin dashboard health tab');
}

// Main execution
async function main() {
  console.log('🚀 Starting Direct SQL Execution');
  console.log('===============================');
  
  const success = await executeSQLDirectly();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Tables created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Refresh your admin dashboard');
    console.log('2. Go to Health tab');
    console.log('3. Both tables should show green ✅');
  } else {
    console.log('\n⚠️  Direct execution failed. Using alternative approach...');
    await provideAlternativeInstructions();
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
