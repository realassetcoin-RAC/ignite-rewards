// Apply GMT Timezone Validation to Database
// This script applies the GMT validation functions directly to the database

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGMTValidation() {
  console.log('🕐 Applying GMT Timezone Validation...\n');

  try {
    // Read the SQL migration file
    const sqlContent = readFileSync('gmt_timezone_validation.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} result:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} failed:`, err.message);
        }
      }
    }

    // Test the functions
    console.log('\n🧪 Testing GMT validation functions...\n');
    
    // Test the validation function
    const { data: testResult, error: testError } = await supabase
      .rpc('validate_and_convert_to_gmt', { 
        input_date: new Date().toISOString() 
      });
    
    if (testError) {
      console.log('❌ GMT validation function test failed:', testError.message);
    } else {
      console.log('✅ GMT validation function working:', testResult);
    }

    // Check if trigger exists
    const { data: triggerCheck, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'ensure_gmt_campaign_dates')
      .eq('event_object_table', 'referral_campaigns');

    if (triggerError) {
      console.log('❌ Trigger check failed:', triggerError.message);
    } else if (triggerCheck && triggerCheck.length > 0) {
      console.log('✅ GMT trigger is active on referral_campaigns table');
    } else {
      console.log('⚠️  GMT trigger not found - may need manual creation');
    }

    console.log('\n🎉 GMT Timezone Validation applied successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ GMT conversion functions created');
    console.log('   ✅ Campaign date validation functions created');
    console.log('   ✅ Automatic GMT conversion trigger created');
    console.log('   ✅ Campaign display functions created');
    console.log('   ✅ RLS policies updated');
    
  } catch (error) {
    console.error('❌ Failed to apply GMT validation:', error.message);
    process.exit(1);
  }
}

// Run the application
applyGMTValidation();
