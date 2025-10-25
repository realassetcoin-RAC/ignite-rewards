# Docker Management Script for RAC Rewards Application
# This script provides easy management of Docker containers for different environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "uat", "prod", "all")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "build", "clean", "backup", "restore")]
    [string]$Action,
    
    [string]$Service = "",
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards Docker Management" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to display help
function Show-Help {
    Write-Host "Usage: .\docker-manage.ps1 -Environment <env> -Action <action> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Environments:" -ForegroundColor White
    Write-Host "  dev    - Development environment" -ForegroundColor Gray
    Write-Host "  uat    - User Acceptance Testing environment" -ForegroundColor Gray
    Write-Host "  prod   - Production environment" -ForegroundColor Gray
    Write-Host "  all    - All environments" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor White
    Write-Host "  start   - Start containers" -ForegroundColor Gray
    Write-Host "  stop    - Stop containers" -ForegroundColor Gray
    Write-Host "  restart - Restart containers" -ForegroundColor Gray
    Write-Host "  status  - Show container status" -ForegroundColor Gray
    Write-Host "  logs    - Show container logs" -ForegroundColor Gray
    Write-Host "  build   - Build containers" -ForegroundColor Gray
    Write-Host "  clean   - Clean up containers and volumes" -ForegroundColor Gray
    Write-Host "  backup  - Backup database" -ForegroundColor Gray
    Write-Host "  restore - Restore database" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Service <name> - Target specific service" -ForegroundColor Gray
    Write-Host "  -Force          - Force action without confirmation" -ForegroundColor Gray
    Write-Host "  -Verbose        - Show detailed output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\docker-manage.ps1 -Environment dev -Action start" -ForegroundColor Gray
    Write-Host "  .\docker-manage.ps1 -Environment prod -Action logs -Service postgres" -ForegroundColor Gray
    Write-Host "  .\docker-manage.ps1 -Environment all -Action status" -ForegroundColor Gray
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        Write-Host "❌ Docker is not running or not installed!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        return $false
    }
}

# Function to get compose file based on environment
function Get-ComposeFile {
    param([string]$env)
    
    switch ($env) {
        "dev" { return "docker-compose.dev.yml" }
        "uat" { return "docker-compose.yml" }
        "prod" { return "docker-compose.yml" }
        "all" { return @("docker-compose.dev.yml", "docker-compose.yml") }
        default { return "docker-compose.dev.yml" }
    }
}

# Function to get service prefix based on environment
function Get-ServicePrefix {
    param([string]$env)
    
    switch ($env) {
        "dev" { return "rac-rewards-" }
        "uat" { return "rac-rewards-" }
        "prod" { return "rac-rewards-" }
        default { return "rac-rewards-" }
    }
}

# Function to start containers
function Start-Containers {
    param([string]$env, [string]$service = "")
    
    $composeFiles = Get-ComposeFile -env $env
    
    foreach ($composeFile in $composeFiles) {
        if (-not (Test-Path $composeFile)) {
            Write-Host "⚠️  Compose file $composeFile not found, skipping..." -ForegroundColor Yellow
            continue
        }
        
        Write-Host "🚀 Starting $env environment using $composeFile..." -ForegroundColor Green
        
        $cmd = "docker-compose -f $composeFile up -d"
        if ($service) {
            $cmd += " $service"
        }
        
        if ($Verbose) {
            Write-Host "Command: $cmd" -ForegroundColor Gray
        }
        
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $env environment started successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start $env environment!" -ForegroundColor Red
        }
    }
}

# Function to stop containers
function Stop-Containers {
    param([string]$env, [string]$service = "")
    
    $composeFiles = Get-ComposeFile -env $env
    
    foreach ($composeFile in $composeFiles) {
        if (-not (Test-Path $composeFile)) {
            Write-Host "⚠️  Compose file $composeFile not found, skipping..." -ForegroundColor Yellow
            continue
        }
        
        Write-Host "🛑 Stopping $env environment using $composeFile..." -ForegroundColor Yellow
        
        $cmd = "docker-compose -f $composeFile down"
        if ($service) {
            $cmd += " $service"
        }
        
        if ($Verbose) {
            Write-Host "Command: $cmd" -ForegroundColor Gray
        }
        
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $env environment stopped successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop $env environment!" -ForegroundColor Red
        }
    }
}

# Function to restart containers
function Restart-Containers {
    param([string]$env, [string]$service = "")
    
    Write-Host "🔄 Restarting $env environment..." -ForegroundColor Cyan
    Stop-Containers -env $env -service $service
    Start-Sleep -Seconds 2
    Start-Containers -env $env -service $service
}

