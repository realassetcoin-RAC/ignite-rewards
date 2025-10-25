# Docker and Kubernetes Installation Guide for Windows

## 🎯 **Overview**

This guide will help you install Docker Desktop and Kubernetes on your Windows system for the RAC Rewards application development.

## 📋 **Prerequisites**

- **Windows 10/11** (64-bit)
- **Administrator privileges**
- **8GB RAM minimum** (16GB recommended)
- **Virtualization enabled** in BIOS
- **Internet connection**

## 🚀 **Quick Installation**

### **Option 1: Automated Script (Recommended)**
```powershell
# Run as Administrator
.\install_docker_kubernetes.ps1
```

### **Option 2: Manual Installation**
Follow the step-by-step guide below.

## 📥 **Step 1: Install Docker Desktop**

### **1.1 Download Docker Desktop**
1. Go to [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Click "Download for Windows"
3. Run the installer as Administrator

### **1.2 Installation Options**
- ✅ **Use WSL 2 instead of Hyper-V** (recommended)
- ✅ **Add shortcut to desktop**
- ✅ **Use Windows containers** (optional)

### **1.3 Post-Installation**
1. Restart your computer
2. Start Docker Desktop
3. Complete the setup wizard
4. Verify installation:
   ```powershell
   docker --version
   docker run hello-world
   ```

## ☸️ **Step 2: Enable Kubernetes**

### **2.1 Enable Kubernetes in Docker Desktop**
1. Open Docker Desktop
2. Click the **Settings** icon (gear)
3. Navigate to **Kubernetes** in the left sidebar
4. Check **"Enable Kubernetes"**
5. Click **"Apply & Restart"**
6. Wait for Kubernetes to start (2-5 minutes)

### **2.2 Verify Kubernetes Installation**
```powershell
kubectl version --client
kubectl get nodes
```

## 🛠️ **Step 3: Install Additional Tools**

### **3.1 Install Chocolatey (Package Manager)**
```powershell
# Run in PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### **3.2 Install Development Tools**
```powershell
# Install useful tools
choco install git curl jq helm -y
```

## 🐳 **Step 4: Docker Configuration for RAC Rewards**

### **4.1 Docker Compose Setup**
The installation script creates `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
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

  redis:
    image: redis:7-alpine
    container_name: rac-rewards-redis
    ports:
      - "6379:6379"

  app:
    build: .
    container_name: rac-rewards-app
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
```

### **4.2 Docker Commands**
```powershell
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build -d
```

## ☸️ **Step 5: Kubernetes Configuration**

### **5.1 Create Kubernetes Namespace**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: rac-rewards
```

### **5.2 Deploy to Kubernetes**
```powershell
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy application
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n rac-rewards
kubectl get services -n rac-rewards
```

## 🧪 **Step 6: Testing the Installation**

### **6.1 Test Docker**
```powershell
# Check Docker version
docker --version

# Test Docker with hello-world
docker run hello-world

# Check running containers
docker ps

# Check Docker Compose
docker-compose --version
```

### **6.2 Test Kubernetes**
```powershell
# Check kubectl version
kubectl version --client

# Check cluster nodes
kubectl get nodes

# Check cluster info
kubectl cluster-info
```

### **6.3 Test RAC Rewards with Docker**
```powershell
# Start the application stack
docker-compose -f docker-compose.dev.yml up -d

# Check if services are running
docker-compose -f docker-compose.dev.yml ps

# View application logs
docker-compose -f docker-compose.dev.yml logs app

# Access the application
# Open browser to http://localhost:3000
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Docker Desktop Won't Start**
- **Solution**: Enable virtualization in BIOS
- **Check**: Windows Features → Hyper-V (if using Hyper-V)
- **Alternative**: Use WSL 2 backend

#### **2. Kubernetes Won't Enable**
- **Solution**: Restart Docker Desktop
- **Check**: Sufficient RAM (8GB+)
- **Wait**: Kubernetes startup can take 5+ minutes

#### **3. Port Conflicts**
- **Solution**: Change ports in docker-compose.yml
- **Check**: `netstat -an | findstr :3000`

#### **4. WSL 2 Issues**
```powershell
# Update WSL 2
wsl --update

# Set WSL 2 as default
wsl --set-default-version 2
```

### **Performance Optimization**

#### **Docker Desktop Settings**
1. **Resources**:
   - CPU: 4+ cores
   - Memory: 8GB+
   - Disk: 60GB+

2. **Advanced**:
   - Enable file sharing for project directory
   - Enable experimental features (optional)

## 📊 **System Requirements**

### **Minimum Requirements**
- **OS**: Windows 10 64-bit (Build 19041+) or Windows 11
- **RAM**: 8GB
- **CPU**: 4 cores
- **Disk**: 20GB free space
- **Virtualization**: Enabled in BIOS

### **Recommended Requirements**
- **OS**: Windows 11 64-bit
- **RAM**: 16GB+
- **CPU**: 8+ cores
- **Disk**: 100GB+ free space
- **SSD**: For better performance

## 🎯 **Next Steps**

### **1. Development Workflow**
```powershell
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run application locally
npm run dev

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### **2. Production Deployment**
```powershell
# Build production image
docker build -t rac-rewards:latest .

# Deploy to Kubernetes
kubectl apply -f k8s/

# Scale application
kubectl scale deployment rac-rewards-app --replicas=3 -n rac-rewards
```

### **3. Monitoring and Logs**
```powershell
# View application logs
kubectl logs -f deployment/rac-rewards-app -n rac-rewards

# Monitor resources
kubectl top pods -n rac-rewards
kubectl top nodes
```

## ✅ **Verification Checklist**

- [ ] Docker Desktop installed and running
- [ ] Docker version command works
- [ ] Kubernetes enabled in Docker Desktop
- [ ] kubectl version command works
- [ ] Docker Compose working
- [ ] RAC Rewards application starts with Docker
- [ ] All services accessible (app, database, redis)
- [ ] Kubernetes cluster responding
- [ ] Namespace created successfully

## 🎉 **Success!**

You now have:
- ✅ **Docker Desktop** for containerization
- ✅ **Kubernetes** for orchestration
- ✅ **Development environment** ready for RAC Rewards
- ✅ **Production deployment** capabilities

**Your containerized development environment is ready!** 🚀
