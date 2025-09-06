#!/usr/bin/env node

/**
 * Apply referrals schema fix to resolve "Could not find the table 'api.user_referrals' in the schema cache" error
 * This script ensures the user_referrals table exists in the public schema with proper permissions
 */

const fs = require('fs');
const path = require('path');

async function applyReferralsSchemaFix() {
  try {
    console.log('🔧 Applying referrals schema fix...');
    
    // Read the SQL fix file
    const sqlFixPath = path.join(__dirname, 'fix_referrals_schema_error.sql');
    const sqlContent = fs.readFileSync(sqlFixPath, 'utf8');
    
    console.log('📄 SQL fix file loaded successfully');
    console.log('📋 Fix includes:');
    console.log('   - Create user_referrals table in public schema');
    console.log('   - Set up proper RLS policies');
    console.log('   - Grant necessary permissions');
    console.log('   - Create indexes for performance');
    console.log('   - Insert default data');
    console.log('   - Verify table accessibility');
    
    // Save the SQL content to a file that can be executed
    const outputPath = path.join(__dirname, 'REFERRALS_SCHEMA_FIX.sql');
    fs.writeFileSync(outputPath, sqlContent);
    
    console.log(`✅ SQL fix saved to: ${outputPath}`);
    console.log('');
    console.log('📝 To apply this fix:');
    console.log('   1. Copy the contents of REFERRALS_SCHEMA_FIX.sql');
    console.log('   2. Execute it in your Supabase SQL editor');
    console.log('   3. Or run: supabase db reset --linked');
    console.log('');
    console.log('🔍 The fix will:');
    console.log('   - Ensure user_referrals table exists in public schema');
    console.log('   - Set up proper Row Level Security policies');
    console.log('   - Grant authenticated users access to the table');
    console.log('   - Create necessary indexes for performance');
    console.log('   - Insert default referral campaign data');
    console.log('   - Verify the table is accessible');
    console.log('');
    console.log('⚠️  Note: This will recreate the user_referrals table, so any existing data will be lost.');
    console.log('   If you have important referral data, back it up first.');
    
    return true;
  } catch (error) {
    console.error('❌ Error applying referrals schema fix:', error);
    return false;
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  applyReferralsSchemaFix()
    .then(success => {
      if (success) {
        console.log('🎉 Referrals schema fix prepared successfully!');
        process.exit(0);
      } else {
        console.log('💥 Failed to prepare referrals schema fix');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { applyReferralsSchemaFix };
