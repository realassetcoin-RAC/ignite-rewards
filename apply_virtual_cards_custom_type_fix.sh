#!/bin/bash

# Apply Virtual Cards Custom Type Fix
# This script applies the migration to fix the custom_card_type column error

echo "🚀 Applying Virtual Cards Custom Type Fix..."
echo "=============================================="

# Check if we have database connection info
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ No database URL found. Please set DATABASE_URL or SUPABASE_DB_URL environment variable."
    echo ""
    echo "Example:"
    echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Or run the migration manually using psql:"
    echo "psql \$DATABASE_URL -f supabase/migrations/20250130000000_fix_virtual_cards_custom_card_type_error.sql"
    exit 1
fi

# Use DATABASE_URL or SUPABASE_DB_URL
DB_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

echo "📦 Applying migration file..."
echo "Migration: 20250130000000_fix_virtual_cards_custom_card_type_error.sql"
echo ""

# Apply the migration
if psql "$DB_URL" -f "supabase/migrations/20250130000000_fix_virtual_cards_custom_card_type_error.sql"; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔍 Running verification test..."
    echo ""
    
    # Run the verification test
    psql "$DB_URL" -c "SELECT api.test_virtual_cards_fix();"
    
    echo ""
    echo "🎉 Virtual Cards Custom Type Fix Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test virtual card creation in the admin dashboard"
    echo "2. Try creating cards with custom types (VIP, Corporate, Student, etc.)"
    echo "3. The custom_card_type column error should now be resolved"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "If you need to run this manually:"
    echo "psql \$DATABASE_URL -f supabase/migrations/20250130000000_fix_virtual_cards_custom_card_type_error.sql"
    echo ""
    exit 1
fi