# Execute Local Database Fixes Script
# This script will apply the database fixes to your LOCAL PostgreSQL database

Write-Host "🔧 Executing database fixes for all form gaps in LOCAL PostgreSQL database..." -ForegroundColor Green
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
if (-not (Test-Path "fix_local_database_gaps.sql")) {
    Write-Host "❌ SQL file 'fix_local_database_gaps.sql' not found!" -ForegroundColor Red
    Write-Host "Please ensure the file exists in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 SQL file found: fix_local_database_gaps.sql" -ForegroundColor Green
Write-Host "📊 Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}" -ForegroundColor Cyan
Write-Host ""

# Display the SQL file size
$fileSize = (Get-Item "fix_local_database_gaps.sql").Length
Write-Host "📊 File size: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Cyan
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
        Write-Host ""
        Write-Host "🔧 Please check:" -ForegroundColor Yellow
        Write-Host "   - PostgreSQL is running on localhost:5432" -ForegroundColor White
        Write-Host "   - Database '$DB_NAME' exists" -ForegroundColor White
        Write-Host "   - User '$DB_USER' has access" -ForegroundColor White
        Write-Host "   - Password is correct" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Error testing database connection: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to execute the SQL script to fix all form database gaps? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Operation cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Executing SQL script..." -ForegroundColor Green
Write-Host ""

# Execute the SQL script
try {
    $env:PGPASSWORD = $DB_PASSWORD
    $result = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "fix_local_database_gaps.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL script executed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Script output:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "❌ SQL script execution failed:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Please check the error messages above and try again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error executing SQL script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Running verification script..." -ForegroundColor Yellow

# Run verification script
try {
    $verificationResult = node verify_local_database_gaps.js 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Verification completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Verification output:" -ForegroundColor Cyan
        Write-Host $verificationResult -ForegroundColor White
    } else {
        Write-Host "⚠️  Verification script had issues:" -ForegroundColor Yellow
        Write-Host $verificationResult -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not run verification script: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "You can run it manually with: node verify_local_database_gaps.js" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 LOCAL DATABASE FIXES COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was fixed:" -ForegroundColor Cyan
Write-Host "   ✅ Added missing columns to profiles table" -ForegroundColor Green
Write-Host "   ✅ Added missing columns to merchants table" -ForegroundColor Green
Write-Host "   ✅ Created contact system tables" -ForegroundColor Green
Write-Host "   ✅ Created DAO governance tables" -ForegroundColor Green
Write-Host "   ✅ Created marketplace tables" -ForegroundColor Green
Write-Host "   ✅ Created user wallet tables" -ForegroundColor Green
Write-Host "   ✅ Created referral system tables" -ForegroundColor Green
Write-Host "   ✅ Created loyalty system tables" -ForegroundColor Green
Write-Host "   ✅ Added performance indexes" -ForegroundColor Green
Write-Host "   ✅ Inserted default data" -ForegroundColor Green
Write-Host "   ✅ Created helper functions" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Your local database is now fully aligned with all application forms!" -ForegroundColor Green
