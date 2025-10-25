# Populate Local Database with Real Test Data
# This script will add realistic test data to your local PostgreSQL database

Write-Host "📊 Populating local database with real test data..." -ForegroundColor Green
Write-Host ""

# Configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "ignite_rewards"
$DB_USER = "postgres"
$DB_PASSWORD = "Maegan@200328"
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Check if psql exists
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "❌ PostgreSQL psql not found at: $PSQL_PATH" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and update the PSQL_PATH variable." -ForegroundColor Yellow
    exit 1
}

# Check if the SQL file exists
if (-not (Test-Path "populate_local_database_with_real_data.sql")) {
    Write-Host "❌ SQL file 'populate_local_database_with_real_data.sql' not found!" -ForegroundColor Red
    Write-Host "Please ensure the file exists in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 SQL file found: populate_local_database_with_real_data.sql" -ForegroundColor Green
Write-Host "📊 Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}" -ForegroundColor Cyan
Write-Host ""

# Test database connection first
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD

try {
    $connectionTest = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 'Connection successful' as status;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed:" -ForegroundColor Red
        Write-Host $connectionTest -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error testing database connection: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to populate the database with real test data? (This will clear existing data) (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Operation cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Populating database with real test data..." -ForegroundColor Green
Write-Host ""

# Execute the SQL script
try {
    $env:PGPASSWORD = $DB_PASSWORD
    $result = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "populate_local_database_with_real_data.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database populated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Script output:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "❌ Database population failed:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error populating database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 DATABASE POPULATION COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was added:" -ForegroundColor Cyan
Write-Host "   ✅ 5 realistic NFT types with different rarities" -ForegroundColor Green
Write-Host "   ✅ 5 merchant subscription plans" -ForegroundColor Green
Write-Host "   ✅ 5 real merchants with different business types" -ForegroundColor Green
Write-Host "   ✅ 5 user profiles with complete information" -ForegroundColor Green
Write-Host "   ✅ 5 user points records with different tiers" -ForegroundColor Green
Write-Host "   ✅ 5 loyalty transactions with real data" -ForegroundColor Green
Write-Host "   ✅ 3 marketplace listings for investments" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Your application will now show real data instead of empty tables!" -ForegroundColor Green
Write-Host "📱 Start your application and test the functionality with actual data." -ForegroundColor Green
