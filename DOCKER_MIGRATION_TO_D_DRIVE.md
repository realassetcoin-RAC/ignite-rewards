# 🐳 Docker Migration to D: Drive

This guide will help you move your Docker data directory from the default C: drive location to `D:\RAC Rewards Repo\Docker_Images` to save space on your system drive.

## 📊 Current Docker Usage

Based on your current setup:
- **Images**: 3 active images (5.3GB total, 4GB reclaimable)
- **Containers**: 3 active containers (122KB)
- **Volumes**: 3 volumes (52MB)
- **Build Cache**: 4GB reclaimable

## 🎯 Migration Options

### Option 1: Docker Desktop Settings (Recommended)
The easiest way to change Docker's data directory on Windows.

### Option 2: Symbolic Link (Alternative)
Create a symbolic link to redirect Docker data to D: drive.

### Option 3: WSL2 Backend Configuration
Configure WSL2 to use D: drive for Docker data.

## 🚀 Quick Migration (Option 1 - Recommended)

### Step 1: Stop Docker Desktop
1. Right-click Docker Desktop in system tray
2. Select "Quit Docker Desktop"
3. Wait for complete shutdown

### Step 2: Backup Current Data (Optional but Recommended)
```powershell
# Create backup directory
New-Item -ItemType Directory -Path "D:\RAC Rewards Repo\Docker_Images\backup" -Force

# Copy current Docker data (if you want to preserve existing images)
# Note: This will be done automatically by Docker Desktop
```

### Step 3: Configure Docker Desktop
1. Open Docker Desktop
2. Go to **Settings** (gear icon)
3. Navigate to **Resources** → **Advanced**
4. Change **Disk image location** to: `D:\RAC Rewards Repo\Docker_Images`
5. Click **Apply & Restart**

### Step 4: Verify Migration
```powershell
# Check new Docker root directory
docker info --format "{{.DockerRootDir}}"

# Verify images are accessible
docker images

# Test your RAC Rewards containers
docker-compose -f docker-compose.dev.yml ps
```

## 🔧 Alternative Method: Symbolic Link (Option 2)

If Docker Desktop settings don't work, use this method:

### Step 1: Stop Docker Desktop
```powershell
# Stop Docker Desktop service
Stop-Service -Name "com.docker.service" -Force
```

### Step 2: Move Docker Data
```powershell
# Create target directory
New-Item -ItemType Directory -Path "D:\RAC Rewards Repo\Docker_Images" -Force

# Move Docker data (this may take time for large datasets)
Move-Item -Path "$env:USERPROFILE\AppData\Local\Docker" -Destination "D:\RAC Rewards Repo\Docker_Images\Docker" -Force
```

### Step 3: Create Symbolic Link
```powershell
# Create symbolic link
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\AppData\Local\Docker" -Target "D:\RAC Rewards Repo\Docker_Images\Docker"
```

### Step 4: Restart Docker Desktop
```powershell
# Start Docker Desktop service
Start-Service -Name "com.docker.service"
```

## 🐧 WSL2 Backend Configuration (Option 3)

If using WSL2 backend:

### Step 1: Create WSL2 Configuration
```powershell
# Create .wslconfig file in user profile
$wslConfig = @"
[wsl2]
memory=4GB
processors=2
swap=2GB
localhostForwarding=true
"@

$wslConfig | Out-File -FilePath "$env:USERPROFILE\.wslconfig" -Encoding UTF8
```

### Step 2: Configure Docker in WSL2
```bash
# In WSL2 terminal
sudo mkdir -p /mnt/d/RAC\ Rewards\ Repo/Docker_Images
sudo chown -R $USER:$USER /mnt/d/RAC\ Rewards\ Repo/Docker_Images

# Update Docker daemon configuration
sudo mkdir -p /etc/docker
echo '{
  "data-root": "/mnt/d/RAC Rewards Repo/Docker_Images"
}' | sudo tee /etc/docker/daemon.json
```

## 📋 Post-Migration Verification

### 1. Check Docker Root Directory
```powershell
docker info --format "{{.DockerRootDir}}"
# Should show: D:\RAC Rewards Repo\Docker_Images
```

### 2. Verify Images
```powershell
docker images
# Should show your existing images
```

### 3. Test RAC Rewards Containers
```powershell
# Test development environment
docker-compose -f docker-compose.dev.yml up -d

# Check container status
docker-compose -f docker-compose.dev.yml ps

# Test database connection
docker exec rac-rewards-postgres-dev pg_isready -U postgres
```

### 4. Check Disk Usage
```powershell
# Check D: drive usage
Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "D:"} | Select-Object Size,FreeSpace

# Check Docker system usage
docker system df
```

## 🔄 Rollback Procedure

If you need to rollback to C: drive:

### Step 1: Stop Docker Desktop
```powershell
Stop-Service -Name "com.docker.service" -Force
```

### Step 2: Remove Symbolic Link (if used)
```powershell
Remove-Item -Path "$env:USERPROFILE\AppData\Local\Docker" -Force
```

### Step 3: Restore Original Location
```powershell
# Move data back to original location
Move-Item -Path "D:\RAC Rewards Repo\Docker_Images\Docker" -Destination "$env:USERPROFILE\AppData\Local\Docker" -Force
```

### Step 4: Restart Docker Desktop
```powershell
Start-Service -Name "com.docker.service"
```

## 🎯 Benefits of Migration

1. **Space Savings**: Free up C: drive space (currently ~9GB Docker data)
2. **Performance**: D: drive may have better performance for large files
3. **Organization**: Keep all RAC Rewards related data in one location
4. **Backup**: Easier to backup Docker data with project files

## ⚠️ Important Notes

1. **Backup First**: Always backup important data before migration
2. **Stop Services**: Ensure all Docker containers are stopped before migration
3. **Permissions**: Ensure you have full permissions on D: drive
4. **Path Length**: Windows has path length limits, keep paths reasonable
5. **Antivirus**: Some antivirus software may interfere with Docker operations

## 🚨 Troubleshooting

### Issue: Docker Desktop won't start after migration
**Solution**: Check Docker Desktop settings and ensure the new path is accessible.

### Issue: Containers can't access volumes
**Solution**: Verify volume paths in docker-compose files are still valid.

### Issue: Permission denied errors
**Solution**: Run PowerShell as Administrator and ensure proper permissions on D: drive.

### Issue: WSL2 integration problems
**Solution**: Restart WSL2 and Docker Desktop, check .wslconfig file.

## 📞 Support

If you encounter issues:
1. Check Docker Desktop logs
2. Verify file permissions on D: drive
3. Ensure sufficient disk space on D: drive
4. Restart Docker Desktop and WSL2 if using WSL2 backend

---

**Next Steps**: After successful migration, update your project documentation and consider updating your backup procedures to include the new Docker data location.
