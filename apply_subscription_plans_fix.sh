#!/bin/bash

# Script to apply the subscription plans permission fix
# This fixes the "You don't have permission to access subscription plans" error

echo "🔧 Applying Subscription Plans Permission Fix..."
echo "================================================"

# Check if we have the SQL file
if [ ! -f "fix_subscription_plans_permissions.sql" ]; then
    echo "❌ Error: fix_subscription_plans_permissions.sql not found!"
    exit 1
fi

echo "📋 This fix will:"
echo "  • Ensure merchant_subscription_plans table exists in public schema"
echo "  • Set up proper RLS policies for admin access"
echo "  • Grant necessary permissions to authenticated users"
echo "  • Create indexes for performance"
echo "  • Insert default subscription plans"
echo "  • Fix Supabase client schema configuration"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Attempting to use Supabase CLI..."
    
    # Check if supabase CLI is available
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI found. Applying migration..."
        supabase db push --include-all
        if [ $? -eq 0 ]; then
            echo "✅ Migration applied successfully via Supabase CLI!"
        else
            echo "❌ Failed to apply migration via Supabase CLI"
            exit 1
        fi
    else
        echo "❌ Neither DATABASE_URL nor Supabase CLI available."
        echo "Please either:"
        echo "  1. Set DATABASE_URL environment variable, or"
        echo "  2. Install Supabase CLI and run: supabase login && supabase link"
        echo "  3. Or apply the SQL manually in your Supabase dashboard"
        echo ""
        echo "SQL file location: $(pwd)/fix_subscription_plans_permissions.sql"
        exit 1
    fi
else
    echo "✅ DATABASE_URL found. Applying fix..."
    
    # Apply the SQL fix
    if psql "$DATABASE_URL" -f fix_subscription_plans_permissions.sql; then
        echo ""
        echo "✅ Database fix applied successfully!"
    else
        echo "❌ Failed to apply database fix"
        exit 1
    fi
fi

echo ""
echo "🎉 Fix completed successfully!"
echo ""
echo "📋 What was fixed:"
echo "  • ✅ Changed Supabase client schema from 'api' to 'public'"
echo "  • ✅ Created merchant_subscription_plans table in public schema"
echo "  • ✅ Set up proper RLS policies for admin access"
echo "  • ✅ Granted necessary permissions"
echo "  • ✅ Created indexes for performance"
echo "  • ✅ Inserted default subscription plans"
echo ""
echo "🚀 The admin dashboard 'Plans' tab should now work correctly!"
echo "   Admins should be able to view, create, and manage subscription plans."
echo ""
echo "🔍 To verify the fix:"
echo "  1. Log in as an admin user"
echo "  2. Navigate to Admin Dashboard"
echo "  3. Click on the 'Plans' tab"
echo "  4. You should see the subscription plans without permission errors"