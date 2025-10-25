# Simple Docker Status Check
Write-Host "Docker Status Check" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# Check Docker info
Write-Host "`nDocker Status:" -ForegroundColor Yellow
try {
    $dockerInfo = docker info --format "{{.DockerRootDir}}" 2>$null
    if ($dockerInfo) {
        Write-Host "Docker is running" -ForegroundColor Green
        Write-Host "Docker Root Directory: $dockerInfo" -ForegroundColor White
    } else {
        Write-Host "Docker is not running" -ForegroundColor Red
    }
} catch {
    Write-Host "Docker is not running" -ForegroundColor Red
}

# Check Docker system usage
Write-Host "`nDocker System Usage:" -ForegroundColor Yellow
try {
    docker system df
} catch {
    Write-Host "Cannot get Docker system usage" -ForegroundColor Red
}

# Check D: drive
Write-Host "`nD: Drive Status:" -ForegroundColor Yellow
if (Test-Path "D:\") {
    $dDrive = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "D:"}
    if ($dDrive) {
        $freeSpaceGB = [math]::Round($dDrive.FreeSpace / 1GB, 2)
        Write-Host "D: drive is available" -ForegroundColor Green
        Write-Host "Free Space: $freeSpaceGB GB" -ForegroundColor White
    }
} else {
    Write-Host "D: drive not found" -ForegroundColor Red
}

# Check Docker Desktop
Write-Host "`nDocker Desktop Process:" -ForegroundColor Yellow
$dockerProcesses = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcesses) {
    Write-Host "Docker Desktop is running" -ForegroundColor Green
} else {
    Write-Host "Docker Desktop is not running" -ForegroundColor Red
}

Write-Host "`nMigration Instructions:" -ForegroundColor Cyan
Write-Host "1. Open Docker Desktop" -ForegroundColor White
Write-Host "2. Go to Settings, then Resources, then Advanced" -ForegroundColor White
Write-Host "3. Change Disk image location to: D:\RAC Rewards Repo\Docker_Images" -ForegroundColor White
Write-Host "4. Click Apply and Restart" -ForegroundColor White
Write-Host "5. Wait for migration to complete" -ForegroundColor White
