# 🐳 Docker Migration to D: Drive Script
# This script helps migrate Docker data from C: drive to D:\RAC Rewards Repo\Docker_Images

param(
    [switch]$Backup,
    [switch]$Restore,
    [switch]$Verify,
    [switch]$Force
)

# Configuration
$DockerDataPath = "D:\RAC Rewards Repo\Docker_Images"
$BackupPath = "$DockerDataPath\backup"
$DockerServiceName = "com.docker.service"
$DockerDesktopPath = "$env:USERPROFILE\AppData\Local\Docker"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

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
    Write-ColorOutput "🛑 Stopping Docker services..." $Yellow
    
    try {
        # Stop Docker Desktop
        Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 3
        
        # Stop Docker service
        if (Get-Service -Name $DockerServiceName -ErrorAction SilentlyContinue) {
            Stop-Service -Name $DockerServiceName -Force
            Write-ColorOutput "✅ Docker service stopped" $Green
        }
        
        # Stop WSL2 if running
        wsl --shutdown 2>$null
        Write-ColorOutput "✅ WSL2 stopped" $Green
        
    } catch {
        Write-ColorOutput "⚠️ Warning: Could not stop all Docker services: $($_.Exception.Message)" $Yellow
    }
}

function Start-DockerServices {
    Write-ColorOutput "🚀 Starting Docker services..." $Yellow
    
    try {
        # Start Docker service
        if (Get-Service -Name $DockerServiceName -ErrorAction SilentlyContinue) {
            Start-Service -Name $DockerServiceName
            Write-ColorOutput "✅ Docker service started" $Green
        }
        
        # Start Docker Desktop
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
        Write-ColorOutput "✅ Docker Desktop started" $Green
        
    } catch {
        Write-ColorOutput "❌ Error starting Docker services: $($_.Exception.Message)" $Red
    }
}

function Backup-DockerData {
    Write-ColorOutput "📦 Creating backup of Docker data..." $Yellow
    
    try {
        # Create backup directory
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        
        # Check if Docker data exists
        if (Test-Path $DockerDesktopPath) {
            # Copy Docker data to backup
            Copy-Item -Path $DockerDesktopPath -Destination "$BackupPath\Docker_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse -Force
            Write-ColorOutput "✅ Docker data backed up to: $BackupPath" $Green
        } else {
            Write-ColorOutput "⚠️ No Docker data found at: $DockerDesktopPath" $Yellow
        }
        
    } catch {
        Write-ColorOutput "❌ Error creating backup: $($_.Exception.Message)" $Red
    }
}

function Move-DockerData {
    Write-ColorOutput "📁 Moving Docker data to D: drive..." $Yellow
    
    try {
        # Create target directory
        New-Item -ItemType Directory -Path $DockerDataPath -Force | Out-Null
        
        # Check if Docker data exists
        if (Test-Path $DockerDesktopPath) {
            # Move Docker data
            Move-Item -Path $DockerDesktopPath -Destination "$DockerDataPath\Docker" -Force
            Write-ColorOutput "✅ Docker data moved to: $DockerDataPath\Docker" $Green
        } else {
            Write-ColorOutput "⚠️ No Docker data found at: $DockerDesktopPath" $Yellow
        }
        
    } catch {
        Write-ColorOutput "❌ Error moving Docker data: $($_.Exception.Message)" $Red
        throw
    }
}

function Create-SymbolicLink {
    Write-ColorOutput "🔗 Creating symbolic link..." $Yellow
    
    try {
        # Remove existing symbolic link if it exists
        if (Test-Path $DockerDesktopPath) {
            Remove-Item -Path $DockerDesktopPath -Force
        }
        
        # Create symbolic link
        New-Item -ItemType SymbolicLink -Path $DockerDesktopPath -Target "$DockerDataPath\Docker" | Out-Null
        Write-ColorOutput "✅ Symbolic link created: $DockerDesktopPath -> $DockerDataPath\Docker" $Green
        
    } catch {
        Write-ColorOutput "❌ Error creating symbolic link: $($_.Exception.Message)" $Red
        throw
    }
}

function Restore-DockerData {
    Write-ColorOutput "🔄 Restoring Docker data from backup..." $Yellow
    
    try {
        # Find latest backup
        $backupDirs = Get-ChildItem -Path $BackupPath -Directory | Sort-Object LastWriteTime -Descending
        if ($backupDirs.Count -eq 0) {
            Write-ColorOutput "❌ No backup found at: $BackupPath" $Red
            return
        }
        
        $latestBackup = $backupDirs[0].FullName
        
        # Stop Docker services
        Stop-DockerServices
        
        # Remove current symbolic link
        if (Test-Path $DockerDesktopPath) {
            Remove-Item -Path $DockerDesktopPath -Force
        }
        
        # Restore from backup
        Copy-Item -Path $latestBackup -Destination $DockerDesktopPath -Recurse -Force
        Write-ColorOutput "✅ Docker data restored from: $latestBackup" $Green
        
        # Start Docker services
        Start-DockerServices
        
    } catch {
        Write-ColorOutput "❌ Error restoring Docker data: $($_.Exception.Message)" $Red
    }
}

