import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Use the same configuration as the application
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'api'
  }
});

console.log('🔧 Applying Subscription Plans Permission Fix...');
console.log('================================================');

async function applyFix() {
  try {
    // Read the SQL fix file
    const sqlContent = readFileSync('MANUAL_SUBSCRIPTION_PLANS_FIX.sql', 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🔍 Verifying the fix...');
    
    // Test if we can now query the table
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, price_monthly, is_active')
      .limit(5);
    
    if (error) {
      console.error('❌ Verification failed:', error.message);
      
      // Try alternative approach - direct table creation
      console.log('\n🔄 Trying alternative approach...');
      await createTableDirectly();
    } else {
      console.log('✅ Fix verified successfully!');
      console.log(`📊 Found ${data?.length || 0} subscription plans in the table`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Available plans:');
        data.forEach(plan => {
          console.log(`   • ${plan.name}: $${plan.price_monthly}/month (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to apply fix:', error.message);
    
    // Try alternative approach
    console.log('\n🔄 Trying alternative approach...');
    await createTableDirectly();
  }
}

async function createTableDirectly() {
  console.log('🏗️ Creating table and policies directly...');
  
  try {
    // First, let's try to create the table using a simpler approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
        features JSONB DEFAULT '[]'::jsonb,
        trial_days INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `;
    
    // Since we can't execute DDL directly, let's try inserting data first to see if table exists
    console.log('🔍 Testing table existence by attempting insert...');
    
    const { error: insertError } = await supabase
      .from('merchant_subscription_plans')
      .insert([{
        name: 'Basic',
        description: 'Essential features for small businesses',
        price_monthly: 29.99,
        features: ["Basic analytics", "Customer loyalty tracking", "Email support"],
        trial_days: 30,
        is_active: true
      }]);
    
    if (insertError) {
      if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
        console.log('❌ Table does not exist. You need to create it manually.');
        console.log('\n📋 Manual Fix Required:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy and paste the contents of MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
        console.log('5. Click RUN to execute');
        return;
      } else if (insertError.message.includes('duplicate key')) {
        console.log('✅ Table exists and Basic plan already exists');
      } else {
        console.log('⚠️ Insert failed with error:', insertError.message);
      }
    } else {
      console.log('✅ Successfully inserted Basic plan');
    }
    
    // Try to insert other default plans
    const plans = [
      {
        name: 'Premium',
        description: 'Advanced features for growing businesses',
        price_monthly: 79.99,
        features: ["Advanced analytics", "Custom branding", "Priority support", "API access"],
        trial_days: 30,
        is_active: true
      },
      {
        name: 'Enterprise',
        description: 'Full-featured solution for large businesses',
        price_monthly: 199.99,
        features: ["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"],
        trial_days: 30,
        is_active: true
      }
    ];
    
    for (const plan of plans) {
      const { error } = await supabase
        .from('merchant_subscription_plans')
        .insert([plan]);
      
      if (error && !error.message.includes('duplicate key')) {
        console.log(`⚠️ Failed to insert ${plan.name} plan:`, error.message);
      } else {
        console.log(`✅ ${plan.name} plan ready`);
      }
    }
    
    // Final verification
    const { data, error } = await supabase
      .from('merchant_subscription_plans')
      .select('id, name, price_monthly, is_active');
    
    if (error) {
      console.error('❌ Final verification failed:', error.message);
    } else {
      console.log('\n🎉 Fix completed successfully!');
      console.log(`📊 Total plans available: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Available subscription plans:');
        data.forEach(plan => {
          console.log(`   • ${plan.name}: $${plan.price_monthly}/month (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      }
      
      console.log('\n🚀 The admin dashboard "Plans" tab should now work correctly!');
    }
    
  } catch (error) {
    console.error('❌ Alternative approach failed:', error.message);
    console.log('\n📋 Manual action required:');
    console.log('Please apply the SQL fix manually in your Supabase dashboard.');
  }
}

// Run the fix
applyFix();