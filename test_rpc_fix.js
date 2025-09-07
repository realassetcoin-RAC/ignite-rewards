// Test script to verify RPC functions are working after applying the fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './database-config.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'api' }
});

async function testRPCFunctions() {
  console.log('🧪 Testing RPC Functions After Fix...\n');
  
  // Test is_admin RPC
  console.log('1. Testing is_admin RPC...');
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.log('❌ is_admin RPC Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ is_admin RPC Success:', data);
    }
  } catch (e) {
    console.log('❌ is_admin RPC Exception:', e.message);
  }
  
  // Test check_admin_access RPC
  console.log('\n2. Testing check_admin_access RPC...');
  try {
    const { data, error } = await supabase.rpc('check_admin_access');
    if (error) {
      console.log('❌ check_admin_access RPC Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ check_admin_access RPC Success:', data);
    }
  } catch (e) {
    console.log('❌ check_admin_access RPC Exception:', e.message);
  }
  
  // Test profiles table access
  console.log('\n3. Testing profiles table access...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      console.log('❌ Profiles table Error:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Profiles table Success:', data?.length || 0, 'profiles found');
    }
  } catch (e) {
    console.log('❌ Profiles table Exception:', e.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see ✅ for all tests, the RPC fix was successful!');
  console.log('If you see ❌ errors, please apply the SQL fix from RPC_FIX_INSTRUCTIONS.md');
}

testRPCFunctions();
