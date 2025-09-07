#!/usr/bin/env node

/**
 * Script to execute SQL fix for loyalty_transactions and transaction_qr_codes
 * This uses the Supabase REST API to execute raw SQL
 */

import { readFileSync } from 'fs';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

async function executeSQLStatements() {
  console.log('🔧 Applying Loyalty Transactions and QR Codes Database Fix');
  console.log('========================================================');
  
  try {
    // Read the SQL fix file
    console.log('📖 Reading fix_loyalty_transactions_and_qr_codes.sql...');
    const sqlContent = readFileSync('fix_loyalty_transactions_and_qr_codes.sql', 'utf8');
    
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
      return true;
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
      console.log('4. Copy the contents of fix_loyalty_transactions_and_qr_codes.sql');
      console.log('5. Paste and execute the SQL script');
      console.log('\n📄 SQL File Location: fix_loyalty_transactions_and_qr_codes.sql');
      
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
    console.log('4. Copy the contents of fix_loyalty_transactions_and_qr_codes.sql');
    console.log('5. Paste and execute the SQL script');
    console.log('\n📄 SQL File Location: fix_loyalty_transactions_and_qr_codes.sql');
    
    return false;
  }
}

// Test the fix after application
async function testFix() {
  console.log('\n🧪 Testing the fix...');
  
  try {
    // Test loyalty_transactions table
    const loyaltyResponse = await fetch(`${SUPABASE_URL}/rest/v1/loyalty_transactions?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    // Test transaction_qr_codes table
    const qrResponse = await fetch(`${SUPABASE_URL}/rest/v1/transaction_qr_codes?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    const loyaltyOk = loyaltyResponse.ok;
    const qrOk = qrResponse.ok;
    
    if (loyaltyOk && qrOk) {
      console.log('✅ Success! Both tables are accessible:');
      console.log('   - loyalty_transactions: ✅ Working');
      console.log('   - transaction_qr_codes: ✅ Working');
      return true;
    } else {
      console.log('❌ Test failed:');
      if (!loyaltyOk) {
        const error = await loyaltyResponse.text();
        console.log('   - loyalty_transactions: ❌ Error -', error);
      } else {
        console.log('   - loyalty_transactions: ✅ Working');
      }
      
      if (!qrOk) {
        const error = await qrResponse.text();
        console.log('   - transaction_qr_codes: ❌ Error -', error);
      } else {
        console.log('   - transaction_qr_codes: ✅ Working');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Loyalty Transactions and QR Codes Fix');
  console.log('================================================');
  
  // First test if the tables already work
  console.log('🔍 Testing current state...');
  const currentlyWorking = await testFix();
  
  if (currentlyWorking) {
    console.log('✅ Both tables are already working! No fix needed.');
    return;
  }
  
  console.log('❌ Tables are not accessible. Applying fix...\n');
  
  // Apply the fix
  const fixApplied = await executeSQLStatements();
  
  if (fixApplied) {
    // Test again
    const fixWorking = await testFix();
    
    if (fixWorking) {
      console.log('\n🎉 SUCCESS! The loyalty transactions and QR codes fix has been applied successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Refresh your admin dashboard');
      console.log('2. Navigate to the Health tab');
      console.log('3. Check that both tables show green ✅ status:');
      console.log('   - Table loyalty_transactions');
      console.log('   - Table transaction_qr_codes');
    } else {
      console.log('\n⚠️  The fix was applied but may need additional configuration.');
      console.log('Please check the admin dashboard health tab for current status.');
    }
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
