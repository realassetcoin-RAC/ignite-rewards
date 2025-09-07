// Test script to verify all RPC functions are working correctly
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

async function testAllRPCFunctions() {
  console.log('🧪 Testing All RPC Functions...\n');
  
  const tests = [
    {
      name: 'is_admin',
      test: () => supabase.rpc('is_admin'),
      expectedType: 'boolean'
    },
    {
      name: 'check_admin_access',
      test: () => supabase.rpc('check_admin_access'),
      expectedType: 'boolean'
    },
    {
      name: 'get_current_user_profile',
      test: () => supabase.rpc('get_current_user_profile'),
      expectedType: 'array'
    },
    {
      name: 'generate_referral_code',
      test: () => supabase.rpc('generate_referral_code'),
      expectedType: 'string'
    },
    {
      name: 'can_use_mfa',
      test: () => supabase.rpc('can_use_mfa', { user_id: '00000000-0000-0000-0000-000000000000' }),
      expectedType: 'boolean'
    }
  ];
  
  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    try {
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        errorCount++;
      } else {
        const isValid = test.expectedType === 'array' ? Array.isArray(data) : typeof data === test.expectedType;
        if (isValid) {
          console.log(`✅ ${test.name}: OK - ${test.expectedType} (${test.expectedType === 'array' ? data.length + ' items' : data})`);
          successCount++;
        } else {
          console.log(`⚠️  ${test.name}: WARNING - Expected ${test.expectedType}, got ${typeof data}`);
          warningCount++;
        }
      }
    } catch (e) {
      console.log(`❌ ${test.name}: EXCEPTION - ${e.message}`);
      errorCount++;
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 All RPC functions are working correctly!');
  } else if (errorCount === 0) {
    console.log('\n✅ All RPC functions are accessible (some warnings are expected)');
  } else {
    console.log('\n❌ Some RPC functions need attention');
  }
}

testAllRPCFunctions();
