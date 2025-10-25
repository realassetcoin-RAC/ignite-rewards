#!/bin/bash

# Setup Cities Lookup Table for Merchant Signup Form
# This script applies the cities lookup table to your Supabase database

echo "Setting up Cities Lookup Table for Merchant Signup Form..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Not in a Supabase project directory."
    echo "Please run this script from your project root where supabase/config.toml exists."
    exit 1
fi

# Apply the cities lookup table
echo "Applying cities lookup table to Supabase database..."
supabase db reset --linked

# Alternative: If you prefer to push without reset
# supabase db push

echo "Cities lookup table setup complete!"
echo ""
echo "The following has been created:"
echo "- cities_lookup table with comprehensive city/country data"
echo "- search_cities function for efficient city searching"
echo "- Proper RLS policies for public read access"
echo "- Indexes for optimal search performance"
echo ""
echo "Your merchant signup form will now use this local database"
echo "instead of the external API Ninjas service."

