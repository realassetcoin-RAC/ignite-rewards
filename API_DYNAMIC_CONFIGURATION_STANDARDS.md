# API Dynamic Configuration Standards

## 🎯 **Overview**

All APIs in the RAC Rewards ecosystem must be built with dynamic configuration to avoid code changes when environments change. This document establishes the standards for implementing environment-aware APIs.

## ✅ **Current Status**

### **Fully Dynamic APIs:**
- ✅ **`api/cities.js`** - City Search API
- ✅ **`api/dao.js`** - DAO Operations API  
- ✅ **`google-oauth-express/index.ts`** - Google OAuth API

### **Frontend Services:**
- ✅ **`src/api/citySearch.ts`** - City Search Frontend Service
- ✅ **`src/services/daoService.ts`** - DAO Frontend Service

## 🏗️ **Architecture Standards**

### **1. Configuration Hierarchy**
```
Environment Variables (Highest Priority)
    ↓
Config File (Medium Priority)
    ↓
Default Values (Fallback)
```

### **2. Required Configuration Files**
Each API must have environment-specific config files:
- `config.env` - Development
- `config.staging.env` - Staging
- `config.production.env` - Production

### **3. Standard Configuration Variables**

#### **Database Configuration:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ignite_rewards
DB_USER=postgres
DB_PASSWORD=your-password
```

#### **API Server Configuration:**
```bash
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=*
LOG_LEVEL=info
```

#### **Service-Specific Configuration:**
```bash
# DAO API
DAO_API_PORT=3002
DAO_API_HOST=localhost
DAO_CORS_ORIGIN=*
DAO_LOG_LEVEL=info

# OAuth API
OAUTH_API_PORT=3000
OAUTH_API_HOST=localhost
OAUTH_CORS_ORIGIN=*
OAUTH_LOG_LEVEL=info
```

## 🔧 **Implementation Standards**

### **1. Server Configuration Pattern**
```javascript
// Load environment configuration
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.env');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const config = {};
    configContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    });
    
    return config;
  } catch (error) {
    console.warn('⚠️  Could not load config.env, using environment variables and defaults');
    return {};
  }
}

const config = loadConfig();

// Dynamic configuration with fallbacks
const serverConfig = {
  port: parseInt(process.env.API_PORT || config.API_PORT || '3001'),
  host: process.env.API_HOST || config.API_HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || config.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || config.LOG_LEVEL || 'info'
};
```

### **2. Frontend Service Pattern**
```typescript
private getApiBaseUrl(): string {
  // Check for environment variable first (for production)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check for local development API server
  if (import.meta.env.VITE_API_PORT) {
    return `http://localhost:${import.meta.env.VITE_API_PORT}`;
  }
  
  // Default fallback
  return 'http://localhost:3001';
}
```

### **3. Logging Pattern**
```javascript
function log(level, message, data = null) {
  if (serverConfig.logLevel === 'debug' || 
      (serverConfig.logLevel === 'info' && level === 'info') ||
      (serverConfig.logLevel === 'error' && level === 'error')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
```

### **4. CORS Configuration**
```javascript
app.use(cors({
  origin: serverConfig.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 🚀 **Deployment Standards**

### **1. Environment-Specific Scripts**
```json
{
  "scripts": {
    "api:dev": "bun run api/start.js development",
    "api:staging": "bun run api/start.js staging", 
    "api:prod": "bun run api/start.js production",
    "dao:start": "bun run api/dao.js",
    "oauth:start": "bun run google-oauth-express/index.ts",
    "apis:start": "concurrently \"bun run api:start\" \"bun run dao:start\" \"bun run oauth:start\""
  }
}
```

### **2. Port Allocation**
- **Cities API**: 3001
- **DAO API**: 3002  
- **OAuth API**: 3000
- **Frontend**: 8084

### **3. Environment Variables**
```bash
# Frontend Environment
VITE_API_BASE_URL=http://localhost:3001
VITE_API_PORT=3001
VITE_DAO_API_BASE_URL=http://localhost:3002/api
VITE_DAO_API_PORT=3002
VITE_OAUTH_API_BASE_URL=http://localhost:3000
VITE_OAUTH_API_PORT=3000
```

## 🔒 **Security Standards**

### **1. Environment Separation**
- **Development**: Localhost, debug logging
- **Staging**: Staging domain, info logging
- **Production**: Production domain, error logging only

### **2. Credential Management**
- Never hardcode credentials in code
- Use environment variables for all sensitive data
- Different credentials per environment

### **3. CORS Configuration**
- Development: `*` (permissive)
- Staging: `https://staging.your-domain.com`
- Production: `https://your-domain.com`

## 📊 **Monitoring Standards**

### **1. Health Check Endpoints**
All APIs must implement:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
```

### **2. Startup Information**
All APIs must display:
```javascript
console.log('🚀 API Server');
console.log('═══════════════════════════════════════');
console.log(`🚀 Server: http://${serverConfig.host}:${serverConfig.port}`);
console.log(`🗄️  Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`🌐 CORS Origin: ${serverConfig.corsOrigin}`);
console.log(`📝 Log Level: ${serverConfig.logLevel}`);
console.log('═══════════════════════════════════════');
```

## 🧪 **Testing Standards**

### **1. Environment Testing**
Test each API in all environments:
```bash
# Development
bun run api:dev

# Staging  
bun run api:staging

# Production
bun run api:prod
```

### **2. Configuration Validation**
Verify configuration loading:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3000/health
```

## 📝 **Documentation Standards**

### **1. API Documentation**
Each API must include:
- Available endpoints
- Configuration options
- Environment setup instructions
- Example requests

### **2. Configuration Documentation**
Document all configuration variables:
- Purpose
- Default values
- Environment-specific values
- Security considerations

## 🔄 **Migration Checklist**

When creating new APIs or updating existing ones:

- [ ] Create environment-specific config files
- [ ] Implement dynamic configuration loading
- [ ] Add environment variable support
- [ ] Implement proper CORS configuration
- [ ] Add logging with configurable levels
- [ ] Create health check endpoint
- [ ] Add startup information display
- [ ] Update package.json scripts
- [ ] Update frontend environment variables
- [ ] Test in all environments
- [ ] Document configuration options

## 🎯 **Benefits**

### **Zero Code Changes**
- Switch environments by changing config files
- Deploy to different environments without code modifications
- Easy environment-specific customizations

### **Security**
- No hardcoded credentials
- Environment-specific security settings
- Proper CORS configuration per environment

### **Maintainability**
- Consistent configuration patterns
- Easy to add new environments
- Centralized configuration management

### **Scalability**
- Easy to add new APIs following the same pattern
- Consistent deployment process
- Environment-specific optimizations

## 🚨 **Compliance**

All APIs in the RAC Rewards ecosystem must comply with these standards. Non-compliant APIs will be updated to follow these patterns for consistency and maintainability.
