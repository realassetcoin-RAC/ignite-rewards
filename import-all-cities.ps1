# Import All Cities from Chunk Files
Write-Host "Importing all cities from chunk files..." -ForegroundColor Cyan

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

# Function to execute SQL file
function Invoke-SqlFile {
    param([string]$FilePath)
    
    $env:PGPASSWORD = $DB_PASSWORD
    $result = & $PSQL_PATH -h $DB_HOST -U $DB_USER -d $DB_NAME -f $FilePath 2>&1
    return $result
}

Write-Host "Starting city import process..." -ForegroundColor Yellow
Write-Host ""

# First, clear existing cities data
Write-Host "Clearing existing cities data..." -ForegroundColor Yellow
$clearResult = Invoke-PostgreSQL "TRUNCATE TABLE cities_lookup CASCADE;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Existing cities data cleared" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to clear existing data" -ForegroundColor Red
    Write-Host "Error: $clearResult" -ForegroundColor Red
    exit 1
}

# Get all chunk files
$chunkFiles = Get-ChildItem "apply_cities_10k_chunk_*.sql" | Sort-Object Name
$totalFiles = $chunkFiles.Count

Write-Host "Found $totalFiles chunk files to import" -ForegroundColor Green
Write-Host ""

$successCount = 0
$errorCount = 0
$totalCities = 0

# Import each chunk file
foreach ($file in $chunkFiles) {
    $fileNumber = [int]($file.Name -replace "apply_cities_10k_chunk_|\.sql", "")
    Write-Host "[$($fileNumber)/$totalFiles] Importing $($file.Name)..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-SqlFile $file.FullName
        
        if ($LASTEXITCODE -eq 0) {
            # Count inserted records from the result
            $insertCount = 0
            if ($result -match "INSERT 0 (\d+)") {
                $insertCount = [int]$matches[1]
            }
            
            $totalCities += $insertCount
            $successCount++
            Write-Host "  OK: Imported $insertCount cities" -ForegroundColor Green
        } else {
            $errorCount++
            Write-Host "  ERROR: Failed to import $($file.Name)" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
        }
    } catch {
        $errorCount++
        Write-Host "  ERROR: Exception importing $($file.Name)" -ForegroundColor Red
        Write-Host "  Exception: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Show progress
    $progress = [math]::Round(($fileNumber / $totalFiles) * 100, 1)
    Write-Host "  Progress: $progress%" -ForegroundColor Gray
    Write-Host ""
}

# Verify final count
Write-Host "Verifying final import..." -ForegroundColor Yellow
$finalCount = Invoke-PostgreSQL "SELECT COUNT(*) FROM cities_lookup;"
if ($LASTEXITCODE -eq 0) {
    $cityCount = ($finalCount | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })[0]
    Write-Host "Final city count: $cityCount" -ForegroundColor Green
} else {
    Write-Host "ERROR: Could not verify final count" -ForegroundColor Red
}

# Show sample data
Write-Host ""
Write-Host "Sample imported cities:" -ForegroundColor Yellow
$sampleData = Invoke-PostgreSQL "SELECT city_name, country_name FROM cities_lookup ORDER BY city_name LIMIT 10;"
if ($LASTEXITCODE -eq 0) {
    Write-Host $sampleData -ForegroundColor White
}

# Summary
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Import Summary" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Total chunk files: $totalFiles" -ForegroundColor White
Write-Host "Successfully imported: $successCount" -ForegroundColor Green
Write-Host "Failed imports: $errorCount" -ForegroundColor Red
Write-Host "Total cities imported: $totalCities" -ForegroundColor Green
Write-Host "Final database count: $cityCount" -ForegroundColor Green

if ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 All cities imported successfully!" -ForegroundColor Green
    Write-Host "✅ Database now contains $cityCount cities from $totalFiles chunk files" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some imports failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
