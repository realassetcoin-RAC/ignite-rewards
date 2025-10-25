# Test Docker Development Environment
# This script tests the complete Docker development setup

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards Docker Development Environment Test" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "ignite_rewards"
$DB_USER = "postgres"
$DB_PASSWORD = "Maegan@200328"

# Function to run PostgreSQL command
function Invoke-PostgreSQL {
    param([string]$Query)
    
    $env:PGPASSWORD = $DB_PASSWORD
    $result = & $PSQL_PATH -h $DB_HOST -U $DB_USER -d $DB_NAME -c $Query 2>&1
    return $result
}

# Function to test database connection
function Test-DatabaseConnection {
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-PostgreSQL "SELECT version();"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Database connection successful" -ForegroundColor Green
            $version = ($result | Select-String "PostgreSQL").ToString().Trim()
            Write-Host "   Version: $version" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "ERROR: Database connection failed" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test database schema
function Test-DatabaseSchema {
    Write-Host "Testing database schema..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-PostgreSQL "\dt"
        if ($LASTEXITCODE -eq 0) {
            $tableCount = ($result | Select-String "public" | Measure-Object).Count
            Write-Host "OK: Database schema accessible" -ForegroundColor Green
            Write-Host "   Tables found: $tableCount" -ForegroundColor Gray
            
            # Check for key tables
            $keyTables = @("profiles", "nft_collections", "nft_types", "user_loyalty_cards", "merchant_subscription_plans", "cities_lookup", "loyalty_networks")
            $foundTables = @()
            
            foreach ($table in $keyTables) {
                if ($result -match $table) {
                    $foundTables += $table
                }
            }
            
            Write-Host "   Key tables: $($foundTables.Count)/$($keyTables.Count)" -ForegroundColor Gray
            if ($foundTables.Count -eq $keyTables.Count) {
                Write-Host "   All key tables present" -ForegroundColor Green
                return $true
            } else {
                Write-Host "   WARNING: Some key tables missing" -ForegroundColor Yellow
                $missingTables = $keyTables | Where-Object { $_ -notin $foundTables }
                Write-Host "   Missing: $($missingTables -join ', ')" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "ERROR: Cannot access database schema" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test sample data
function Test-SampleData {
    Write-Host "Testing sample data..." -ForegroundColor Yellow
    
    try {
        # Test cities_lookup data
        $citiesResult = Invoke-PostgreSQL "SELECT COUNT(*) FROM cities_lookup;"
        if ($LASTEXITCODE -eq 0) {
            $cityCount = ($citiesResult | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
            Write-Host "OK: cities_lookup table has $cityCount records" -ForegroundColor Green
        } else {
            Write-Host "WARNING: cities_lookup table may be empty" -ForegroundColor Yellow
        }
        
        # Test nft_types data
        $nftResult = Invoke-PostgreSQL "SELECT COUNT(*) FROM nft_types;"
        if ($LASTEXITCODE -eq 0) {
            $nftCount = ($nftResult | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
            Write-Host "OK: nft_types table has $nftCount records" -ForegroundColor Green
        } else {
            Write-Host "WARNING: nft_types table may be empty" -ForegroundColor Yellow
        }
        
        # Test merchant_subscription_plans data
        $plansResult = Invoke-PostgreSQL "SELECT COUNT(*) FROM merchant_subscription_plans;"
        if ($LASTEXITCODE -eq 0) {
            $plansCount = ($plansResult | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
            Write-Host "OK: merchant_subscription_plans table has $plansCount records" -ForegroundColor Green
        } else {
            Write-Host "WARNING: merchant_subscription_plans table may be empty" -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "ERROR: Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test Docker configurations
function Test-DockerConfigurations {
    Write-Host "Testing Docker configurations..." -ForegroundColor Yellow
    
    $configFiles = @(
        "docker/postgres/Dockerfile",
        "Dockerfile.app",
        "docker-compose.yml",
        "docker-compose.dev.yml",
        "build-images.ps1"
    )
    
    $allExist = $true
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Write-Host "OK: $file" -ForegroundColor Green
        } else {
            Write-Host "MISSING: $file" -ForegroundColor Red
            $allExist = $false
        }
    }
    
    return $allExist
}

# Function to test application files
function Test-ApplicationFiles {
    Write-Host "Testing application files..." -ForegroundColor Yellow
    
    $appFiles = @(
        "package.json",
        "src/config/environment.ts",
        "src/lib/databaseAdapter.ts"
    )
    
    $allExist = $true
    foreach ($file in $appFiles) {
        if (Test-Path $file) {
            Write-Host "OK: $file" -ForegroundColor Green
        } else {
            Write-Host "MISSING: $file" -ForegroundColor Red
            $allExist = $false
        }
    }
    
    return $allExist
}

# Function to test environment configuration
function Test-EnvironmentConfiguration {
    Write-Host "Testing environment configuration..." -ForegroundColor Yellow
    
    if (Test-Path ".env.local") {
        Write-Host "OK: .env.local file exists" -ForegroundColor Green
        
        $envContent = Get-Content ".env.local" -Raw
        $requiredVars = @("VITE_DATABASE_URL", "VITE_DB_HOST", "VITE_DB_PORT", "VITE_DB_NAME", "VITE_DB_USER", "VITE_DB_PASSWORD")
        $foundVars = @()
        
        foreach ($var in $requiredVars) {
            if ($envContent -match $var) {
                $foundVars += $var
            }
        }
        
        Write-Host "   Environment variables: $($foundVars.Count)/$($requiredVars.Count)" -ForegroundColor Gray
        if ($foundVars.Count -eq $requiredVars.Count) {
            Write-Host "   All required variables present" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   WARNING: Some variables missing" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "WARNING: .env.local file not found" -ForegroundColor Yellow
        return $false
    }
}

# Main test execution
Write-Host "Starting comprehensive Docker development environment test..." -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# Run all tests
$testResults += Test-DatabaseConnection
$testResults += Test-DatabaseSchema
$testResults += Test-SampleData
$testResults += Test-DockerConfigurations
$testResults += Test-ApplicationFiles
$testResults += Test-EnvironmentConfiguration

# Calculate results
$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_ -eq $true }).Count
$failedTests = $totalTests - $passedTests

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

Write-Host ""
if ($passedTests -eq $totalTests) {
    Write-Host "🎉 All tests passed! Docker development environment is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Install Docker Desktop (requires Administrator privileges)" -ForegroundColor White
    Write-Host "2. Build Docker images: .\build-images.ps1 -Image all -Environment dev" -ForegroundColor White
    Write-Host "3. Start Docker environment: .\docker-manage.ps1 -Environment dev -Action start" -ForegroundColor White
    Write-Host "4. Test complete Docker setup" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Please fix the issues above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "1. Ensure PostgreSQL is running: Get-Service postgresql*" -ForegroundColor White
    Write-Host "2. Check database connection: Test-NetConnection localhost -Port 5432" -ForegroundColor White
    Write-Host "3. Verify .env.local file exists and has correct values" -ForegroundColor White
    Write-Host "4. Run database initialization scripts if needed" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
