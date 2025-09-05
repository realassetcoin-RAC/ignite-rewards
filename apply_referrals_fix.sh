#!/bin/bash

# Script to apply the referrals and subscription plans schema fix
# This resolves the "Database schema configuration error" issues

echo "======================================"
echo "Referrals & Subscription Plans Fix"
echo "======================================"
echo ""

# Check if we have Supabase CLI installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if the SQL file exists
if [ ! -f "fix_referrals_subscription_tables.sql" ]; then
    echo "❌ fix_referrals_subscription_tables.sql not found in current directory"
    exit 1
fi

echo "This script will fix the following issues:"
echo "1. Database schema configuration error for referrals feature"
echo "2. Database schema configuration error for subscription plans feature"
echo ""
echo "It will ensure all tables are properly created in the public schema"
echo "with the correct structure and permissions."
echo ""

# Get Supabase connection details
echo "Please provide your Supabase database connection details:"
echo "(You can find these in your Supabase project settings)"
echo ""

read -p "Database URL (starts with postgresql://): " DB_URL

if [ -z "$DB_URL" ]; then
    echo "❌ Database URL is required"
    exit 1
fi

echo ""
echo "📝 Applying database fixes..."
echo ""

# Apply the fix using psql
if command -v psql &> /dev/null; then
    psql "$DB_URL" -f fix_referrals_subscription_tables.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database fixes applied successfully!"
    else
        echo "❌ Failed to apply database fixes"
        exit 1
    fi
else
    echo "psql is not installed. Trying alternative method..."
    echo ""
    echo "You can apply the fix manually by:"
    echo "1. Going to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of fix_referrals_subscription_tables.sql"
    echo "4. Click 'Run'"
fi

echo ""
echo "======================================"
echo "Next Steps:"
echo "======================================"
echo ""
echo "1. Refresh your application"
echo "2. The referrals and subscription plans features should now work properly"
echo "3. If you still see errors, check that your user has the 'admin' role in the profiles table"
echo ""
echo "To verify the fix worked, you can run this SQL in Supabase SQL Editor:"
echo ""
echo "SELECT COUNT(*) FROM public.user_referrals;"
echo "SELECT COUNT(*) FROM public.merchant_subscription_plans;"
echo "SELECT COUNT(*) FROM public.referral_campaigns;"
echo ""
echo "All queries should return a count without errors."