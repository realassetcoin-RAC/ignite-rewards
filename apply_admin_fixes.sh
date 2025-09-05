#!/bin/bash

# Apply Admin Dashboard Fixes Script
# This script applies SQL fixes to resolve admin dashboard loading errors

echo "================================================"
echo "Admin Dashboard Error Fix Script"
echo "================================================"
echo ""
echo "This script will fix the following issues:"
echo "1. Error loading statistics in admin dashboard"
echo "2. 'Failed to load plans' error in shop tab"
echo "3. 'Failed to load referrals' error in referrals tab"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your Supabase connection details:"
    echo "  SUPABASE_DB_URL=your_database_url"
    exit 1
fi

# Source the .env file
source .env

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL not found in .env file!"
    echo "Please add your Supabase database URL to the .env file"
    exit 1
fi

echo "Connecting to Supabase database..."
echo ""

# Apply the fixes
echo "Applying fixes..."
psql "$SUPABASE_DB_URL" -f fix_admin_dashboard_errors.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Fixes applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Refresh your admin dashboard page"
    echo "2. Try accessing the Shop and Referrals tabs"
    echo "3. Check if statistics load correctly"
    echo ""
    echo "If you still encounter issues:"
    echo "1. Clear your browser cache"
    echo "2. Sign out and sign back in"
    echo "3. Check the browser console for any remaining errors"
else
    echo ""
    echo "❌ Error applying fixes!"
    echo "Please check the error messages above and ensure:"
    echo "1. Your database connection string is correct"
    echo "2. You have the necessary permissions"
    echo "3. The database is accessible"
fi