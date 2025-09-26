// Test Supabase Connection Script
// This script tests the Supabase connection directly

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created successfully');
    
    // Test 1: Basic connection
    console.log('🔍 Test 1: Basic connection test...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table test failed:', profilesError);
    } else {
      console.log('✅ Profiles table test successful');
    }
    
    // Test 2: NFT types table
    console.log('🔍 Test 2: NFT types table test...');
    const { data: nftData, error: nftError } = await supabase
      .from('nft_types')
      .select('*')
      .limit(5);
    
    if (nftError) {
      console.error('❌ NFT types table test failed:', nftError);
    } else {
      console.log('✅ NFT types table test successful');
      console.log(`Found ${nftData.length} NFT types`);
    }
    
    // Test 3: Merchant subscription plans
    console.log('🔍 Test 3: Merchant subscription plans test...');
    const { data: plansData, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('*')
      .limit(5);
    
    if (plansError) {
      console.error('❌ Merchant subscription plans test failed:', plansError);
    } else {
      console.log('✅ Merchant subscription plans test successful');
      console.log(`Found ${plansData.length} subscription plans`);
    }
    
    // Test 4: RPC function test
    console.log('🔍 Test 4: RPC function test...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
    
    if (rpcError) {
      console.error('❌ RPC function test failed:', rpcError);
    } else {
      console.log('✅ RPC function test successful');
    }
    
    console.log('\n🎉 Database connection test completed!');
    console.log('✅ The database is working and accessible');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.log('💡 Check your internet connection and Supabase service status');
  }
}

testConnection();
