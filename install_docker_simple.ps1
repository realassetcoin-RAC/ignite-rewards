# Simple Docker and Kubernetes Installation Script
# Run this script as Administrator

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Docker and Kubernetes Installation for Windows" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Docker is already installed
if (Test-Command "docker") {
    Write-Host "Docker is already installed" -ForegroundColor Green
    $dockerVersion = docker --version
    Write-Host "Docker Version: $dockerVersion" -ForegroundColor White
} else {
    Write-Host "Docker not found. Please install Docker Desktop manually:" -ForegroundColor Yellow
    Write-Host "1. Go to https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "2. Download Docker Desktop for Windows" -ForegroundColor White
    Write-Host "3. Run the installer as Administrator" -ForegroundColor White
    Write-Host "4. Restart your computer after installation" -ForegroundColor White
    Write-Host "5. Start Docker Desktop and complete the setup" -ForegroundColor White
    Write-Host ""
}

# Check if kubectl is available
if (Test-Command "kubectl") {
    Write-Host "kubectl is already available" -ForegroundColor Green
    $kubectlVersion = kubectl version --client --short 2>$null
    Write-Host "kubectl Version: $kubectlVersion" -ForegroundColor White
} else {
    Write-Host "kubectl not found. It will be installed with Docker Desktop." -ForegroundColor Yellow
}

Write-Host ""

# Install Chocolatey if not present
if (-not (Test-Command "choco")) {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "Chocolatey installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Install useful tools via Chocolatey
$tools = @("git", "curl", "jq")

foreach ($tool in $tools) {
    if (-not (Test-Command $tool)) {
        Write-Host "Installing $tool..." -ForegroundColor Yellow
        try {
            choco install $tool -y
            Write-Host "$tool installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to install $tool" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$tool is already installed" -ForegroundColor Green
    }
}

Write-Host ""

# Create k8s directory
if (-not (Test-Path "k8s")) {
    New-Item -ItemType Directory -Path "k8s" -Force
    Write-Host "Created k8s directory" -ForegroundColor Green
}

# Create Kubernetes namespace file
$k8sNamespace = @"
apiVersion: v1
kind: Namespace
metadata:
  name: rac-rewards
"@

$k8sNamespace | Out-File -FilePath "k8s/namespace.yaml" -Encoding UTF8 -Force
Write-Host "Created k8s/namespace.yaml" -ForegroundColor Green

Write-Host ""

# Final instructions
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor White
Write-Host "2. Restart your computer after Docker installation" -ForegroundColor White
Write-Host "3. Start Docker Desktop" -ForegroundColor White
Write-Host "4. Enable Kubernetes in Docker Desktop settings" -ForegroundColor White
Write-Host "5. Test the installation:" -ForegroundColor White
Write-Host "   - docker --version" -ForegroundColor Gray
Write-Host "   - kubectl version --client" -ForegroundColor Gray
Write-Host ""

Write-Host "Docker Commands for RAC Rewards:" -ForegroundColor Yellow
Write-Host "   - docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
Write-Host "   - docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
Write-Host "   - docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "Kubernetes Commands:" -ForegroundColor Yellow
Write-Host "   - kubectl get nodes" -ForegroundColor Gray
Write-Host "   - kubectl get pods -n rac-rewards" -ForegroundColor Gray
Write-Host "   - kubectl apply -f k8s/" -ForegroundColor Gray
Write-Host ""

Write-Host "Installation script completed successfully!" -ForegroundColor Green
