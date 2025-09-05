#!/bin/bash

# Script to fix the "Failed to save plan: the schema must be one of the following:api" error
# This applies the schema fix for merchant_subscription_plans table

echo "🔧 Fixing Shop Plan Schema Error..."
echo "=================================="

# Check if we have the SQL file
if [ ! -f "fix_shop_plan_schema_error.sql" ]; then
    echo "❌ Error: fix_shop_plan_schema_error.sql not found!"
    exit 1
fi

# Get database URL from user
echo "Please enter your Supabase database URL:"
echo "(You can find this in your Supabase project settings under Settings > Database)"
read -p "Database URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: Database URL is required!"
    exit 1
fi

echo ""
echo "🚀 Applying schema fix..."

# Apply the SQL fix
if psql "$DATABASE_URL" -f fix_shop_plan_schema_error.sql; then
    echo ""
    echo "✅ Schema fix applied successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "  • Recreated merchant_subscription_plans table in public schema"
    echo "  • Set up proper RLS policies for admin access"
    echo "  • Granted necessary permissions"
    echo "  • Created indexes for performance"
    echo "  • Inserted default subscription plans"
    echo "  • Ensured profiles table exists for admin checks"
    echo ""
    echo "🔄 Next steps:"
    echo "  1. Refresh your application"
    echo "  2. Try creating a new plan in the shop tab"
    echo "  3. The error should be resolved"
    echo ""
    echo "If you still see errors, check:"
    echo "  • Your user has 'admin' role in the profiles table"
    echo "  • Browser cache is cleared"
    echo "  • Check browser console for any remaining errors"
else
    echo ""
    echo "❌ Error applying schema fix!"
    echo "Please check your database URL and try again."
    echo "You can also apply this fix manually by:"
    echo "  1. Going to your Supabase dashboard"
    echo "  2. Opening the SQL Editor"
    echo "  3. Copying and pasting the contents of fix_shop_plan_schema_error.sql"
    echo "  4. Running the SQL"
fi