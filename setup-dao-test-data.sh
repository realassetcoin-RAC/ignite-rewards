#!/bin/bash

# Setup DAO Test Data Script
# This script creates comprehensive test data for DAO functionality

echo "🚀 Setting up DAO test data..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed or not in PATH"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Database connection parameters (adjust as needed)
DB_HOST="localhost"
DB_PORT="54322"
DB_NAME="postgres"
DB_USER="postgres"

echo "📊 Creating DAO test data..."

# Run the main test data creation script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create-dao-test-data.sql

if [ $? -eq 0 ]; then
    echo "✅ DAO test data created successfully!"
    
    echo "🔄 Updating test data with real user IDs..."
    
    # Run the user ID update script
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f update-dao-test-data-with-real-users.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Test data updated with real user IDs!"
        echo ""
        echo "🎉 DAO test data setup complete!"
        echo ""
        echo "📋 Test data includes:"
        echo "   • 1 DAO organization (RAC Rewards DAO)"
        echo "   • 4 DAO members (1 admin, 3 regular members)"
        echo "   • 5 DAO proposals (2 active, 1 passed, 1 rejected, 1 draft)"
        echo "   • 6 DAO votes (for passed and rejected proposals)"
        echo ""
        echo "🧪 You can now test:"
        echo "   • Viewing DAO proposals"
        echo "   • Voting on active proposals"
        echo "   • Viewing vote results"
        echo "   • Creating new proposals"
        echo "   • Managing DAO members"
    else
        echo "❌ Failed to update test data with real user IDs"
        exit 1
    fi
else
    echo "❌ Failed to create DAO test data"
    exit 1
fi
