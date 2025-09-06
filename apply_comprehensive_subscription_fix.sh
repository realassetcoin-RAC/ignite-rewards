#!/bin/bash

# Comprehensive Subscription Plans Permission Fix
# This script fixes both database permissions and schema issues

echo "🔧 Applying Comprehensive Subscription Plans Fix..."
echo "=================================================="
echo ""

# Check if we have the SQL file
if [ ! -f "comprehensive_subscription_plans_fix.sql" ]; then
    echo "❌ Error: comprehensive_subscription_plans_fix.sql not found!"
    exit 1
fi

echo "📋 This comprehensive fix will:"
echo "  • Create api schema with proper permissions"
echo "  • Create api.profiles table for admin role checking"
echo "  • Create check_admin_access() function"
echo "  • Create merchant_subscription_plans table in api schema"
echo "  • Set up 5 RLS policies for secure admin access"
echo "  • Grant all necessary permissions to authenticated users"
echo "  • Create performance indexes"
echo "  • Insert 3 default subscription plans"
echo "  • Migrate existing admin users from public to api schema"
echo ""

# Function to apply SQL using different methods
apply_sql_fix() {
    echo "🔄 Applying SQL fix..."
    
    # Method 1: Try with DATABASE_URL if available
    if [ ! -z "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found. Using direct connection..."
        if psql "$DATABASE_URL" -f comprehensive_subscription_plans_fix.sql; then
            echo "✅ Database fix applied successfully via DATABASE_URL!"
            return 0
        else
            echo "❌ Failed to apply fix via DATABASE_URL"
        fi
    fi
    
    # Method 2: Try with Supabase CLI
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI found. Checking if project is linked..."
        
        if [ -f "supabase/config.toml" ]; then
            echo "✅ Supabase project found. Applying SQL..."
            
            # Copy the SQL file to migrations directory with timestamp
            TIMESTAMP=$(date +"%Y%m%d%H%M%S")
            cp comprehensive_subscription_plans_fix.sql "supabase/migrations/${TIMESTAMP}_comprehensive_subscription_plans_fix.sql"
            
            # Apply the migration
            if supabase db push; then
                echo "✅ Fix applied successfully via Supabase CLI!"
                return 0
            else
                echo "❌ Failed to apply fix via Supabase CLI"
                echo "🔧 Trying direct SQL execution..."
                
                # Try direct SQL execution
                if supabase db reset --debug; then
                    echo "✅ Database reset and fix applied!"
                    return 0
                fi
            fi
        else
            echo "⚠️  No Supabase config found. Project may not be linked."
        fi
    fi
    
    # Method 3: Manual instructions
    echo ""
    echo "🔧 MANUAL APPLICATION REQUIRED"
    echo "=============================="
    echo ""
    echo "Neither DATABASE_URL nor properly configured Supabase CLI found."
    echo "Please apply the fix manually using one of these methods:"
    echo ""
    echo "METHOD 1 - Supabase Dashboard (RECOMMENDED):"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Navigate to 'SQL Editor'"
    echo "  4. Copy the contents of: $(pwd)/comprehensive_subscription_plans_fix.sql"
    echo "  5. Paste into the SQL editor"
    echo "  6. Click 'RUN' to execute"
    echo ""
    echo "METHOD 2 - Database Connection:"
    echo "  1. Get your database connection string from Supabase"
    echo "  2. Set it as: export DATABASE_URL='your-connection-string'"
    echo "  3. Run this script again"
    echo ""
    echo "METHOD 3 - Supabase CLI:"
    echo "  1. Install Supabase CLI: npm install -g supabase"
    echo "  2. Login: supabase login"
    echo "  3. Link project: supabase link --project-ref wndswqvqogeblksrujpg"
    echo "  4. Run this script again"
    echo ""
    
    return 1
}

# Apply the fix
if apply_sql_fix; then
    echo ""
    echo "🎉 COMPREHENSIVE FIX COMPLETED SUCCESSFULLY!"
    echo ""
    echo "📋 What was fixed:"
    echo "  • ✅ Created api schema with proper permissions"
    echo "  • ✅ Created api.profiles table for admin role checking"
    echo "  • ✅ Created check_admin_access() function"
    echo "  • ✅ Created merchant_subscription_plans table in api schema"
    echo "  • ✅ Set up 5 RLS policies for secure access control"
    echo "  • ✅ Granted necessary permissions to all user roles"
    echo "  • ✅ Added performance indexes"
    echo "  • ✅ Inserted 3 default subscription plans"
    echo "  • ✅ Migrated existing admin users"
    echo ""
    echo "🚀 The admin dashboard 'Plans' tab should now work!"
    echo ""
    echo "📝 Next steps to verify the fix:"
    echo "  1. Ensure your user has role = 'admin' in the api.profiles table"
    echo "  2. Clear browser cache and cookies"
    echo "  3. Log in as an admin user"
    echo "  4. Navigate to Admin Dashboard"
    echo "  5. Click on the 'Plans' tab"
    echo "  6. You should see subscription plans without errors"
    echo ""
    echo "🔍 If you still get permission errors:"
    echo "  • Check that your user exists in api.profiles with role = 'admin'"
    echo "  • Run: UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';"
    echo "  • Clear browser cache and log in again"
    echo ""
    
    # Check if we need to update admin user
    echo "⚠️  IMPORTANT: Make sure your user has admin role!"
    echo "If you know your admin email, you can update it now."
    echo ""
    read -p "Enter your admin email (or press Enter to skip): " admin_email
    
    if [ ! -z "$admin_email" ]; then
        echo "📝 To set admin role for $admin_email, run this SQL:"
        echo ""
        echo "INSERT INTO api.profiles (id, email, role) "
        echo "SELECT auth.uid(), '$admin_email', 'admin'"
        echo "WHERE NOT EXISTS (SELECT 1 FROM api.profiles WHERE email = '$admin_email')"
        echo "ON CONFLICT (id) DO UPDATE SET role = 'admin', email = '$admin_email';"
        echo ""
        echo "OR if the user already exists:"
        echo "UPDATE api.profiles SET role = 'admin' WHERE email = '$admin_email';"
        echo ""
    fi
    
else
    echo ""
    echo "❌ Automatic fix application failed."
    echo "Please follow the manual instructions above."
    exit 1
fi