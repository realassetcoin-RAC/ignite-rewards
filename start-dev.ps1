# PowerShell script to start both database API server and frontend
# This script starts the database API server and the Vite development server

Write-Host "🚀 Starting RAC Rewards Development Environment" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
$dockerStatus = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL container is running
Write-Host "🔍 Checking PostgreSQL container..." -ForegroundColor Yellow
$postgresStatus = docker ps --filter "name=rac-rewards-postgres-dev" --format "table {{.Names}}\t{{.Status}}"
if ($postgresStatus -notmatch "rac-rewards-postgres-dev") {
    Write-Host "❌ PostgreSQL container is not running. Please start it first:" -ForegroundColor Red
    Write-Host "   docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker and PostgreSQL are running" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    bun install
}

# Check if API server dependencies are installed
if (-not (Test-Path "node_modules/express")) {
    Write-Host "📦 Installing API server dependencies..." -ForegroundColor Yellow
    bun add express pg cors
    bun add -D concurrently
}

# Start the API server in background
Write-Host "🔧 Starting Database API Server on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "bun" -ArgumentList "run", "dev:api" -WindowStyle Minimized

# Wait a moment for the API server to start
Start-Sleep -Seconds 3

# Test API server health
Write-Host "🔍 Testing API server health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host "✅ Database API Server is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Database API Server responded but may have issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Database API Server is not responding. Check the logs." -ForegroundColor Red
    Write-Host "   You can still run the frontend, but database operations will use cache fallbacks." -ForegroundColor Yellow
}

# Start the frontend development server
Write-Host "🌐 Starting Frontend Development Server..." -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Green
Write-Host "📊 Database API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:8085" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

bun run dev
