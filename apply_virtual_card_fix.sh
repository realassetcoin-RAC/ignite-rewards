#!/bin/bash

# Apply Virtual Card Saving Fix
# This script applies the database migration to fix virtual card saving issues

echo "🔧 Applying Virtual Card Saving Fix..."
echo "=================================="

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in a Supabase project directory"
    echo "Please run this script from your project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

echo "📋 Migration Summary:"
echo "- Fix schema mismatch between api.user_loyalty_cards and public.user_loyalty_cards"
echo "- Migrate data from api schema to public schema if needed"
echo "- Update RPC functions to work with unified public table"
echo "- Create compatibility view for api schema access"
echo "- Update RLS policies for proper access control"
echo ""

read -p "Do you want to proceed with the migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo "🚀 Applying migration..."

# Apply the migration
if supabase db push; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎯 What was fixed:"
    echo "- Unified user_loyalty_cards table in public schema"
    echo "- Fixed RPC functions for loyalty number generation"
    echo "- Added compatibility view for api schema access"
    echo "- Updated RLS policies for proper permissions"
    echo "- Enhanced error handling in frontend components"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Test virtual card creation in your application"
    echo "2. Check browser console for any remaining errors"
    echo "3. Verify that loyalty cards are saved properly"
    echo ""
    echo "🔍 If you still have issues:"
    echo "- Check the browser console for specific error messages"
    echo "- Verify your Supabase project permissions"
    echo "- Ensure you're logged in as an authenticated user"
    echo ""
    echo "✅ Virtual card saving should now work correctly!"
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure you're connected to your Supabase project"
    echo "2. Check that you have proper database permissions"
    echo "3. Verify your Supabase CLI is up to date"
    exit 1
fi