# Function to show container status
function Show-ContainerStatus {
    param([string]$env)
    
    Write-Host "📊 Container Status for $env environment:" -ForegroundColor Cyan
    
    $prefix = Get-ServicePrefix -env $env
    
    $containers = docker ps -a --filter "name=$prefix" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    if ($containers) {
        Write-Host $containers -ForegroundColor White
    } else {
        Write-Host "No containers found for $env environment." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💾 Volume Status:" -ForegroundColor Cyan
    $volumes = docker volume ls --filter "name=rac-rewards" --format "table {{.Name}}\t{{.Driver}}"
    if ($volumes) {
        Write-Host $volumes -ForegroundColor White
    } else {
        Write-Host "No volumes found." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🌐 Network Status:" -ForegroundColor Cyan
    $networks = docker network ls --filter "name=rac-rewards" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
    if ($networks) {
        Write-Host $networks -ForegroundColor White
    } else {
        Write-Host "No networks found." -ForegroundColor Yellow
    }
}

# Function to show container logs
function Show-ContainerLogs {
    param([string]$env, [string]$service = "")
    
    $prefix = Get-ServicePrefix -env $env
    
    if ($service) {
        $containerName = "$prefix$service"
        Write-Host "📋 Logs for $containerName:" -ForegroundColor Cyan
        docker logs --tail 50 -f $containerName
    } else {
        Write-Host "📋 Logs for $env environment:" -ForegroundColor Cyan
        $composeFiles = Get-ComposeFile -env $env
        
        foreach ($composeFile in $composeFiles) {
            if (Test-Path $composeFile) {
                Write-Host "Using $composeFile:" -ForegroundColor Yellow
                docker-compose -f $composeFile logs --tail 20
            }
        }
    }
}

# Function to build containers
function Build-Containers {
    param([string]$env, [string]$service = "")
    
    $composeFiles = Get-ComposeFile -env $env
    
    foreach ($composeFile in $composeFiles) {
        if (-not (Test-Path $composeFile)) {
            Write-Host "⚠️  Compose file $composeFile not found, skipping..." -ForegroundColor Yellow
            continue
        }
        
        Write-Host "🔨 Building $env environment using $composeFile..." -ForegroundColor Green
        
        $cmd = "docker-compose -f $composeFile build"
        if ($service) {
            $cmd += " $service"
        }
        if ($Force) {
            $cmd += " --no-cache"
        }
        
        if ($Verbose) {
            Write-Host "Command: $cmd" -ForegroundColor Gray
        }
        
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $env environment built successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to build $env environment!" -ForegroundColor Red
        }
    }
}

# Function to clean up containers and volumes
function Clean-Containers {
    param([string]$env)
    
    if (-not $Force) {
        $confirmation = Read-Host "⚠️  This will remove all containers, volumes, and images for $env environment. Continue? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "❌ Cleanup cancelled." -ForegroundColor Yellow
            return
        }
    }
    
    Write-Host "🧹 Cleaning up $env environment..." -ForegroundColor Yellow
    
    $prefix = Get-ServicePrefix -env $env
    
    # Stop and remove containers
    $containers = docker ps -a --filter "name=$prefix" --format "{{.Names}}"
    if ($containers) {
        Write-Host "Stopping and removing containers..." -ForegroundColor Gray
        docker stop $containers
        docker rm $containers
    }
    
    # Remove volumes
    $volumes = docker volume ls --filter "name=rac-rewards" --format "{{.Name}}"
    if ($volumes) {
        Write-Host "Removing volumes..." -ForegroundColor Gray
        docker volume rm $volumes
    }
    
    # Remove networks
    $networks = docker network ls --filter "name=rac-rewards" --format "{{.Name}}"
    if ($networks) {
        Write-Host "Removing networks..." -ForegroundColor Gray
        docker network rm $networks
    }
    
    # Remove images (optional)
    if ($Force) {
        $images = docker images --filter "reference=rac-rewards*" --format "{{.Repository}}:{{.Tag}}"
        if ($images) {
            Write-Host "Removing images..." -ForegroundColor Gray
            docker rmi $images
        }
    }
    
    Write-Host "✅ Cleanup completed for $env environment!" -ForegroundColor Green
}

