# Build Script for RAC Rewards Docker Images
# This script builds custom PostgreSQL and Application images

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("postgres", "app", "all")]
    [string]$Image = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "uat", "prod")]
    [string]$Environment = "dev",
    
    [switch]$NoCache,
    [switch]$Push,
    [switch]$Verbose
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards Docker Image Builder" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$REGISTRY = "rac-rewards"
$POSTGRES_IMAGE = "$REGISTRY/postgres"
$APP_IMAGE = "$REGISTRY/app"
$VERSION = "latest"

# Function to display help
function Show-Help {
    Write-Host "Usage: .\build-images.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Image <name>      - Image to build (postgres, app, all)" -ForegroundColor Gray
    Write-Host "  -Environment <env> - Target environment (dev, uat, prod)" -ForegroundColor Gray
    Write-Host "  -NoCache          - Build without cache" -ForegroundColor Gray
    Write-Host "  -Push             - Push images to registry" -ForegroundColor Gray
    Write-Host "  -Verbose          - Show detailed output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\build-images.ps1 -Image all -Environment dev" -ForegroundColor Gray
    Write-Host "  .\build-images.ps1 -Image postgres -NoCache" -ForegroundColor Gray
    Write-Host "  .\build-images.ps1 -Image app -Environment prod -Push" -ForegroundColor Gray
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

# Function to build PostgreSQL image
function Build-PostgreSQLImage {
    param([string]$env, [bool]$noCache, [bool]$push)
    
    Write-Host "🐘 Building PostgreSQL image for $env environment..." -ForegroundColor Green
    
    $tag = "$POSTGRES_IMAGE`:$env-$VERSION"
    $buildArgs = @()
    
    if ($noCache) {
        $buildArgs += "--no-cache"
    }
    
    if ($Verbose) {
        $buildArgs += "--progress=plain"
    }
    
    $buildArgs += "--build-arg"
    $buildArgs += "ENVIRONMENT=$env"
    $buildArgs += "-t"
    $buildArgs += $tag
    $buildArgs += "docker/postgres"
    
    $cmd = "docker build " + ($buildArgs -join " ")
    
    if ($Verbose) {
        Write-Host "Command: $cmd" -ForegroundColor Gray
    }
    
    Write-Host "Building image: $tag" -ForegroundColor Yellow
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL image built successfully: $tag" -ForegroundColor Green
        
        # Tag as latest for the environment
        $latestTag = "$POSTGRES_IMAGE`:$env"
        docker tag $tag $latestTag
        Write-Host "✅ Tagged as: $latestTag" -ForegroundColor Green
        
        if ($push) {
            Write-Host "📤 Pushing PostgreSQL image..." -ForegroundColor Yellow
            docker push $tag
            docker push $latestTag
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PostgreSQL image pushed successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to push PostgreSQL image!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Failed to build PostgreSQL image!" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to build Application image
function Build-ApplicationImage {
    param([string]$env, [bool]$noCache, [bool]$push)
    
    Write-Host "🚀 Building Application image for $env environment..." -ForegroundColor Green
    
    $tag = "$APP_IMAGE`:$env-$VERSION"
    $buildArgs = @()
    
    if ($noCache) {
        $buildArgs += "--no-cache"
    }
    
    if ($Verbose) {
        $buildArgs += "--progress=plain"
    }
    
    $buildArgs += "--build-arg"
    $buildArgs += "NODE_ENV=$env"
    $buildArgs += "-t"
    $buildArgs += $tag
    $buildArgs += "-f"
    $buildArgs += "Dockerfile.app"
    $buildArgs += "."
    
    $cmd = "docker build " + ($buildArgs -join " ")
    
    if ($Verbose) {
        Write-Host "Command: $cmd" -ForegroundColor Gray
    }
    
    Write-Host "Building image: $tag" -ForegroundColor Yellow
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application image built successfully: $tag" -ForegroundColor Green
        
        # Tag as latest for the environment
        $latestTag = "$APP_IMAGE`:$env"
        docker tag $tag $latestTag
        Write-Host "✅ Tagged as: $latestTag" -ForegroundColor Green
        
        if ($push) {
            Write-Host "📤 Pushing Application image..." -ForegroundColor Yellow
            docker push $tag
            docker push $latestTag
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Application image pushed successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to push Application image!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Failed to build Application image!" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to show image information
function Show-ImageInfo {
    param([string]$imageName)
    
    Write-Host "Image Information for $imageName:" -ForegroundColor Cyan
    
    $images = docker images --filter "reference=$imageName" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    if ($images) {
        Write-Host $images -ForegroundColor White
    } else {
        Write-Host "No images found for $imageName" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Function to clean up old images
function Clean-OldImages {
    Write-Host "🧹 Cleaning up old images..." -ForegroundColor Yellow
    
    # Remove dangling images
    $danglingImages = docker images -f "dangling=true" -q
    if ($danglingImages) {
        docker rmi $danglingImages
        Write-Host "✅ Removed dangling images" -ForegroundColor Green
    }
    
    # Remove unused images (optional)
    if ($Force) {
        Write-Host "Removing unused images..." -ForegroundColor Yellow
        docker image prune -f
        Write-Host "✅ Removed unused images" -ForegroundColor Green
    }
}

# Main execution
if (-not (Test-DockerRunning)) {
    exit 1
}

Write-Host "Building images for environment: $Environment" -ForegroundColor White
Write-Host "Target images: $Image" -ForegroundColor White
if ($NoCache) {
    Write-Host "Build mode: No cache" -ForegroundColor White
}
if ($Push) {
    Write-Host "Push mode: Enabled" -ForegroundColor White
}
Write-Host ""

$success = $true

switch ($Image) {
    "postgres" {
        $success = Build-PostgreSQLImage -env $Environment -noCache $NoCache -push $Push
    }
    "app" {
        $success = Build-ApplicationImage -env $Environment -noCache $NoCache -push $Push
    }
    "all" {
        $success = Build-PostgreSQLImage -env $Environment -noCache $NoCache -push $Push
        if ($success) {
            $success = Build-ApplicationImage -env $Environment -noCache $NoCache -push $Push
        }
    }
    default {
        Show-Help
        exit 1
    }
}

if ($success) {
    Write-Host ""
    Write-Host "📊 Built Images:" -ForegroundColor Cyan
    Show-ImageInfo -imageName $POSTGRES_IMAGE
    Show-ImageInfo -imageName $APP_IMAGE
    
    if ($NoCache) {
        Clean-OldImages
    }
    
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "✅ Image building completed successfully!" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Cyan
} else {
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "❌ Image building failed!" -ForegroundColor Red
    Write-Host "================================================================================" -ForegroundColor Cyan
    exit 1
}
