// Apply GMT SQL directly to database
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

async function applyGMTSQL() {
  console.log('🕐 Applying GMT Timezone Validation SQL...\n');

  try {
    // Read the SQL file
    const sqlContent = readFileSync('gmt_timezone_validation.sql', 'utf8');
    
    console.log('📝 SQL Content loaded, executing...\n');

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec', { 
      sql: sqlContent 
    });

    if (error) {
      console.error('❌ SQL execution failed:', error.message);
      
      // Try alternative approach - execute individual statements
      console.log('\n🔄 Trying alternative approach with individual statements...\n');
      
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.trim()) {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          try {
            const { error: stmtError } = await supabase.rpc('exec', { 
              sql: statement + ';' 
            });
            
            if (stmtError) {
              console.log(`⚠️  Statement ${i + 1} result:`, stmtError.message);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } catch (err) {
            console.log(`❌ Statement ${i + 1} failed:`, err.message);
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully:', data);
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

    console.log('\n🎉 GMT Timezone Validation SQL applied!');
    
  } catch (error) {
    console.error('❌ Failed to apply GMT SQL:', error.message);
    
    // Try using the SQL editor approach
    console.log('\n📋 Manual Application Required:');
    console.log('1. Copy the contents of gmt_timezone_validation.sql');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and execute the SQL');
    console.log('5. Verify the functions are created');
  }
}

// Run the application
applyGMTSQL();