# Function to backup database
function Backup-Database {
    param([string]$env)
    
    $prefix = Get-ServicePrefix -env $env
    $containerName = "$prefix" + "postgres"
    
    if ($env -eq "dev") {
        $containerName += "-dev"
    } elseif ($env -eq "uat") {
        $containerName += "-uat"
    } elseif ($env -eq "prod") {
        $containerName += "-prod"
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_${env}_${timestamp}.sql"
    
    Write-Host "💾 Backing up $env database..." -ForegroundColor Green
    
    # Check if container is running
    $containerStatus = docker inspect --format='{{.State.Status}}' $containerName 2>$null
    if ($containerStatus -ne "running") {
        Write-Host "❌ Container $containerName is not running!" -ForegroundColor Red
        return
    }
    
    # Create backup
    docker exec $containerName pg_dump -U postgres -d ignite_rewards > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database backup created: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database backup!" -ForegroundColor Red
    }
}

# Function to restore database
function Restore-Database {
    param([string]$env, [string]$backupFile)
    
    if (-not $backupFile) {
        Write-Host "❌ Please specify a backup file to restore!" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path $backupFile)) {
        Write-Host "❌ Backup file $backupFile not found!" -ForegroundColor Red
        return
    }
    
    $prefix = Get-ServicePrefix -env $env
    $containerName = "$prefix" + "postgres"
    
    if ($env -eq "dev") {
        $containerName += "-dev"
    } elseif ($env -eq "uat") {
        $containerName += "-uat"
    } elseif ($env -eq "prod") {
        $containerName += "-prod"
    }
    
    Write-Host "🔄 Restoring $env database from $backupFile..." -ForegroundColor Green
    
    # Check if container is running
    $containerStatus = docker inspect --format='{{.State.Status}}' $containerName 2>$null
    if ($containerStatus -ne "running") {
        Write-Host "❌ Container $containerName is not running!" -ForegroundColor Red
        return
    }
    
    # Restore backup
    Get-Content $backupFile | docker exec -i $containerName psql -U postgres -d ignite_rewards
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to restore database!" -ForegroundColor Red
    }
}

# Main execution
if (-not (Test-DockerRunning)) {
    exit 1
}

Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Action: $Action" -ForegroundColor White
if ($Service) {
    Write-Host "Service: $Service" -ForegroundColor White
}
Write-Host ""

switch ($Action) {
    "start" {
        if ($Environment -eq "all") {
            Start-Containers -env "dev" -service $Service
            Start-Containers -env "uat" -service $Service
            Start-Containers -env "prod" -service $Service
        } else {
            Start-Containers -env $Environment -service $Service
        }
    }
    "stop" {
        if ($Environment -eq "all") {
            Stop-Containers -env "dev" -service $Service
            Stop-Containers -env "uat" -service $Service
            Stop-Containers -env "prod" -service $Service
        } else {
            Stop-Containers -env $Environment -service $Service
        }
    }
    "restart" {
        if ($Environment -eq "all") {
            Restart-Containers -env "dev" -service $Service
            Restart-Containers -env "uat" -service $Service
            Restart-Containers -env "prod" -service $Service
        } else {
            Restart-Containers -env $Environment -service $Service
        }
    }
    "status" {
        if ($Environment -eq "all") {
            Show-ContainerStatus -env "dev"
            Show-ContainerStatus -env "uat"
            Show-ContainerStatus -env "prod"
        } else {
            Show-ContainerStatus -env $Environment
        }
    }
    "logs" {
        if ($Environment -eq "all") {
            Write-Host "❌ Cannot show logs for all environments at once. Please specify a specific environment." -ForegroundColor Red
        } else {
            Show-ContainerLogs -env $Environment -service $Service
        }
    }
    "build" {
        if ($Environment -eq "all") {
            Build-Containers -env "dev" -service $Service
            Build-Containers -env "uat" -service $Service
            Build-Containers -env "prod" -service $Service
        } else {
            Build-Containers -env $Environment -service $Service
        }
    }
    "clean" {
        if ($Environment -eq "all") {
            Clean-Containers -env "dev"
            Clean-Containers -env "uat"
            Clean-Containers -env "prod"
        } else {
            Clean-Containers -env $Environment
        }
    }
    "backup" {
        if ($Environment -eq "all") {
            Backup-Database -env "dev"
            Backup-Database -env "uat"
            Backup-Database -env "prod"
        } else {
            Backup-Database -env $Environment
        }
    }
    "restore" {
        if ($Environment -eq "all") {
            Write-Host "❌ Cannot restore to all environments at once. Please specify a specific environment." -ForegroundColor Red
        } else {
            $backupFile = Read-Host "Enter backup file path"
            Restore-Database -env $Environment -backupFile $backupFile
        }
    }
    default {
        Show-Help
    }
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Operation completed!" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
