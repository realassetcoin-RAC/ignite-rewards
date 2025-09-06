import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

async function debugConnection() {
  console.log('🔍 DEBUG: Connection and Schema Issues\n');
  
  // Test 1: Different schema configurations
  console.log('1. Testing different schema configurations:');
  
  const configs = [
    { name: 'Default (no schema)', client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY) },
    { name: 'API schema', client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'api' } }) },
    { name: 'Public schema', client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'public' } }) }
  ];
  
  for (const config of configs) {
    console.log(`\n   Testing ${config.name}:`);
    
    // Test basic connection
    try {
      const { data: { user }, error: authError } = await config.client.auth.getUser();
      if (authError) {
        console.log(`     Auth: ❌ ${authError.message}`);
      } else {
        console.log(`     Auth: ✅ ${user ? 'Authenticated' : 'Anonymous'}`);
      }
    } catch (error) {
      console.log(`     Auth: ❌ Exception - ${error.message}`);
    }
    
    // Test merchant_subscription_plans table
    try {
      const { data, error } = await config.client
        .from('merchant_subscription_plans')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`     Plans: ❌ ${error.message}`);
      } else {
        console.log(`     Plans: ✅ ${data?.length || 0} records accessible`);
      }
    } catch (error) {
      console.log(`     Plans: ❌ Exception - ${error.message}`);
    }
    
    // Test profiles table
    try {
      const { data, error } = await config.client
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`     Profiles: ❌ ${error.message}`);
      } else {
        console.log(`     Profiles: ✅ ${data?.length || 0} records accessible`);
      }
    } catch (error) {
      console.log(`     Profiles: ❌ Exception - ${error.message}`);
    }
  }
  
  // Test 2: Raw API calls
  console.log('\n2. Testing raw API calls:');
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };
  
  // Test different endpoints
  const endpoints = [
    '/rest/v1/merchant_subscription_plans?select=*&limit=1',
    '/rest/v1/profiles?select=*&limit=1'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SUPABASE_URL}${endpoint}`, { headers });
      console.log(`   ${endpoint}:`);
      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Data: ✅ ${Array.isArray(data) ? data.length : 'Non-array'} records`);
      } else {
        const errorText = await response.text();
        console.log(`     Error: ❌ ${errorText}`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Exception - ${error.message}`);
    }
  }
  
  // Test 3: Schema information
  console.log('\n3. Testing schema information:');
  
  try {
    const schemaClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'information_schema' } });
    const { data, error } = await schemaClient
      .from('tables')
      .select('table_schema, table_name')
      .in('table_name', ['merchant_subscription_plans', 'profiles'])
      .limit(10);
    
    if (error) {
      console.log(`   Schema info: ❌ ${error.message}`);
    } else {
      console.log(`   Schema info: ✅ Found ${data?.length || 0} matching tables`);
      data?.forEach(table => {
        console.log(`     - ${table.table_schema}.${table.table_name}`);
      });
    }
  } catch (error) {
    console.log(`   Schema info: ❌ Exception - ${error.message}`);
  }
  
  console.log('\n📋 ANALYSIS:');
  console.log('This debug will help identify:');
  console.log('• Which schema configuration works (if any)');
  console.log('• Whether the issue is with Supabase client or raw API');
  console.log('• What tables actually exist and in which schemas');
  console.log('• Whether the connection/authentication is working');
  console.log('\nIf ALL configurations show permission denied, the issue may be:');
  console.log('• Database-level permissions not properly set');
  console.log('• RLS still enabled despite the nuclear fix');
  console.log('• Tables not actually created in the expected schemas');
  console.log('• API key or connection issues');
}

debugConnection().catch(console.error);