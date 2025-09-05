#!/bin/bash

# Comprehensive Database Fix Application Script
# This script applies the database fix for plan saving and virtual card creation issues

echo "🔧 Comprehensive Database Fix Application Script"
echo "=================================================="
echo ""
echo "This script will fix:"
echo "✅ Plan saving 'schema must be one of the following:api' error"
echo "✅ Virtual card creation failures"
echo "✅ Missing RLS policies and permissions"
echo "✅ Table structure inconsistencies"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "📋 Supabase CLI detected. You can use either method below:"
    echo ""
    echo "METHOD 1 - Using Supabase CLI:"
    echo "1. Copy the SQL from comprehensive_database_fix.sql"
    echo "2. Run: supabase db push"
    echo "3. Or create a new migration: supabase migration new comprehensive_fix"
    echo ""
fi

echo "METHOD 2 - Using Supabase Dashboard (Recommended):"
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of comprehensive_database_fix.sql"
echo "4. Click 'Run' to execute the fix"
echo ""

# Check if we're in a Supabase project
if [ -f "supabase/config.toml" ]; then
    echo "📁 Supabase project detected!"
    echo ""
    
    read -p "Do you want to create a new migration file? (y/n): " create_migration
    
    if [[ $create_migration =~ ^[Yy]$ ]]; then
        # Create a new migration with the fix
        migration_name="comprehensive_database_fix_$(date +%Y%m%d_%H%M%S)"
        migration_file="supabase/migrations/${migration_name}.sql"
        
        cp comprehensive_database_fix.sql "$migration_file"
        
        echo "✅ Migration created: $migration_file"
        echo ""
        echo "To apply the migration:"
        echo "  supabase db push"
        echo ""
    fi
fi

echo "🔍 VERIFICATION STEPS:"
echo "After applying the fix, verify it worked by:"
echo ""
echo "1. Check in Supabase SQL Editor:"
echo "   SELECT COUNT(*) FROM public.merchant_subscription_plans;"
echo "   SELECT COUNT(*) FROM public.virtual_cards;"
echo "   SELECT COUNT(*) FROM public.profiles;"
echo ""
echo "2. Test in your application:"
echo "   • Try creating a new subscription plan"
echo "   • Try creating a new virtual card"
echo "   • Check that admin dashboard loads without errors"
echo ""
echo "3. Check browser console for any remaining errors"
echo ""

echo "📞 TROUBLESHOOTING:"
echo "If you still encounter issues:"
echo "• Check that your user has admin role in the profiles table"
echo "• Clear browser cache and refresh the application"
echo "• Check browser console for specific error messages"
echo "• Verify that all migrations have been applied successfully"
echo ""

echo "🎉 Ready to apply the fix!"
echo "Choose your preferred method above and follow the instructions."