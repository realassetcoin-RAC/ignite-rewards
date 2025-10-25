# 🚀 Docker D: Drive Quick Start

## ⚡ **Quick Migration (Recommended Method)**

### Step 1: Run Migration Script
```powershell
# Run as Administrator
.\migrate_docker_to_d_drive.ps1
```

### Step 2: Verify Migration
```powershell
# Check Docker root directory
docker info --format "{{.DockerRootDir}}"
# Should show: D:\RAC Rewards Repo\Docker_Images

# Test your containers
docker-compose -f docker-compose.dev.yml up -d
```

## 🎯 **Alternative: Docker Desktop Settings**

1. **Open Docker Desktop**
2. **Settings** → **Resources** → **Advanced**
3. **Change Disk image location** to: `D:\RAC Rewards Repo\Docker_Images`
4. **Apply & Restart**

## 📊 **Current Usage**
- **Images**: 3 active (5.3GB total)
- **Containers**: 3 active (122KB)
- **Volumes**: 3 volumes (52MB)
- **Build Cache**: 4GB reclaimable

## ✅ **Benefits**
- **Space Savings**: ~9GB freed on C: drive
- **Organization**: All RAC Rewards data in one location
- **Performance**: Better for large Docker images
- **Backup**: Easier to backup with project files

## 🔧 **Troubleshooting**

### Docker won't start after migration
```powershell
# Check symbolic link
Get-Item "C:\Users\$env:USERNAME\AppData\Local\Docker" | Select-Object Target

# Restore from backup
.\migrate_docker_to_d_drive.ps1 -Restore
```

### Permission issues
```powershell
# Run as Administrator
# Check D: drive permissions
icacls "D:\RAC Rewards Repo\Docker_Images"
```

### Verify migration
```powershell
# Check all components
.\migrate_docker_to_d_drive.ps1 -Verify
```

## 📋 **Post-Migration Checklist**

- [ ] Docker root directory shows D: drive path
- [ ] All images are accessible (`docker images`)
- [ ] RAC Rewards containers start successfully
- [ ] Database connection works
- [ ] pgAdmin accessible at http://localhost:8080
- [ ] Redis cache working
- [ ] Update backup procedures

## 🆘 **Need Help?**

1. **Check logs**: Docker Desktop → Troubleshoot → View logs
2. **Restore backup**: `.\migrate_docker_to_d_drive.ps1 -Restore`
3. **Full documentation**: See `DOCKER_MIGRATION_TO_D_DRIVE.md`
4. **Verify setup**: `.\migrate_docker_to_d_drive.ps1 -Verify`

---

**Ready to migrate?** Run `.\migrate_docker_to_d_drive.ps1` as Administrator!
