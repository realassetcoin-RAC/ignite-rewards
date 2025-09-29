# 🐳 Docker Setup for RAC Rewards

Since you're using **Supabase cloud**, this Docker setup focuses on containerizing your React application.

## 🎯 **Options**

### **Option 1: Production Deployment**
Deploy your React app in a container for production.

### **Option 2: Development Environment**
Use Docker for consistent development across team members.

### **Option 3: Skip Docker (Current Setup)**
Continue using Bun + Vite locally with Supabase cloud.

## 🚀 **Quick Start**

### **Production Build:**
```bash
# Build and run production container
docker-compose up --build

# Access your app at http://localhost:8084
```

### **Development Build:**
```bash
# Run development container with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Access your app at http://localhost:8084
```

## 🔧 **Environment Variables**

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📋 **Commands**

### **Production:**
```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs app
```

### **Development:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# Stop development services
docker-compose -f docker-compose.dev.yml down
```

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Docker        │    │   Your App      │    │    Supabase     │
│   Container     │◄──►│   (React)       │◄──►│   (Cloud DB)    │
│                 │    │                 │    │                 │
│ - Bun Runtime   │    │ - Frontend      │    │ - PostgreSQL    │
│ - Nginx         │    │ - Components    │    │ - Auth          │
│ - Static Files  │    │ - State mgmt    │    │ - API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **Benefits**

### **With Docker:**
- ✅ Consistent environment across team
- ✅ Easy deployment to any server
- ✅ Isolated dependencies
- ✅ Production-ready setup

### **Without Docker (Current):**
- ✅ Faster development (no container overhead)
- ✅ Direct file access
- ✅ Simpler debugging
- ✅ Bun's native performance

## 💡 **Recommendation**

**For Development:** Stick with your current Bun + Vite setup
**For Production:** Use Docker for deployment

Your current setup is already optimal for development! 🚀
