#!/usr/bin/env node

/**
 * Script to verify that the loyalty transactions and QR codes fix was successful
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTables() {
  console.log('🧪 Testing Table Access After Fix');
  console.log('=================================');
  
  const results = {
    publicLoyalty: { accessible: false, error: null },
    publicQr: { accessible: false, error: null },
    apiLoyalty: { accessible: false, error: null },
    apiQr: { accessible: false, error: null }
  };
  
  // Test public.loyalty_transactions
  console.log('🔍 Testing public.loyalty_transactions...');
  try {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      results.publicLoyalty.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      results.publicLoyalty.accessible = true;
      console.log(`   ✅ Accessible (${data?.length || 0} records)`);
    }
  } catch (err) {
    results.publicLoyalty.error = err.message;
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test public.transaction_qr_codes
  console.log('🔍 Testing public.transaction_qr_codes...');
  try {
    const { data, error } = await supabase
      .from('transaction_qr_codes')
      .select('*')
      .limit(1);
    
    if (error) {
      results.publicQr.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      results.publicQr.accessible = true;
      console.log(`   ✅ Accessible (${data?.length || 0} records)`);
    }
  } catch (err) {
    results.publicQr.error = err.message;
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test api.loyalty_transactions (compatibility view)
  console.log('🔍 Testing api.loyalty_transactions (compatibility view)...');
  try {
    const { data, error } = await supabase
      .from('api.loyalty_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      results.apiLoyalty.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      results.apiLoyalty.accessible = true;
      console.log(`   ✅ Accessible (${data?.length || 0} records)`);
    }
  } catch (err) {
    results.apiLoyalty.error = err.message;
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test api.transaction_qr_codes (compatibility view)
  console.log('🔍 Testing api.transaction_qr_codes (compatibility view)...');
  try {
    const { data, error } = await supabase
      .from('api.transaction_qr_codes')
      .select('*')
      .limit(1);
    
    if (error) {
      results.apiQr.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      results.apiQr.accessible = true;
      console.log(`   ✅ Accessible (${data?.length || 0} records)`);
    }
  } catch (err) {
    results.apiQr.error = err.message;
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  return results;
}

async function testDataInsertion() {
  console.log('\n🧪 Testing Data Insertion');
  console.log('=========================');
  
  // Test inserting into loyalty_transactions
  console.log('🔍 Testing loyalty_transactions insertion...');
  try {
    const testLoyaltyData = {
      loyalty_number: 'TEST123',
      merchant_id: '00000000-0000-0000-0000-000000000000',
      transaction_amount: 10.00,
      points_earned: 1,
      transaction_type: 'test'
    };
    
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .insert(testLoyaltyData)
      .select();
    
    if (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Insert successful (ID: ${data[0]?.id})`);
      
      // Clean up test data
      await supabase
        .from('loyalty_transactions')
        .delete()
        .eq('id', data[0].id);
      console.log('   🧹 Test data cleaned up');
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
  
  // Test inserting into transaction_qr_codes
  console.log('🔍 Testing transaction_qr_codes insertion...');
  try {
    const testQrData = {
      qr_code_data: 'TEST_QR_' + Date.now(),
      merchant_id: '00000000-0000-0000-0000-000000000000',
      transaction_amount: 25.00,
      reward_points: 2,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };
    
    const { data, error } = await supabase
      .from('transaction_qr_codes')
      .insert(testQrData)
      .select();
    
    if (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Insert successful (ID: ${data[0]?.id})`);
      
      // Clean up test data
      await supabase
        .from('transaction_qr_codes')
        .delete()
        .eq('id', data[0].id);
      console.log('   🧹 Test data cleaned up');
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Verifying Fix Success');
  console.log('========================');
  console.log('Testing if the loyalty transactions and QR codes fix worked...\n');
  
  // Test table access
  const tableResults = await testTables();
  
  // Test data insertion
  const insertionSuccess = await testDataInsertion();
  
  // Summary
  console.log('\n📊 Fix Verification Summary');
  console.log('===========================');
  
  const publicTablesWorking = tableResults.publicLoyalty.accessible && tableResults.publicQr.accessible;
  const apiViewsWorking = tableResults.apiLoyalty.accessible && tableResults.apiQr.accessible;
  
  console.log(`✅ Public Tables: ${publicTablesWorking ? 'Working' : 'Issues detected'}`);
  console.log(`   - loyalty_transactions: ${tableResults.publicLoyalty.accessible ? '✅' : '❌'}`);
  console.log(`   - transaction_qr_codes: ${tableResults.publicQr.accessible ? '✅' : '❌'}`);
  
  console.log(`✅ API Compatibility Views: ${apiViewsWorking ? 'Working' : 'Issues detected'}`);
  console.log(`   - api.loyalty_transactions: ${tableResults.apiLoyalty.accessible ? '✅' : '❌'}`);
  console.log(`   - api.transaction_qr_codes: ${tableResults.apiQr.accessible ? '✅' : '❌'}`);
  
  console.log(`✅ Data Operations: ${insertionSuccess ? 'Working' : 'Issues detected'}`);
  
  if (publicTablesWorking && apiViewsWorking && insertionSuccess) {
    console.log('\n🎉 SUCCESS! The fix is working perfectly!');
    console.log('\n📋 Next Steps:');
    console.log('1. Refresh your admin dashboard');
    console.log('2. Go to the Health tab');
    console.log('3. Both tables should now show green ✅ status:');
    console.log('   - Table loyalty_transactions');
    console.log('   - Table transaction_qr_codes');
    console.log('\n✨ The admin dashboard health tab errors should now be resolved!');
  } else {
    console.log('\n⚠️  Some issues detected. The fix may need additional work.');
    console.log('\n🔧 Troubleshooting:');
    if (!publicTablesWorking) {
      console.log('- Public tables are not accessible');
    }
    if (!apiViewsWorking) {
      console.log('- API compatibility views are not working');
    }
    if (!insertionSuccess) {
      console.log('- Data insertion tests failed');
    }
  }
}

main().catch(error => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});
