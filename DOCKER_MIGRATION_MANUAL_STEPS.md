# 🐳 Manual Docker Migration to D: Drive

## 📊 Current Status
- **Docker Root**: `/var/lib/docker` (WSL2 backend)
- **Images**: 3 active (5.3GB total, 4GB reclaimable)
- **Containers**: 3 active (122KB)
- **Volumes**: 3 volumes (52MB)
- **Build Cache**: 4GB reclaimable
- **Total Docker Data**: ~9GB

## 🎯 **Method 1: Docker Desktop Settings (Recommended)**

### Step 1: Open Docker Desktop Settings
1. Right-click Docker Desktop icon in system tray
2. Select **"Settings"** or **"Preferences"**

### Step 2: Navigate to Resources
1. Click **"Resources"** in the left sidebar
2. Click **"Advanced"**

### Step 3: Change Disk Image Location
1. Find **"Disk image location"** setting
2. Click **"Browse"** or **"Change"**
3. Navigate to: `D:\RAC Rewards Repo\Docker_Images`
4. Click **"Apply & Restart"**

### Step 4: Wait for Migration
- Docker Desktop will automatically move all data
- This may take several minutes (9GB of data)
- Don't interrupt the process

### Step 5: Verify Migration
```powershell
# Check Docker root directory
docker info --format "{{.DockerRootDir}}"

# Should show: D:\RAC Rewards Repo\Docker_Images
```

## 🔧 **Method 2: WSL2 Configuration (Alternative)**

If Method 1 doesn't work, try this:

### Step 1: Stop Docker Desktop
1. Right-click Docker Desktop in system tray
2. Select **"Quit Docker Desktop"**

### Step 2: Create WSL2 Configuration
Create file: `C:\Users\[YourUsername]\.wslconfig`
```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
localhostForwarding=true
```

### Step 3: Configure Docker in WSL2
1. Open WSL2 terminal (Ubuntu or your Linux distro)
2. Run these commands:
```bash
# Create directory on D: drive
sudo mkdir -p /mnt/d/RAC\ Rewards\ Repo/Docker_Images
sudo chown -R $USER:$USER /mnt/d/RAC\ Rewards\ Repo/Docker_Images

# Update Docker daemon configuration
sudo mkdir -p /etc/docker
echo '{
  "data-root": "/mnt/d/RAC Rewards Repo/Docker_Images"
}' | sudo tee /etc/docker/daemon.json

# Restart Docker service
sudo systemctl restart docker
```

### Step 4: Restart Docker Desktop
1. Start Docker Desktop
2. Wait for it to initialize

## ✅ **Verification Steps**

After migration, run these commands:

```powershell
# 1. Check Docker root directory
docker info --format "{{.DockerRootDir}}"

# 2. Verify images are accessible
docker images

# 3. Test RAC Rewards containers
docker-compose -f docker-compose.dev.yml up -d

# 4. Check container status
docker-compose -f docker-compose.dev.yml ps

# 5. Test database connection
docker exec rac-rewards-postgres-dev pg_isready -U postgres

# 6. Check Docker system usage
docker system df
```

## 🚨 **Troubleshooting**

### Issue: Docker Desktop won't start after migration
**Solution**: 
1. Check if `D:\RAC Rewards Repo\Docker_Images` exists and is accessible
2. Ensure you have full permissions on D: drive
3. Try restarting Docker Desktop as Administrator

### Issue: Containers can't access volumes
**Solution**: 
1. Verify volume paths in docker-compose files
2. Check if symbolic links are working correctly
3. Restart containers: `docker-compose down && docker-compose up -d`

### Issue: Permission denied errors
**Solution**: 
1. Run PowerShell as Administrator
2. Check D: drive permissions: `icacls "D:\RAC Rewards Repo\Docker_Images"`
3. Ensure Docker Desktop has access to the new location

## 📋 **Post-Migration Checklist**

- [ ] Docker root directory shows D: drive path
- [ ] All images are accessible (`docker images`)
- [ ] RAC Rewards containers start successfully
- [ ] Database connection works
- [ ] pgAdmin accessible at http://localhost:8080
- [ ] Redis cache working
- [ ] Update backup procedures

## 🎉 **Expected Results**

After successful migration:
- **Docker Root**: `D:\RAC Rewards Repo\Docker_Images`
- **C: Drive Space**: ~9GB freed up
- **All containers**: Working normally
- **Performance**: Potentially improved for large images

---

**Ready to migrate?** Follow Method 1 (Docker Desktop Settings) for the easiest approach!
