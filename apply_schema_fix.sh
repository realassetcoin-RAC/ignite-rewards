#!/bin/bash

# Apply Schema Fix for Referrals and Subscription Plans
# This script applies the database migration to fix schema configuration errors

echo "=========================================="
echo "Applying Schema Fix for Referrals and Subscription Plans"
echo "=========================================="

# Get database connection details
read -p "Enter your Supabase database URL (or press Enter to use environment variable): " DB_URL
if [ -z "$DB_URL" ]; then
    DB_URL="${DATABASE_URL:-}"
    if [ -z "$DB_URL" ]; then
        echo "Error: No database URL provided and DATABASE_URL environment variable not set"
        exit 1
    fi
fi

# Apply the fix
echo ""
echo "Applying schema fixes..."
psql "$DB_URL" -f fix_referrals_subscription_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema fix applied successfully!"
    echo ""
    echo "The following issues have been resolved:"
    echo "- ✅ user_referrals table created/verified with proper RLS policies"
    echo "- ✅ merchant_subscription_plans table created/verified with proper RLS policies"
    echo "- ✅ referral_campaigns table created/verified (dependency)"
    echo "- ✅ Proper permissions granted for authenticated users"
    echo "- ✅ Admin access policies configured"
    echo "- ✅ Default data inserted (if tables were empty)"
    echo ""
    echo "Next steps:"
    echo "1. Restart your application to ensure changes take effect"
    echo "2. Test the referrals feature in the user dashboard"
    echo "3. Test the subscription plans management in the admin panel"
else
    echo ""
    echo "❌ Error applying schema fix. Please check the error messages above."
    exit 1
fi