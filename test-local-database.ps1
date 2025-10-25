# Test Local Database Setup (Simulating Docker Environment)
Write-Host "Testing Local Database Setup..." -ForegroundColor Cyan

# Test PostgreSQL connection
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Yellow

try {
    # Test if psql is available
    $psqlTest = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlTest) {
        Write-Host "OK: psql command available" -ForegroundColor Green
        
        # Test connection to local database
        $env:PGPASSWORD = "Maegan@200328"
        $connectionTest = psql -h localhost -U postgres -d ignite_rewards -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: PostgreSQL connection successful" -ForegroundColor Green
            Write-Host "Database version: $($connectionTest[0])" -ForegroundColor Gray
        } else {
            Write-Host "ERROR: PostgreSQL connection failed" -ForegroundColor Red
            Write-Host "Error: $connectionTest" -ForegroundColor Red
        }
    } else {
        Write-Host "ERROR: psql command not found" -ForegroundColor Red
        Write-Host "Please ensure PostgreSQL is installed and in PATH" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test database schema
Write-Host "Testing database schema..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = "Maegan@200328"
    $tablesTest = psql -h localhost -U postgres -d ignite_rewards -c "\dt" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Database schema accessible" -ForegroundColor Green
        
        # Count tables
        $tableCount = ($tablesTest | Select-String "public" | Measure-Object).Count
        Write-Host "Found $tableCount tables in public schema" -ForegroundColor Gray
        
        # Check for key tables
        $keyTables = @("profiles", "nft_collections", "nft_types", "user_loyalty_cards", "merchant_subscription_plans", "cities_lookup")
        $foundTables = @()
        
        foreach ($table in $keyTables) {
            if ($tablesTest -match $table) {
                $foundTables += $table
            }
        }
        
        Write-Host "Key tables found: $($foundTables.Count)/$($keyTables.Count)" -ForegroundColor Gray
        if ($foundTables.Count -eq $keyTables.Count) {
            Write-Host "OK: All key tables present" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Some key tables missing" -ForegroundColor Yellow
            $missingTables = $keyTables | Where-Object { $_ -notin $foundTables }
            Write-Host "Missing: $($missingTables -join ', ')" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR: Cannot access database schema" -ForegroundColor Red
        Write-Host "Error: $tablesTest" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test sample data
Write-Host "Testing sample data..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = "Maegan@200328"
    
    # Test cities_lookup data
    $citiesTest = psql -h localhost -U postgres -d ignite_rewards -c "SELECT COUNT(*) FROM cities_lookup;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $cityCount = ($citiesTest | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
        Write-Host "OK: cities_lookup table has $cityCount records" -ForegroundColor Green
    } else {
        Write-Host "WARNING: cities_lookup table may be empty or missing" -ForegroundColor Yellow
    }
    
    # Test nft_types data
    $nftTest = psql -h localhost -U postgres -d ignite_rewards -c "SELECT COUNT(*) FROM nft_types;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $nftCount = ($nftTest | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
        Write-Host "OK: nft_types table has $nftCount records" -ForegroundColor Green
    } else {
        Write-Host "WARNING: nft_types table may be empty or missing" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "Local Database Test Summary:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "PostgreSQL: Running locally" -ForegroundColor Green
Write-Host "Database: ignite_rewards" -ForegroundColor Green
Write-Host "User: postgres" -ForegroundColor Green
Write-Host "Host: localhost:5432" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install Docker Desktop (requires Administrator privileges)" -ForegroundColor White
Write-Host "2. Build Docker images: .\build-images.ps1 -Image all -Environment dev" -ForegroundColor White
Write-Host "3. Start Docker environment: .\docker-manage.ps1 -Environment dev -Action start" -ForegroundColor White
Write-Host "4. Test complete Docker setup" -ForegroundColor White
