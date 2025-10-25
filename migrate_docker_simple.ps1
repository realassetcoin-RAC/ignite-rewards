# 🐳 Simple Docker Migration to D: Drive Script
param(
    [switch]$Verify,
    [switch]$Force
)

# Configuration
$DockerDataPath = "D:\RAC Rewards Repo\Docker_Images"
$DockerDesktopPath = "$env:USERPROFILE\AppData\Local\Docker"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-DockerServices {
    Write-ColorOutput "🛑 Stopping Docker services..." "Yellow"
    
    try {
        # Stop Docker Desktop
        Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 3
        
        # Stop Docker service
        if (Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue) {
            Stop-Service -Name "com.docker.service" -Force
            Write-ColorOutput "✅ Docker service stopped" "Green"
        }
        
        # Stop WSL2 if running
        wsl --shutdown 2>$null
        Write-ColorOutput "✅ WSL2 stopped" "Green"
        
    } catch {
        Write-ColorOutput "⚠️ Warning: Could not stop all Docker services: $($_.Exception.Message)" "Yellow"
    }
}

function Start-DockerServices {
    Write-ColorOutput "🚀 Starting Docker services..." "Yellow"
    
    try {
        # Start Docker service
        if (Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue) {
            Start-Service -Name "com.docker.service"
            Write-ColorOutput "✅ Docker service started" "Green"
        }
        
        # Start Docker Desktop
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
        Write-ColorOutput "✅ Docker Desktop started" "Green"
        
    } catch {
        Write-ColorOutput "❌ Error starting Docker services: $($_.Exception.Message)" "Red"
    }
}

function Move-DockerData {
    Write-ColorOutput "📁 Moving Docker data to D: drive..." "Yellow"
    
    try {
        # Create target directory
        New-Item -ItemType Directory -Path $DockerDataPath -Force | Out-Null
        
        # Check if Docker data exists
        if (Test-Path $DockerDesktopPath) {
            # Move Docker data
            Move-Item -Path $DockerDesktopPath -Destination "$DockerDataPath\Docker" -Force
            Write-ColorOutput "✅ Docker data moved to: $DockerDataPath\Docker" "Green"
        } else {
            Write-ColorOutput "⚠️ No Docker data found at: $DockerDesktopPath" "Yellow"
        }
        
    } catch {
        Write-ColorOutput "❌ Error moving Docker data: $($_.Exception.Message)" "Red"
        throw
    }
}

function Create-SymbolicLink {
    Write-ColorOutput "🔗 Creating symbolic link..." "Yellow"
    
    try {
        # Remove existing symbolic link if it exists
        if (Test-Path $DockerDesktopPath) {
            Remove-Item -Path $DockerDesktopPath -Force
        }
        
        # Create symbolic link
        New-Item -ItemType SymbolicLink -Path $DockerDesktopPath -Target "$DockerDataPath\Docker" | Out-Null
        Write-ColorOutput "✅ Symbolic link created: $DockerDesktopPath -> $DockerDataPath\Docker" "Green"
        
    } catch {
        Write-ColorOutput "❌ Error creating symbolic link: $($_.Exception.Message)" "Red"
        throw
    }
}

function Verify-Migration {
    Write-ColorOutput "🔍 Verifying Docker migration..." "Yellow"
    
    try {
        # Check if symbolic link exists and points to correct location
        if (Test-Path $DockerDesktopPath) {
            $linkTarget = (Get-Item $DockerDesktopPath).Target
            if ($linkTarget -like "*$DockerDataPath*") {
                Write-ColorOutput "✅ Symbolic link is correctly configured" "Green"
            } else {
                Write-ColorOutput "❌ Symbolic link points to wrong location: $linkTarget" "Red"
            }
        } else {
            Write-ColorOutput "❌ Symbolic link not found" "Red"
        }
        
        # Check if target directory exists
        if (Test-Path "$DockerDataPath\Docker") {
            Write-ColorOutput "✅ Docker data directory exists on D: drive" "Green"
        } else {
            Write-ColorOutput "❌ Docker data directory not found on D: drive" "Red"
        }
        
        # Check disk space
        $dDrive = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "D:"}
        if ($dDrive) {
            $freeSpaceGB = [math]::Round($dDrive.FreeSpace / 1GB, 2)
            Write-ColorOutput "✅ D: drive free space: $freeSpaceGB GB" "Green"
        }
        
        # Check Docker info if running
        try {
            $dockerRoot = docker info --format "{{.DockerRootDir}}" 2>$null
            if ($dockerRoot) {
                Write-ColorOutput "✅ Docker Root Directory: $dockerRoot" "Green"
            }
        } catch {
            Write-ColorOutput "⚠️ Docker is not running or not accessible" "Yellow"
        }
        
    } catch {
        Write-ColorOutput "❌ Error during verification: $($_.Exception.Message)" "Red"
    }
}

# Main execution
Write-ColorOutput "🐳 Docker Migration to D: Drive Script" "Cyan"
Write-ColorOutput "=====================================" "Cyan"

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-ColorOutput "❌ This script must be run as Administrator" "Red"
    Write-ColorOutput "Please right-click PowerShell and select 'Run as Administrator'" "Yellow"
    exit 1
}

# Check if D: drive exists
if (-not (Test-Path "D:\")) {
    Write-ColorOutput "❌ D: drive not found. Please ensure D: drive is available." "Red"
    exit 1
}

if ($Verify) {
    Verify-Migration
    exit 0
}

# Full migration process
Write-ColorOutput "🚀 Starting Docker migration to D: drive..." "Cyan"

# Confirm with user
if (-not $Force) {
    $confirmation = Read-Host "This will move Docker data to D: drive. Continue? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-ColorOutput "Migration cancelled by user." "Yellow"
        exit 0
    }
}

try {
    # Step 1: Stop Docker services
    Stop-DockerServices
    
    # Step 2: Move Docker data
    Move-DockerData
    
    # Step 3: Create symbolic link
    Create-SymbolicLink
    
    # Step 4: Start Docker services
    Start-DockerServices
    
    # Step 5: Wait for Docker to start
    Write-ColorOutput "⏳ Waiting for Docker to start..." "Yellow"
    Start-Sleep -Seconds 10
    
    # Step 6: Verify migration
    Verify-Migration
    
    Write-ColorOutput "`n🎉 Docker migration completed successfully!" "Green"
    Write-ColorOutput "Docker data is now stored at: $DockerDataPath" "Green"
    
} catch {
    Write-ColorOutput "`n❌ Migration failed: $($_.Exception.Message)" "Red"
    Write-ColorOutput "You may need to manually fix the issue." "Yellow"
    exit 1
}

Write-ColorOutput "`n📋 Next Steps:" "Cyan"
Write-ColorOutput "1. Test your RAC Rewards containers: docker-compose -f docker-compose.dev.yml up -d" "White"
Write-ColorOutput "2. Verify database connection: docker exec rac-rewards-postgres-dev pg_isready -U postgres" "White"
Write-ColorOutput "3. Check Docker system usage: docker system df" "White"
