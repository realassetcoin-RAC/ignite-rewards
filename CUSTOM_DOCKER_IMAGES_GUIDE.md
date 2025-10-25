# Custom Docker Images Guide for RAC Rewards

## 🎯 **Overview**

This guide explains how to create, build, and use custom Docker images for the RAC Rewards application, including both PostgreSQL and Application images.

## 🏗️ **What's Required for Custom Images**

### **1. Custom PostgreSQL Image**
- **Pre-configured database schema** with all tables, indexes, and RLS policies
- **Environment-specific configurations** (Dev, UAT, Production)
- **Initialization scripts** that run automatically on container start
- **Health checks** to ensure database is ready
- **Custom entrypoint** for advanced startup logic

### **2. Custom Application Image**
- **Multi-stage build** for optimized production images
- **Environment-specific builds** with different configurations
- **Health checks** for application monitoring
- **Security hardening** with non-root users
- **Optimized for different deployment targets**

## 📁 **File Structure**

```
docker/
├── postgres/
│   ├── Dockerfile                    # Custom PostgreSQL image
│   ├── docker-entrypoint-custom.sh  # Custom startup script
│   ├── health-check.sh              # Database health checks
│   ├── config/
│   │   └── postgresql.conf          # PostgreSQL configuration
│   └── init/
│       ├── 01-init-database.sql     # Database schema
│       ├── 02-seed-data.sql         # Sample data
│       └── 03-environment-config.sql # Environment configs
├── health-check.sh                  # Application health checks
├── Dockerfile.app                   # Custom application image
├── build-images.ps1                 # Build script
└── docker-compose.yml               # Updated to use custom images
```

## 🚀 **Building Custom Images**

### **Quick Build (All Images)**
```powershell
# Build all images for development
.\build-images.ps1 -Image all -Environment dev

# Build all images for production
.\build-images.ps1 -Image all -Environment prod -NoCache
```

### **Individual Image Builds**
```powershell
# Build only PostgreSQL image
.\build-images.ps1 -Image postgres -Environment dev

# Build only Application image
.\build-images.ps1 -Image app -Environment prod

# Build with verbose output
.\build-images.ps1 -Image all -Environment uat -Verbose
```

### **Build and Push to Registry**
```powershell
# Build and push to registry
.\build-images.ps1 -Image all -Environment prod -Push
```

## 🐘 **PostgreSQL Custom Image**

### **Features**
- **Pre-configured Schema**: All tables, indexes, RLS policies included
- **Environment Detection**: Automatically configures based on environment
- **Health Checks**: Comprehensive database health monitoring
- **Custom Entrypoint**: Advanced startup and initialization logic
- **User Management**: Automatic user creation and permission setup

### **Image Tags**
- `rac-rewards/postgres:dev` - Development environment
- `rac-rewards/postgres:uat` - UAT environment  
- `rac-rewards/postgres:prod` - Production environment
- `rac-rewards/postgres:dev-latest` - Latest development build
- `rac-rewards/postgres:uat-latest` - Latest UAT build
- `rac-rewards/postgres:prod-latest` - Latest production build

### **Environment Variables**
```yaml
POSTGRES_DB: ignite_rewards_dev/uat/prod
POSTGRES_USER: dwarfintel (prod) / postgres (dev/uat)
POSTGRES_PASSWORD: Maegan@200328
ENVIRONMENT: dev/uat/prod
```

### **Health Check**
The PostgreSQL image includes comprehensive health checks:
- ✅ Connection availability
- ✅ Database accessibility
- ✅ Required tables existence
- ✅ Required functions existence
- ✅ Performance metrics
- ✅ Memory and disk usage

## 🚀 **Application Custom Image**

### **Features**
- **Multi-stage Build**: Optimized for production
- **Environment-specific**: Different builds for dev/uat/prod
- **Health Checks**: Application monitoring and readiness
- **Security**: Non-root user execution
- **Optimization**: Minimal image size with all dependencies

### **Image Tags**
- `rac-rewards/app:dev` - Development environment
- `rac-rewards/app:uat` - UAT environment
- `rac-rewards/app:prod` - Production environment
- `rac-rewards/app:dev-latest` - Latest development build
- `rac-rewards/app:uat-latest` - Latest UAT build
- `rac-rewards/app:prod-latest` - Latest production build

### **Build Arguments**
```dockerfile
NODE_ENV: development/uat/production
```

### **Health Check**
The application image includes health checks for:
- ✅ HTTP response (200 OK)
- ✅ Port listening
- ✅ Process running
- ✅ Memory usage
- ✅ Disk space
- ✅ Environment variables

## 🔧 **Using Custom Images**

### **Docker Compose**
The docker-compose files have been updated to use custom images:

```yaml
# PostgreSQL service
postgres-dev:
  image: rac-rewards/postgres:dev
  container_name: rac-rewards-postgres-dev
  environment:
    POSTGRES_DB: ignite_rewards_dev
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: Maegan@200328

# Application service  
app-dev:
  image: rac-rewards/app:dev
  container_name: rac-rewards-app-dev
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://postgres:Maegan@200328@postgres-dev:5432/ignite_rewards_dev
```

