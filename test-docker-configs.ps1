# Test Docker Configuration Script
# This script validates Docker configurations without requiring Docker to be installed

param(
    [switch]$Verbose
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards Docker Configuration Validator" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to test file existence
function Test-FileExists {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        Write-Host "✅ $Description" -ForegroundColor Green
        if ($Verbose) {
            $fileInfo = Get-Item $FilePath
            Write-Host "   📁 Path: $FilePath" -ForegroundColor Gray
            Write-Host "   📊 Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
            Write-Host "   📅 Modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
        }
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        Write-Host "   📁 Missing: $FilePath" -ForegroundColor Yellow
        return $false
    }
}

# Function to validate Dockerfile syntax
function Test-DockerfileSyntax {
    param([string]$DockerfilePath, [string]$Description)
    
    if (-not (Test-Path $DockerfilePath)) {
        Write-Host "❌ $Description - File not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $DockerfilePath -Raw
        $lines = $content -split "`n"
        $validInstructions = @("FROM", "RUN", "COPY", "ADD", "WORKDIR", "EXPOSE", "ENV", "CMD", "ENTRYPOINT", "HEALTHCHECK", "USER", "VOLUME", "ARG")
        $errors = @()
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            if ($trimmedLine -and -not $trimmedLine.StartsWith("#")) {
                $instruction = ($trimmedLine -split " ")[0]
                if ($instruction -and $validInstructions -notcontains $instruction) {
                    $errors += "Invalid instruction: $instruction"
                }
            }
        }
        
        if ($errors.Count -eq 0) {
            Write-Host "✅ $Description - Syntax valid" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "   📄 Lines: $($lines.Count)" -ForegroundColor Gray
                Write-Host "   📋 Instructions: $($lines | Where-Object { $_.Trim() -and -not $_.Trim().StartsWith('#') } | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "❌ $Description - Syntax errors found" -ForegroundColor Red
            foreach ($error in $errors) {
                Write-Host "   ⚠️  $error" -ForegroundColor Yellow
            }
            return $false
        }
    } catch {
        Write-Host "❌ $Description - Error reading file: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to validate Docker Compose syntax
function Test-ComposeSyntax {
    param([string]$ComposePath, [string]$Description)
    
    if (-not (Test-Path $ComposePath)) {
        Write-Host "❌ $Description - File not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $ComposePath -Raw
        $yamlContent = $content
        
        # Basic YAML validation
        if ($yamlContent -match "version:" -and $yamlContent -match "services:") {
            Write-Host "✅ $Description - Basic structure valid" -ForegroundColor Green
            if ($Verbose) {
                $serviceCount = ($yamlContent | Select-String "^\s*[a-zA-Z0-9_-]+:" | Measure-Object).Count
                Write-Host "   📊 Services: $serviceCount" -ForegroundColor Gray
                Write-Host "   📄 Size: $($content.Length) characters" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "❌ $Description - Invalid YAML structure" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Description - Error reading file: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to validate SQL files
function Test-SqlSyntax {
    param([string]$SqlPath, [string]$Description)
    
    if (-not (Test-Path $SqlPath)) {
        Write-Host "❌ $Description - File not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $SqlPath -Raw
        
        # Basic SQL validation
        $hasCreateTable = $content -match "CREATE TABLE"
        $hasInsert = $content -match "INSERT INTO"
        $hasCreateFunction = $content -match "CREATE.*FUNCTION"
        $hasCreatePolicy = $content -match "CREATE POLICY"
        
        if ($hasCreateTable -or $hasInsert -or $hasCreateFunction -or $hasCreatePolicy) {
            Write-Host "✅ $Description - SQL structure valid" -ForegroundColor Green
            if ($Verbose) {
                $lineCount = ($content -split "`n").Count
                Write-Host "   📄 Lines: $lineCount" -ForegroundColor Gray
                Write-Host "   📊 Tables: $(($content | Select-String "CREATE TABLE" | Measure-Object).Count)" -ForegroundColor Gray
                Write-Host "   📊 Inserts: $(($content | Select-String "INSERT INTO" | Measure-Object).Count)" -ForegroundColor Gray
                Write-Host "   📊 Functions: $(($content | Select-String "CREATE.*FUNCTION" | Measure-Object).Count)" -ForegroundColor Gray
                Write-Host "   📊 Policies: $(($content | Select-String "CREATE POLICY" | Measure-Object).Count)" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "❌ $Description - No valid SQL statements found" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Description - Error reading file: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to validate shell scripts
function Test-ShellScript {
    param([string]$ScriptPath, [string]$Description)
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Host "❌ $Description - File not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $ScriptPath -Raw
        
        # Basic shell script validation
        $hasShebang = $content.StartsWith("#!/")
        $hasCommands = $content -match "echo|docker|psql|curl"
        
        if ($hasShebang -and $hasCommands) {
            Write-Host "✅ $Description - Shell script structure valid" -ForegroundColor Green
            if ($Verbose) {
                $lineCount = ($content -split "`n").Count
                Write-Host "   📄 Lines: $lineCount" -ForegroundColor Gray
                Write-Host "   📊 Commands: $(($content | Select-String "echo|docker|psql|curl" | Measure-Object).Count)" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "❌ $Description - Invalid shell script structure" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Description - Error reading file: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main validation
Write-Host "🔍 Validating Docker Configuration Files..." -ForegroundColor Yellow
Write-Host ""

$totalTests = 0
$passedTests = 0

# Test Dockerfiles
Write-Host "📋 Testing Dockerfiles..." -ForegroundColor Cyan
$totalTests += 2
if (Test-DockerfileSyntax "docker/postgres/Dockerfile" "PostgreSQL Dockerfile") { $passedTests++ }
if (Test-DockerfileSyntax "Dockerfile.app" "Application Dockerfile") { $passedTests++ }

Write-Host ""

# Test Docker Compose files
Write-Host "📋 Testing Docker Compose files..." -ForegroundColor Cyan
$totalTests += 2
if (Test-ComposeSyntax "docker-compose.yml" "Main Docker Compose") { $passedTests++ }
if (Test-ComposeSyntax "docker-compose.dev.yml" "Development Docker Compose") { $passedTests++ }

Write-Host ""

# Test SQL initialization files
Write-Host "📋 Testing SQL initialization files..." -ForegroundColor Cyan
$totalTests += 3
if (Test-SqlSyntax "docker/postgres/init/01-init-database.sql" "Database initialization") { $passedTests++ }
if (Test-SqlSyntax "docker/postgres/init/02-seed-data.sql" "Seed data") { $passedTests++ }
if (Test-SqlSyntax "docker/postgres/init/03-environment-config.sql" "Environment configuration") { $passedTests++ }

Write-Host ""

# Test shell scripts
Write-Host "📋 Testing shell scripts..." -ForegroundColor Cyan
$totalTests += 3
if (Test-ShellScript "docker/postgres/docker-entrypoint-custom.sh" "PostgreSQL entrypoint") { $passedTests++ }
if (Test-ShellScript "docker/postgres/health-check.sh" "PostgreSQL health check") { $passedTests++ }
if (Test-ShellScript "docker/health-check.sh" "Application health check") { $passedTests++ }

Write-Host ""

# Test build scripts
Write-Host "📋 Testing build scripts..." -ForegroundColor Cyan
$totalTests += 1
if (Test-FileExists "build-images.ps1" "Build script") { $passedTests++ }

Write-Host ""

# Test configuration files
Write-Host "📋 Testing configuration files..." -ForegroundColor Cyan
$totalTests += 1
if (Test-FileExists "docker/postgres/config/postgresql.conf" "PostgreSQL configuration") { $passedTests++ }

Write-Host ""

# Summary
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Validation Summary" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "🎉 All Docker configurations are valid!" -ForegroundColor Green
    Write-Host "✅ Ready to build and test Docker images" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some configurations need attention" -ForegroundColor Yellow
    Write-Host "🔧 Fix the issues above before building images" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Install Docker Desktop (requires Administrator privileges)" -ForegroundColor White
Write-Host "2. Run: .\build-images.ps1 -Image all -Environment dev" -ForegroundColor White
Write-Host "3. Run: .\docker-manage.ps1 -Environment dev -Action start" -ForegroundColor White
Write-Host "4. Test the complete setup" -ForegroundColor White
