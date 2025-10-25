# Simple Docker Configuration Test
Write-Host "🔍 Testing Docker Configuration Files..." -ForegroundColor Cyan

# Test key files exist
$files = @(
    "docker/postgres/Dockerfile",
    "Dockerfile.app", 
    "docker-compose.yml",
    "docker-compose.dev.yml",
    "build-images.ps1"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""
if ($allExist) {
    Write-Host "🎉 All Docker configuration files exist!" -ForegroundColor Green
    Write-Host "✅ Ready to build Docker images" -ForegroundColor Green
} else {
    Write-Host "Some files are missing" -ForegroundColor Yellow
}