### **Manual Docker Commands**
```powershell
# Run PostgreSQL container
docker run -d \
  --name rac-rewards-postgres \
  -e POSTGRES_DB=ignite_rewards \
  -e POSTGRES_USER=dwarfintel \
  -e POSTGRES_PASSWORD=Maegan@200328 \
  -e ENVIRONMENT=dev \
  -p 5432:5432 \
  rac-rewards/postgres:dev

# Run Application container
docker run -d \
  --name rac-rewards-app \
  -e NODE_ENV=development \
  -e DATABASE_URL=postgresql://dwarfintel:Maegan@200328@host.docker.internal:5432/ignite_rewards \
  -p 3000:3000 \
  rac-rewards/app:dev
```

## 📊 **Image Management**

### **List Built Images**
```powershell
# List all RAC Rewards images
docker images rac-rewards/*

# List specific image versions
docker images rac-rewards/postgres
docker images rac-rewards/app
```

### **Remove Old Images**
```powershell
# Remove specific image
docker rmi rac-rewards/postgres:dev

# Remove all RAC Rewards images
docker rmi $(docker images rac-rewards/* -q)

# Clean up dangling images
docker image prune -f
```

### **Image Information**
```powershell
# Inspect image details
docker inspect rac-rewards/postgres:dev

# Check image size
docker images rac-rewards/* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# View image history
docker history rac-rewards/app:prod
```

## 🔍 **Troubleshooting**

### **Build Issues**

#### **1. Build Context Too Large**
```powershell
# Add .dockerignore file
echo "node_modules" > .dockerignore
echo ".git" >> .dockerignore
echo "*.log" >> .dockerignore
```

#### **2. Permission Issues**
```powershell
# Fix script permissions
chmod +x docker/postgres/docker-entrypoint-custom.sh
chmod +x docker/postgres/health-check.sh
chmod +x docker/health-check.sh
```

#### **3. Build Cache Issues**
```powershell
# Build without cache
.\build-images.ps1 -Image all -Environment dev -NoCache
```

### **Runtime Issues**

#### **1. Container Won't Start**
```powershell
# Check container logs
docker logs rac-rewards-postgres-dev

# Check health status
docker inspect rac-rewards-postgres-dev | grep -A 10 Health
```

#### **2. Database Connection Issues**
```powershell
# Test database connection
docker exec rac-rewards-postgres-dev pg_isready -U postgres

# Check database initialization
docker exec rac-rewards-postgres-dev psql -U postgres -d ignite_rewards -c "\dt"
```

#### **3. Application Health Issues**
```powershell
# Check application health
docker exec rac-rewards-app-dev curl -f http://localhost:3000/api/health

# Check application logs
docker logs rac-rewards-app-dev
```

## 🚀 **Deployment Workflow**

### **Development**
```powershell
# 1. Build development images
.\build-images.ps1 -Image all -Environment dev

# 2. Start development environment
.\docker-manage.ps1 -Environment dev -Action start

# 3. Verify everything is working
.\docker-manage.ps1 -Environment dev -Action status
```

### **UAT**
```powershell
# 1. Build UAT images
.\build-images.ps1 -Image all -Environment uat

# 2. Start UAT environment
.\docker-manage.ps1 -Environment uat -Action start

# 3. Run tests
.\docker-manage.ps1 -Environment uat -Action logs
```

### **Production**
```powershell
# 1. Build production images (no cache)
.\build-images.ps1 -Image all -Environment prod -NoCache

# 2. Push to registry
.\build-images.ps1 -Image all -Environment prod -Push

# 3. Deploy to production
.\docker-manage.ps1 -Environment prod -Action start
```

## 📈 **Performance Optimization**

### **Image Size Optimization**
- **Multi-stage builds** to reduce final image size
- **Alpine Linux** base images for minimal footprint
- **Layer caching** for faster rebuilds
- **Dependency optimization** to include only necessary packages

### **Build Time Optimization**
- **Parallel builds** for multiple images
- **Build cache** utilization
- **Incremental builds** for development
- **Selective rebuilds** based on changes

### **Runtime Optimization**
- **Health checks** for faster startup detection
- **Resource limits** for optimal performance
- **Environment-specific** configurations
- **Monitoring and logging** for performance tracking

## 🔐 **Security Considerations**

### **Image Security**
- **Non-root users** in application containers
- **Minimal attack surface** with Alpine Linux
- **Regular updates** of base images
- **Vulnerability scanning** of built images

### **Runtime Security**
- **Environment variable** protection
- **Network isolation** between containers
- **Resource limits** to prevent abuse
- **Audit logging** for security monitoring

## ✅ **Verification Checklist**

- [ ] Custom PostgreSQL image builds successfully
- [ ] Custom Application image builds successfully
- [ ] Images start and run correctly
- [ ] Health checks pass
- [ ] Database schema is properly initialized
- [ ] Application connects to database
- [ ] Environment-specific configurations work
- [ ] All services are accessible
- [ ] Performance is acceptable
- [ ] Security requirements are met

## 🎉 **Benefits of Custom Images**

### **PostgreSQL Image Benefits**
- ✅ **Faster startup** - Pre-configured database
- ✅ **Consistent environment** - Same schema everywhere
- ✅ **Automated setup** - No manual database initialization
- ✅ **Health monitoring** - Built-in health checks
- ✅ **Environment awareness** - Automatic configuration

### **Application Image Benefits**
- ✅ **Optimized builds** - Multi-stage builds for efficiency
- ✅ **Security hardened** - Non-root execution
- ✅ **Environment specific** - Different configs per environment
- ✅ **Health monitoring** - Application readiness checks
- ✅ **Production ready** - Optimized for deployment

**Your custom Docker images are now ready for production use!** 🚀
