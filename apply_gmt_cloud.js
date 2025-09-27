// Apply GMT SQL to Cloud Database
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Cloud Supabase Configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyGMTCloud() {
  console.log('🕐 Applying GMT Timezone Validation to Cloud Database...\n');

  try {
    // Read the SQL file
    const sqlContent = readFileSync('gmt_timezone_validation.sql', 'utf8');
    
    console.log('📝 SQL Content loaded, executing...\n');

    // Split into individual statements for better error handling
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Try to execute as a function call first
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            // If that fails, try direct execution
            const { error: directError } = await supabase
              .from('_sql_exec')
              .select('*')
              .eq('query', statement + ';');
            
            if (directError) {
              console.log(`⚠️  Statement ${i + 1} result:`, directError.message);
              errorCount++;
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
              successCount++;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} failed:`, err.message);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    // Test the functions if any were created
    if (successCount > 0) {
      console.log('\n🧪 Testing GMT validation functions...\n');
      
      // Test the validation function
      const { data: testResult, error: testError } = await supabase
        .rpc('validate_and_convert_to_gmt', { 
          input_date: new Date().toISOString() 
        });
      
      if (testError) {
        console.log('⚠️  GMT validation function test failed:', testError.message);
        console.log('   This is expected if the function creation failed');
      } else {
        console.log('✅ GMT validation function working:', testResult);
      }
    }

    if (errorCount > 0) {
      console.log('\n📋 Manual Application Required:');
      console.log('Some statements failed to execute automatically.');
      console.log('Please apply the SQL manually:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of gmt_timezone_validation.sql');
      console.log('4. Execute the SQL');
    } else {
      console.log('\n🎉 GMT Timezone Validation applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply GMT SQL:', error.message);
    
    console.log('\n📋 Manual Application Required:');
    console.log('1. Copy the contents of gmt_timezone_validation.sql');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and execute the SQL');
    console.log('5. Verify the functions are created');
  }
}

// Run the application
applyGMTCloud();
