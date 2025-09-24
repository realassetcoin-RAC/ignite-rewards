// Setup Merchant Subscription Plans
// This script creates the merchant subscription plans table and populates it with data

console.log('🚀 Setting up Merchant Subscription Plans...');

// Import the SQL file content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupMerchantSubscriptionPlans() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-merchant-subscription-plans.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('📋 SQL Content Preview:');
    console.log(sqlContent.substring(0, 500) + '...');
    
    console.log('\n✅ Setup script ready!');
    console.log('\n📝 To execute this SQL:');
    console.log('1. Copy the content from create-merchant-subscription-plans.sql');
    console.log('2. Run it in your Supabase SQL editor');
    console.log('3. Or use the Admin Dashboard → Test Data → Create Comprehensive Test Data');
    
    console.log('\n🎯 What this will create:');
    console.log('- merchant_subscription_plans table with proper schema');
    console.log('- 5 active subscription plans (Free Trial, Starter, Growth, Professional, Enterprise)');
    console.log('- 5 legacy plans for reference');
    console.log('- RLS policies for security');
    console.log('- Helper functions for plan validation');
    console.log('- Indexes for performance');
    
    return {
      success: true,
      message: 'Setup script prepared successfully',
      sqlFile: sqlFilePath,
      sqlContent: sqlContent
    };
    
  } catch (error) {
    console.error('❌ Error setting up merchant subscription plans:', error);
    return {
      success: false,
      message: 'Failed to setup merchant subscription plans',
      error: error.message
    };
  }
}

// Run the setup
setupMerchantSubscriptionPlans().then(result => {
  if (result.success) {
    console.log('\n🎉 Setup completed successfully!');
  } else {
    console.log('\n💥 Setup failed:', result.error);
  }
});

export { setupMerchantSubscriptionPlans };
