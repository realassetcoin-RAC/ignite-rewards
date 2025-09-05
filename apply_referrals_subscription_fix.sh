#!/bin/bash

# Apply Referrals and Subscription Plans Database Fix Script
# This script applies the necessary database migrations to fix configuration errors

echo "========================================"
echo "Referrals & Subscription Plans Fix Tool"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please ensure you have a .env file with your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check for required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: Required environment variables not found!"
    echo "Please ensure your .env file contains:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - SUPABASE_DB_URL (or database connection details)"
    exit 1
fi

# Extract database URL or construct it
if [ -n "$SUPABASE_DB_URL" ]; then
    DB_URL="$SUPABASE_DB_URL"
elif [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
else
    echo "Error: Database connection details not found!"
    echo "Please add SUPABASE_DB_URL or individual DB connection variables to your .env file."
    exit 1
fi

echo "🔍 Checking database connection..."
psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to database!"
    echo "Please check your database credentials and try again."
    exit 1
fi
echo "✅ Database connection successful!"
echo ""

echo "📋 Current database state:"
psql "$DB_URL" -c "
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns')
ORDER BY tablename;
"

echo ""
echo "🚀 Applying database fixes..."
echo ""

# Apply the fix
psql "$DB_URL" -f fix_referrals_subscription_configuration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database fixes applied successfully!"
    echo ""
    
    echo "📊 Verification Results:"
    psql "$DB_URL" -c "
    SELECT 
      'user_referrals' as table_name,
      COUNT(*) as record_count,
      CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as security_status
    FROM pg_tables 
    LEFT JOIN public.user_referrals ON true
    WHERE schemaname = 'public' AND tablename = 'user_referrals'
    GROUP BY rowsecurity
    
    UNION ALL
    
    SELECT 
      'merchant_subscription_plans',
      COUNT(*),
      CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END
    FROM pg_tables 
    LEFT JOIN public.merchant_subscription_plans ON true
    WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans'
    GROUP BY rowsecurity
    
    UNION ALL
    
    SELECT 
      'referral_campaigns',
      COUNT(*),
      CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END
    FROM pg_tables 
    LEFT JOIN public.referral_campaigns ON true
    WHERE schemaname = 'public' AND tablename = 'referral_campaigns'
    GROUP BY rowsecurity;
    "
    
    echo ""
    echo "🎉 Success! The referrals and subscription plans features should now work correctly."
    echo ""
    echo "Next steps:"
    echo "1. Refresh your application"
    echo "2. Try accessing the Referral Manager and Subscription Plan Manager in the admin panel"
    echo "3. The configuration errors should be resolved"
    echo ""
else
    echo ""
    echo "❌ Failed to apply database fixes!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "If the problem persists, you may need to:"
    echo "1. Check your database permissions"
    echo "2. Run the SQL file manually in Supabase SQL Editor"
    echo "3. Contact support with the error messages"
    exit 1
fi

echo "💡 Tip: If you still see errors, try:"
echo "   - Clearing your browser cache"
echo "   - Logging out and back in"
echo "   - Checking the browser console for any client-side errors"
echo ""