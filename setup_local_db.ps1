# PowerShell script to set up local PostgreSQL database for RAC Rewards

Write-Host "Setting up Local PostgreSQL Database for RAC Rewards..." -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }

if ($pgService) {
    Write-Host "✅ PostgreSQL is running: $($pgService.Name)" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL is not running. Please start PostgreSQL service." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Creating database 'rac_rewards'..." -ForegroundColor Yellow

# Try to create the database
try {
    & createdb rac_rewards 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database 'rac_rewards' created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database might already exist or there was an error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error creating database: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Running database setup script..." -ForegroundColor Yellow

# Run the setup script
try {
    & psql -d rac_rewards -f "src\sql\setup_local_database.sql"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Database setup failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Error running setup script: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Verifying database configuration..." -ForegroundColor Yellow

# Verify the setup
try {
    & node "src\scripts\verifyLocalDatabase.js"
} catch {
    Write-Host "❌ Error verifying database: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Read-Host "Press Enter to exit"
