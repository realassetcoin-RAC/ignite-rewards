import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleVerify() {
  console.log('🔍 Simple Database Verification\n');

  const tables = [
    'referral_campaigns',
    'loyalty_networks', 
    'asset_initiatives',
    'admin_feature_controls'
  ];

  let success = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        success = false;
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      success = false;
    }
  }

  if (success) {
    console.log('\n🎉 Database verification successful!');
    console.log('✅ All required tables exist and are accessible');
  } else {
    console.log('\n⚠️  Database verification failed');
    console.log('Please run the SQL scripts in your Supabase dashboard');
  }
}

simpleVerify();
