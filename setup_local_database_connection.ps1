# RAC Rewards - Local Database Connection Setup
# PowerShell script to configure local PostgreSQL connection

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards - Local Database Connection Setup" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy environment configuration
Write-Host "[1/4] Copying environment configuration..." -ForegroundColor Yellow
try {
    Copy-Item "env.local.database" ".env.local" -Force
    Write-Host "✅ Environment file copied successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to copy environment file: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Verify local PostgreSQL connection
Write-Host "[2/4] Verifying local PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "Testing connection to: postgresql://postgres:***@localhost:5432/ignite_rewards" -ForegroundColor Gray

try {
    # Test PostgreSQL connection using psql
    $testQuery = "SELECT 1;"
    $result = psql -h localhost -p 5432 -U postgres -d ignite_rewards -c $testQuery 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
    } else {
        throw "Connection failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "- PostgreSQL is running on localhost:5432" -ForegroundColor White
    Write-Host "- Database 'ignite_rewards' exists" -ForegroundColor White
    Write-Host "- User 'postgres' has access" -ForegroundColor White
    Write-Host "- Password is correct" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 3: Check database tables
Write-Host "[3/4] Checking database tables..." -ForegroundColor Yellow
try {
    $tableQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    $tableResult = psql -h localhost -p 5432 -U postgres -d ignite_rewards -c $tableQuery 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database tables accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database tables may not exist yet" -ForegroundColor Yellow
        Write-Host "   Run the database restoration scripts to create tables" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not check database tables" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Complete setup
Write-Host "[4/4] Environment configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your application is now configured to use:" -ForegroundColor White
Write-Host "- Database: Local PostgreSQL (localhost:5432)" -ForegroundColor Green
Write-Host "- Database Name: ignite_rewards" -ForegroundColor Green
Write-Host "- User: postgres" -ForegroundColor Green
Write-Host "- Supabase: DISABLED" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your application: npm run dev" -ForegroundColor White
Write-Host "2. If tables are missing, run the database restoration scripts" -ForegroundColor White
Write-Host "3. Check the browser console for connection status" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
