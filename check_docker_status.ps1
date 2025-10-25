# Check Docker Status and Migration Readiness
Write-Host "🐳 Docker Status Check" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n📊 Docker Status:" -ForegroundColor Yellow
try {
    $dockerInfo = docker info --format "{{.DockerRootDir}}" 2>$null
    if ($dockerInfo) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
        Write-Host "Docker Root Directory: $dockerInfo" -ForegroundColor White
    } else {
        Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
}

# Check Docker system usage
Write-Host "`n💾 Docker System Usage:" -ForegroundColor Yellow
try {
    docker system df
} catch {
    Write-Host "❌ Cannot get Docker system usage" -ForegroundColor Red
}

# Check D: drive availability
Write-Host "`n💿 D: Drive Status:" -ForegroundColor Yellow
if (Test-Path "D:\") {
    $dDrive = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "D:"}
    if ($dDrive) {
        $freeSpaceGB = [math]::Round($dDrive.FreeSpace / 1GB, 2)
        $totalSpaceGB = [math]::Round($dDrive.Size / 1GB, 2)
        Write-Host "✅ D: drive is available" -ForegroundColor Green
        Write-Host "Free Space: $freeSpaceGB GB / $totalSpaceGB GB" -ForegroundColor White
    }
} else {
    Write-Host "❌ D: drive not found" -ForegroundColor Red
}

# Check target directory
Write-Host "`n📁 Target Directory:" -ForegroundColor Yellow
$targetPath = "D:\RAC Rewards Repo\Docker_Images"
if (Test-Path $targetPath) {
    Write-Host "✅ Target directory exists: $targetPath" -ForegroundColor Green
} else {
    Write-Host "⚠️ Target directory does not exist: $targetPath" -ForegroundColor Yellow
    Write-Host "Will be created during migration" -ForegroundColor White
}

# Check current Docker data location
Write-Host "`n📂 Current Docker Data Location:" -ForegroundColor Yellow
$dockerDataPath = "$env:USERPROFILE\AppData\Local\Docker"
if (Test-Path $dockerDataPath) {
    Write-Host "✅ Docker data found at: $dockerDataPath" -ForegroundColor Green
    try {
        $size = (Get-ChildItem $dockerDataPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeGB = [math]::Round($size / 1GB, 2)
        Write-Host "Estimated size: $sizeGB GB" -ForegroundColor White
    } catch {
        Write-Host "Could not calculate size" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Docker data not found at expected location" -ForegroundColor Yellow
}

# Check Docker Desktop process
Write-Host "`n🖥️ Docker Desktop Process:" -ForegroundColor Yellow
$dockerProcesses = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcesses) {
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    Write-Host "Process ID: $($dockerProcesses[0].Id)" -ForegroundColor White
} else {
    Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
}

# Migration readiness
Write-Host "`n🎯 Migration Readiness:" -ForegroundColor Yellow
$ready = $true

if (-not (Test-Path "D:\")) {
    Write-Host "❌ D: drive not available" -ForegroundColor Red
    $ready = $false
}

if (-not $dockerProcesses) {
    Write-Host "❌ Docker Desktop not running" -ForegroundColor Red
    $ready = $false
}

if ($ready) {
    Write-Host "✅ Ready for migration!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Docker Desktop" -ForegroundColor White
    Write-Host "2. Go to Settings → Resources → Advanced" -ForegroundColor White
    Write-Host "3. Change Disk image location to: D:\RAC Rewards Repo\Docker_Images" -ForegroundColor White
    Write-Host "4. Click Apply and Restart" -ForegroundColor White
    Write-Host "5. Wait for migration to complete" -ForegroundColor White
} else {
    Write-Host "❌ Not ready for migration. Please fix the issues above." -ForegroundColor Red
}

Write-Host "`n📖 For detailed instructions, see: DOCKER_MIGRATION_MANUAL_STEPS.md" -ForegroundColor Cyan
