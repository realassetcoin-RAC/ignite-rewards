# Docker and Kubernetes Installation Script for Windows
# This script will install Docker Desktop and configure Kubernetes

param(
    [switch]$SkipDocker,
    [switch]$SkipKubernetes,
    [switch]$Force
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Docker and Kubernetes Installation for Windows" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to download file with progress
function Download-FileWithProgress {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Description
    )
    
    Write-Host "📥 Downloading $Description..." -ForegroundColor Yellow
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($Url, $OutputPath)
        Write-Host "✅ Downloaded $Description successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to download $Description`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check Windows version and features
Write-Host "🔍 Checking Windows version and features..." -ForegroundColor Yellow

$windowsVersion = [System.Environment]::OSVersion.Version
Write-Host "Windows Version: $($windowsVersion.Major).$($windowsVersion.Minor).$($windowsVersion.Build)" -ForegroundColor White

# Check if WSL2 is available
$wslAvailable = Test-Command "wsl"
if ($wslAvailable) {
    Write-Host "✅ WSL is available" -ForegroundColor Green
} else {
    Write-Host "⚠️  WSL not found. Docker Desktop will install WSL2 if needed." -ForegroundColor Yellow
}

# Check if Hyper-V is available
$hyperVAvailable = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
if ($hyperVAvailable -and $hyperVAvailable.State -eq "Enabled") {
    Write-Host "✅ Hyper-V is enabled" -ForegroundColor Green
} else {
    Write-Host "⚠️  Hyper-V not enabled. Docker Desktop will use WSL2 backend." -ForegroundColor Yellow
}

Write-Host ""

# Install Docker Desktop
if (-not $SkipDocker) {
    Write-Host "🐳 Installing Docker Desktop..." -ForegroundColor Cyan
    
    # Check if Docker is already installed
    if (Test-Command "docker") {
        Write-Host "✅ Docker is already installed" -ForegroundColor Green
        $dockerVersion = docker --version
        Write-Host "Docker Version: $dockerVersion" -ForegroundColor White
    } else {
        Write-Host "📥 Docker not found. Downloading Docker Desktop..." -ForegroundColor Yellow
        
        # Download Docker Desktop
        $dockerInstallerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
        $dockerInstallerPath = "$env:TEMP\DockerDesktopInstaller.exe"
        
        if (Download-FileWithProgress -Url $dockerInstallerUrl -OutputPath $dockerInstallerPath -Description "Docker Desktop") {
            Write-Host "🚀 Installing Docker Desktop..." -ForegroundColor Yellow
            Write-Host "This may take several minutes. Please wait..." -ForegroundColor Yellow
            
            try {
                # Install Docker Desktop silently
                $process = Start-Process -FilePath $dockerInstallerPath -ArgumentList "install", "--quiet", "--accept-license" -Wait -PassThru
                
                if ($process.ExitCode -eq 0) {
                    Write-Host "✅ Docker Desktop installed successfully!" -ForegroundColor Green
                    Write-Host "⚠️  Please restart your computer to complete the installation." -ForegroundColor Yellow
                    Write-Host "After restart, Docker Desktop will start automatically." -ForegroundColor White
                } else {
                    Write-Host "❌ Docker Desktop installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "❌ Failed to install Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
            }
            finally {
                # Clean up installer
                if (Test-Path $dockerInstallerPath) {
                    Remove-Item $dockerInstallerPath -Force
                }
            }
        }
    }
    
    Write-Host ""
}

# Install Kubernetes (via Docker Desktop)
if (-not $SkipKubernetes) {
    Write-Host "☸️  Configuring Kubernetes..." -ForegroundColor Cyan
    
    # Check if kubectl is available
    if (Test-Command "kubectl") {
        Write-Host "✅ kubectl is already available" -ForegroundColor Green
        $kubectlVersion = kubectl version --client --short 2>$null
        Write-Host "kubectl Version: $kubectlVersion" -ForegroundColor White
    } else {
        Write-Host "📥 kubectl not found. It will be installed with Docker Desktop." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📋 Kubernetes Configuration Instructions:" -ForegroundColor Yellow
    Write-Host "1. After Docker Desktop is installed and running:" -ForegroundColor White
    Write-Host "2. Open Docker Desktop" -ForegroundColor White
    Write-Host "3. Go to Settings (gear icon)" -ForegroundColor White
    Write-Host "4. Navigate to 'Kubernetes' in the left sidebar" -ForegroundColor White
    Write-Host "5. Check 'Enable Kubernetes'" -ForegroundColor White
    Write-Host "6. Click 'Apply & Restart'" -ForegroundColor White
    Write-Host "7. Wait for Kubernetes to start (this may take a few minutes)" -ForegroundColor White
    Write-Host ""
}

# Install additional tools
Write-Host "🛠️  Installing additional development tools..." -ForegroundColor Cyan

# Install Chocolatey if not present
if (-not (Test-Command "choco")) {
    Write-Host "📥 Installing Chocolatey package manager..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Install useful tools via Chocolatey
$tools = @(
    "git",
    "curl",
    "jq",
    "helm"
)

foreach ($tool in $tools) {
    if (-not (Test-Command $tool)) {
        Write-Host "📥 Installing $tool..." -ForegroundColor Yellow
        try {
            choco install $tool -y
            Write-Host "✅ $tool installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Failed to install $tool`: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ $tool is already installed" -ForegroundColor Green
    }
}

Write-Host ""

# Create Docker configuration for RAC Rewards
Write-Host "📝 Creating Docker configuration for RAC Rewards..." -ForegroundColor Cyan

$dockerComposeContent = @"
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: rac-rewards-postgres
    environment:
      POSTGRES_DB: ignite_rewards
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Maegan@200328
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - rac-rewards-network

  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: rac-rewards-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - rac-rewards-network

  # RAC Rewards Application
  app:
    build: .
    container_name: rac-rewards-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:Maegan@200328@postgres:5432/ignite_rewards
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - rac-rewards-network

volumes:
  postgres_data:
  redis_data:

networks:
  rac-rewards-network:
    driver: bridge
"@

$dockerComposeContent | Out-File -FilePath "docker-compose.dev.yml" -Encoding UTF8 -Force
Write-Host "✅ Created docker-compose.dev.yml" -ForegroundColor Green

# Create Dockerfile
$dockerfileContent = @"
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
"@

$dockerfileContent | Out-File -FilePath "Dockerfile" -Encoding UTF8 -Force
Write-Host "✅ Created Dockerfile" -ForegroundColor Green

# Create Kubernetes manifests
$k8sNamespace = @"
apiVersion: v1
kind: Namespace
metadata:
  name: rac-rewards
"@

$k8sNamespace | Out-File -FilePath "k8s/namespace.yaml" -Encoding UTF8 -Force
Write-Host "✅ Created k8s/namespace.yaml" -ForegroundColor Green

Write-Host ""

# Final instructions
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart your computer (if Docker Desktop was installed)" -ForegroundColor White
Write-Host "2. Start Docker Desktop" -ForegroundColor White
Write-Host "3. Enable Kubernetes in Docker Desktop settings" -ForegroundColor White
Write-Host "4. Test the installation:" -ForegroundColor White
Write-Host "   - docker --version" -ForegroundColor Gray
Write-Host "   - kubectl version --client" -ForegroundColor Gray
Write-Host "   - docker-compose --version" -ForegroundColor Gray
Write-Host ""

Write-Host "🐳 Docker Commands for RAC Rewards:" -ForegroundColor Yellow
Write-Host "   - docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
Write-Host "   - docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
Write-Host "   - docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "☸️  Kubernetes Commands:" -ForegroundColor Yellow
Write-Host "   - kubectl get nodes" -ForegroundColor Gray
Write-Host "   - kubectl get pods -n rac-rewards" -ForegroundColor Gray
Write-Host "   - kubectl apply -f k8s/" -ForegroundColor Gray
Write-Host ""

Write-Host "Installation script completed successfully!" -ForegroundColor Green