function Verify-Migration {
    Write-ColorOutput "🔍 Verifying Docker migration..." $Yellow
    
    try {
        # Check if symbolic link exists and points to correct location
        if (Test-Path $DockerDesktopPath) {
            $linkTarget = (Get-Item $DockerDesktopPath).Target
            if ($linkTarget -like "*$DockerDataPath*") {
                Write-ColorOutput "✅ Symbolic link is correctly configured" $Green
            } else {
                Write-ColorOutput "❌ Symbolic link points to wrong location: $linkTarget" $Red
            }
        } else {
            Write-ColorOutput "❌ Symbolic link not found" $Red
        }
        
        # Check if target directory exists
        if (Test-Path "$DockerDataPath\Docker") {
            Write-ColorOutput "✅ Docker data directory exists on D: drive" $Green
        } else {
            Write-ColorOutput "❌ Docker data directory not found on D: drive" $Red
        }
        
        # Check disk space
        $dDrive = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "D:"}
        if ($dDrive) {
            $freeSpaceGB = [math]::Round($dDrive.FreeSpace / 1GB, 2)
            Write-ColorOutput "✅ D: drive free space: $freeSpaceGB GB" $Green
        }
        
    } catch {
        Write-ColorOutput "❌ Error during verification: $($_.Exception.Message)" $Red
    }
}

function Show-DockerInfo {
    Write-ColorOutput "📊 Docker Information:" $Cyan
    
    try {
        # Check Docker root directory
        $dockerRoot = docker info --format "{{.DockerRootDir}}" 2>$null
        if ($dockerRoot) {
            Write-ColorOutput "Docker Root Directory: $dockerRoot" $Green
        } else {
            Write-ColorOutput "Docker is not running or not accessible" $Red
        }
        
        # Check Docker images
        $images = docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>$null
        if ($images) {
            Write-ColorOutput "`nDocker Images:" $Cyan
            Write-Host $images
        }
        
        # Check Docker system usage
        $systemInfo = docker system df 2>$null
        if ($systemInfo) {
            Write-ColorOutput "`nDocker System Usage:" $Cyan
            Write-Host $systemInfo
        }
        
    } catch {
        Write-ColorOutput "❌ Error getting Docker info: $($_.Exception.Message)" $Red
    }
}

# Main execution
Write-ColorOutput "🐳 Docker Migration to D: Drive Script" $Cyan
Write-ColorOutput "=====================================" $Cyan

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-ColorOutput "❌ This script must be run as Administrator" $Red
    Write-ColorOutput "Please right-click PowerShell and select 'Run as Administrator'" $Yellow
    exit 1
}

# Check if D: drive exists
if (-not (Test-Path "D:\")) {
    Write-ColorOutput "❌ D: drive not found. Please ensure D: drive is available." $Red
    exit 1
}

# Handle different operations
if ($Backup) {
    Backup-DockerData
} elseif ($Restore) {
    Restore-DockerData
} elseif ($Verify) {
    Verify-Migration
    Show-DockerInfo
} else {
    # Full migration process
    Write-ColorOutput "🚀 Starting Docker migration to D: drive..." $Cyan
    
    # Confirm with user
    if (-not $Force) {
        $confirmation = Read-Host "This will move Docker data to D: drive. Continue? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-ColorOutput "Migration cancelled by user." $Yellow
            exit 0
        }
    }
    
    try {
        # Step 1: Backup (optional)
        if ($Backup) {
            Backup-DockerData
        }
        
        # Step 2: Stop Docker services
        Stop-DockerServices
        
        # Step 3: Move Docker data
        Move-DockerData
        
        # Step 4: Create symbolic link
        Create-SymbolicLink
        
        # Step 5: Start Docker services
        Start-DockerServices
        
        # Step 6: Wait for Docker to start
        Write-ColorOutput "⏳ Waiting for Docker to start..." $Yellow
        Start-Sleep -Seconds 10
        
        # Step 7: Verify migration
        Verify-Migration
        
        Write-ColorOutput "`n🎉 Docker migration completed successfully!" $Green
        Write-ColorOutput "Docker data is now stored at: $DockerDataPath" $Green
        
        # Show Docker info
        Show-DockerInfo
        
    } catch {
        Write-ColorOutput "`n❌ Migration failed: $($_.Exception.Message)" $Red
        Write-ColorOutput "You may need to restore from backup or manually fix the issue." $Yellow
        exit 1
    }
}

Write-ColorOutput "`n📋 Next Steps:" $Cyan
Write-ColorOutput "1. Test your RAC Rewards containers: docker-compose -f docker-compose.dev.yml up -d" $White
Write-ColorOutput "2. Verify database connection: docker exec rac-rewards-postgres-dev pg_isready -U postgres" $White
Write-ColorOutput "3. Check Docker system usage: docker system df" $White
Write-ColorOutput "4. Update your backup procedures to include the new Docker data location" $White
