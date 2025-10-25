# Local Database Connection Setup Guide

## 🎯 **Overview**

This guide will help you configure your RAC Rewards application to connect **ONLY** to your local PostgreSQL database, completely bypassing Supabase.

## 🚀 **Quick Setup (Automated)**

### **Option 1: Run the Setup Script (Recommended)**

**Windows Batch:**
```cmd
setup_local_database_connection.bat
```

**PowerShell:**
```powershell
.\setup_local_database_connection.ps1
```

### **Option 2: Manual Setup**

1. **Copy the environment file:**
   ```cmd
   copy env.local.database .env.local
   ```

2. **Verify your PostgreSQL connection:**
   ```cmd
   psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT 1;"
   ```

## 📋 **What Gets Changed**

### **Environment Configuration:**
- ✅ **Forces local development mode** (`isDevelopment: true`)
- ✅ **Disables Supabase** (`isUAT: false`)
- ✅ **Uses local PostgreSQL** connection
- ✅ **Enables debug features** for development

### **Database Connection:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `ignite_rewards`
- **User**: `postgres`
- **Password**: `Maegan@200328`

### **Supabase Connection:**
- ❌ **Completely disabled**
- ❌ **No cloud database calls**
- ❌ **No Supabase authentication**

## 🔧 **Manual Configuration Steps**

### **Step 1: Create .env.local File**

Copy the contents of `env.local.database` to `.env.local`:

```bash
# Copy the file
cp env.local.database .env.local
```

### **Step 2: Verify Environment Configuration**

The `src/config/environment.ts` file has been updated to:
- Force local development mode
- Disable Supabase connection
- Validate local database credentials
- Enable debug logging

### **Step 3: Test Database Connection**

```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT 1;"

# Check if database exists
psql -h localhost -p 5432 -U postgres -l | grep ignite_rewards

# Check tables (if they exist)
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "\dt"
```

## 🗄️ **Database Setup**

### **If Database Doesn't Exist:**

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE ignite_rewards;

-- Create user (if needed)
CREATE USER postgres WITH PASSWORD 'Maegan@200328';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ignite_rewards TO postgres;
```

### **If Tables Don't Exist:**

Run the database restoration scripts:

```sql
-- Run in Supabase SQL Editor or psql
\i restore_complete_database.sql
\i restore_complete_system.sql
```

## 🎯 **Environment Variables Explained**

### **Database Configuration:**
```env
VITE_DATABASE_URL=postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=ignite_rewards
VITE_DB_USER=postgres
VITE_DB_PASSWORD=Maegan@200328
```

### **Supabase Disabled:**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### **Development Features:**
```env
VITE_APP_ENV=development
VITE_APP_DEBUG=true
VITE_USE_LOCAL_DATABASE=true
VITE_DISABLE_SUPABASE=true
```

## 🔍 **Verification Steps**

### **1. Check Environment Loading:**
Start your application and check the browser console for:
```
🌍 Environment Configuration: {
  mode: "Local Development",
  database: "Local PostgreSQL",
  localDb: {
    host: "localhost",
    port: 5432,
    database: "ignite_rewards",
    user: "postgres"
  }
}
```

### **2. Test Database Connection:**
- Application should start without Supabase errors
- Database queries should work locally
- No network calls to Supabase

### **3. Verify Features:**
- User authentication (if using local auth)
- Database queries and operations
- All application features working locally

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. PostgreSQL Not Running:**
```bash
# Start PostgreSQL service
net start postgresql-x64-13
# or
brew services start postgresql
```

#### **2. Database Doesn't Exist:**
```sql
CREATE DATABASE ignite_rewards;
```

#### **3. Permission Denied:**
```sql
GRANT ALL PRIVILEGES ON DATABASE ignite_rewards TO postgres;
```

#### **4. Connection Refused:**
- Check if PostgreSQL is running on port 5432
- Verify firewall settings
- Check PostgreSQL configuration

#### **5. Environment Variables Not Loading:**
- Ensure `.env.local` file exists in project root
- Restart the development server
- Check for typos in variable names

### **Debug Commands:**

```bash
# Check PostgreSQL status
pg_ctl status

# Check listening ports
netstat -an | grep 5432

# Test connection with different user
psql -h localhost -p 5432 -U postgres -d postgres

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-13-main.log
```

## 🔄 **Switching Back to Supabase**

If you need to switch back to Supabase:

1. **Update environment.ts:**
   ```typescript
   isDevelopment: false,
   isUAT: true,
   ```

2. **Restore Supabase environment variables:**
   ```env
   VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Restart the application**

## 📊 **Performance Benefits**

### **Local Database Advantages:**
- ✅ **Faster queries** (no network latency)
- ✅ **No rate limits** (unlimited requests)
- ✅ **Full control** over database
- ✅ **Offline development** possible
- ✅ **No internet dependency**

### **Development Benefits:**
- ✅ **Instant feedback** on database changes
- ✅ **Easy debugging** with direct database access
- ✅ **Custom configurations** possible
- ✅ **No cloud costs** during development

## 🎉 **Success Indicators**

You'll know the setup is working when:

1. **Application starts** without Supabase connection errors
2. **Console shows** "Local Development" mode
3. **Database queries** work locally
4. **No network calls** to Supabase domains
5. **All features** function normally

## 📞 **Need Help?**

If you encounter issues:

1. **Check PostgreSQL** is running and accessible
2. **Verify database** exists and has proper permissions
3. **Review environment** variables are loaded correctly
4. **Check application logs** for specific error messages
5. **Test database connection** manually with psql

Your application is now configured to use **ONLY** your local PostgreSQL database! 🚀
