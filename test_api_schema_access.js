#!/usr/bin/env node

/**
 * Script to test access to tables in the api schema after the fix
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApiSchemaAccess() {
  console.log('🧪 Testing API Schema Access After Fix');
  console.log('=====================================');
  
  // Test if we can access the tables through the api schema
  console.log('🔍 Testing api.loyalty_transactions...');
  try {
    const { data, error } = await supabase
      .from('api.loyalty_transactions')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   📋 Error details:`, error);
    } else {
      console.log(`   ✅ Success! Found ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log(`   📊 Sample record:`, {
          id: data[0].id,
          loyalty_number: data[0].loyalty_number,
          merchant_id: data[0].merchant_id,
          transaction_amount: data[0].transaction_amount,
          points_earned: data[0].points_earned
        });
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  console.log('\n🔍 Testing api.transaction_qr_codes...');
  try {
    const { data, error } = await supabase
      .from('api.transaction_qr_codes')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   📋 Error details:`, error);
    } else {
      console.log(`   ✅ Success! Found ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log(`   📊 Sample record:`, {
          id: data[0].id,
          qr_code_data: data[0].qr_code_data?.substring(0, 20) + '...',
          merchant_id: data[0].merchant_id,
          transaction_amount: data[0].transaction_amount,
          reward_points: data[0].reward_points,
          is_used: data[0].is_used
        });
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
}

async function testDataInsertion() {
  console.log('\n🧪 Testing Data Insertion in API Schema');
  console.log('======================================');
  
  // Test inserting into api.loyalty_transactions
  console.log('🔍 Testing api.loyalty_transactions insertion...');
  try {
    const testLoyaltyData = {
      loyalty_number: 'TEST' + Date.now(),
      merchant_id: '00000000-0000-0000-0000-000000000000',
      transaction_amount: 15.00,
      points_earned: 1,
      transaction_type: 'test'
    };
    
    const { data, error } = await supabase
      .from('api.loyalty_transactions')
      .insert(testLoyaltyData)
      .select();
    
    if (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
      console.log(`   📋 Error details:`, error);
    } else {
      console.log(`   ✅ Insert successful! ID: ${data[0]?.id}`);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('api.loyalty_transactions')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`);
      } else {
        console.log('   🧹 Test data cleaned up');
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test inserting into api.transaction_qr_codes
  console.log('\n🔍 Testing api.transaction_qr_codes insertion...');
  try {
    const testQrData = {
      qr_code_data: 'TEST_QR_' + Date.now(),
      merchant_id: '00000000-0000-0000-0000-000000000000',
      transaction_amount: 30.00,
      reward_points: 3,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data, error } = await supabase
      .from('api.transaction_qr_codes')
      .insert(testQrData)
      .select();
    
    if (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
      console.log(`   📋 Error details:`, error);
    } else {
      console.log(`   ✅ Insert successful! ID: ${data[0]?.id}`);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('api.transaction_qr_codes')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`);
      } else {
        console.log('   🧹 Test data cleaned up');
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Testing API Schema Access');
  console.log('============================');
  console.log('Testing if the compatibility views in the api schema are working...\n');
  
  await testApiSchemaAccess();
  await testDataInsertion();
  
  console.log('\n📊 Summary');
  console.log('==========');
  console.log('If you see ✅ success messages above, the fix is working!');
  console.log('The tables are accessible through the api schema as expected.');
  console.log('\n📋 Next Steps:');
  console.log('1. Check your admin dashboard health tab');
  console.log('2. The health tab should now show green ✅ for both tables');
  console.log('3. If still showing errors, try refreshing the admin dashboard');
}

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
