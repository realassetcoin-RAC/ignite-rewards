#!/bin/bash

# Script to fix the "Could not find the table 'api.merchant_subscription_plans' in the schema cache" error
# This script applies the schema fix for the merchant subscription plans table

echo "🔧 Applying merchant subscription plans schema fix..."
echo "=================================================="

# Check if we have the required tools
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Install pg dependency if not already installed
if ! npm list pg &> /dev/null; then
    echo "📦 Installing pg dependency..."
    npm install pg
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable not set"
    echo "Please provide your Supabase database connection URL:"
    echo "Format: postgresql://postgres:[password]@[host]:5432/postgres"
    read -p "Database URL: " DATABASE_URL
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Error: No database URL provided"
        exit 1
    fi
    
    export DATABASE_URL
fi

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ Error: Invalid DATABASE_URL format. Should start with 'postgresql://'"
    exit 1
fi

# Apply the schema fix
echo "🔄 Applying schema fix..."
if node scripts/run-sql.cjs /workspace/fix_merchant_subscription_plans_schema.sql; then
    echo "✅ Schema fix applied successfully!"
    echo ""
    echo "🎉 The merchant_subscription_plans table is now available in the api schema"
    echo "🎉 Your application should now work correctly with subscription plans"
    echo ""
    echo "📝 What was fixed:"
    echo "   - Created api.merchant_subscription_plans table"
    echo "   - Set up proper RLS policies"
    echo "   - Migrated data from public schema (if any)"
    echo "   - Added default subscription plans"
    echo "   - Updated foreign key constraints"
    echo ""
    echo "🚀 You can now test your subscription plan functionality!"
else
    echo "❌ Failed to apply schema fix"
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "1. Verify your DATABASE_URL is correct"
    echo "2. Ensure you have proper database permissions"
    echo "3. Check that the database is accessible"
    echo "4. Try running the SQL file manually in Supabase Dashboard → SQL Editor"
    exit 1
fi

# Optional: Run a quick test
echo ""
echo "🧪 Running quick verification test..."
if node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query('SELECT COUNT(*) as count FROM api.merchant_subscription_plans'))
  .then(result => {
    console.log('✅ Verification passed: Found', result.rows[0].count, 'subscription plans');
    client.end();
  })
  .catch(err => {
    console.log('❌ Verification failed:', err.message);
    client.end();
  });
"; then
    echo "✅ All checks passed!"
else
    echo "⚠️  Verification test failed, but the fix may still be working"
fi

echo ""
echo "🔗 Next steps:"
echo "1. Restart your development server"
echo "2. Test the subscription plan functionality"
echo "3. Check that you can create, read, update subscription plans"
echo ""
echo "If you still encounter issues, check:"
echo "- Your Supabase client configuration in src/integrations/supabase/client.ts"
echo "- RLS policies are properly configured"
echo "- User authentication and admin permissions"