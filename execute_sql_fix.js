#!/usr/bin/env node

/**
 * Script to execute SQL fix for subscription plans
 * This uses the Supabase REST API to execute raw SQL
 */

import { readFileSync } from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

async function executeSQLStatements() {
  console.log('🔧 Applying Subscription Plans Database Fix');
  console.log('==========================================');
  
  try {
    // Read the SQL fix file
    console.log('📖 Reading MANUAL_SUBSCRIPTION_PLANS_FIX.sql...');
    const sqlContent = readFileSync('/workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql', 'utf8');
    
    console.log('🚀 Attempting to execute SQL via Supabase API...');
    
    // Try to execute the SQL via Supabase's REST API
    // Note: This approach has limitations and might not work for all SQL statements
    // but it's worth trying for basic operations
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ 
        sql: sqlContent 
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL executed successfully:', result);
    } else {
      const error = await response.text();
      console.log('❌ SQL execution failed via API:', error);
      
      // Fall back to manual instructions
      console.log('\n🔧 Manual Fix Required:');
      console.log('Since automatic execution failed, please apply the fix manually:');
      console.log('\n📋 Steps:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');  
      console.log('3. Navigate to SQL Editor');
      console.log('4. Copy the contents of MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
      console.log('5. Paste and execute the SQL script');
      console.log('\n📄 SQL File Location: /workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    console.log('\n🔧 Manual Fix Required:');
    console.log('Please apply the database fix manually:');
    console.log('\n📋 Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');  
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the contents of MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
    console.log('5. Paste and execute the SQL script');
    console.log('\n📄 SQL File Location: /workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql');
    
    return false;
  }
  
  return true;
}

// Test the fix after application
async function testFix() {
  console.log('\n🧪 Testing the fix...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/merchant_subscription_plans?select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.ok) {
      const plans = await response.json();
      console.log(`✅ Success! Found ${plans.length} subscription plans`);
      
      if (plans.length > 0) {
        console.log('📦 Available plans:');
        plans.forEach(plan => {
          console.log(`   - ${plan.name}: $${plan.price_monthly}/month (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      }
      
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Test failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Subscription Plans Fix');
  console.log('==================================');
  
  // First test if the table already works
  console.log('🔍 Testing current state...');
  const currentlyWorking = await testFix();
  
  if (currentlyWorking) {
    console.log('✅ Subscription plans are already working! No fix needed.');
    return;
  }
  
  console.log('❌ Subscription plans are not accessible. Applying fix...\n');
  
  // Apply the fix
  const fixApplied = await executeSQLStatements();
  
  if (fixApplied) {
    // Test again
    const fixWorking = await testFix();
    
    if (fixWorking) {
      console.log('\n🎉 SUCCESS! The subscription plans fix has been applied successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Log in as an admin user to your application');
      console.log('2. Navigate to Admin Dashboard');
      console.log('3. Click on the "Plans" tab');
      console.log('4. You should now be able to view and manage subscription plans');
    } else {
      console.log('\n⚠️  The fix was applied but may need additional configuration.');
      console.log('Please ensure your user has role = "admin" in the api.profiles table.');
    }
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});