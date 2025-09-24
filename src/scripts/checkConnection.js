import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  try {
    // Test basic connection
    console.log('\n🔌 Testing basic connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Error details:', error);
      return false;
    } else {
      console.log('✅ Basic connection successful');
    }

    // Check existing tables
    console.log('\n📋 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');

    if (tablesError) {
      console.log('⚠️  Could not get table list via RPC, trying alternative method...');
      
      // Try to query information_schema directly
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.log('❌ Could not access information_schema:', schemaError.message);
      } else {
        console.log('✅ Found tables:', schemaData?.map(t => t.table_name).join(', ') || 'None');
      }
    } else {
      console.log('✅ Tables found:', tables);
    }

    // Test if we can create a simple table (this will fail if we don't have permissions, which is expected)
    console.log('\n🔧 Testing table creation permissions...');
    const { data: createData, error: createError } = await supabase
      .rpc('create_test_table');

    if (createError) {
      console.log('ℹ️  Table creation test failed (expected):', createError.message);
      console.log('   This is normal - you need to run SQL scripts directly in Supabase dashboard');
    } else {
      console.log('✅ Table creation test passed');
    }

    return true;
  } catch (err) {
    console.log('❌ Connection test failed:', err.message);
    return false;
  }
}

checkConnection().then(success => {
  if (success) {
    console.log('\n🎉 Connection test completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following scripts in order:');
    console.log('   - src/sql/01_create_missing_tables.sql');
    console.log('   - src/sql/02_insert_default_data.sql');
    console.log('4. Then run this verification script again');
  } else {
    console.log('\n❌ Connection test failed. Please check your Supabase configuration.');
  }
});
