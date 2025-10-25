# Docker PostgreSQL Setup Guide for RAC Rewards

## 🎯 **Overview**

This guide provides a comprehensive Docker setup for PostgreSQL database with all tables, indexes, RLS policies, and environment-specific configurations for the RAC Rewards application.

## 📁 **File Structure**

```
docker/
├── postgres/
│   ├── config/
│   │   └── postgresql.conf          # PostgreSQL configuration
│   └── init/
│       ├── 01-init-database.sql     # Database schema and tables
│       ├── 02-seed-data.sql         # Sample data
│       └── 03-environment-config.sql # Environment-specific settings
├── redis/
│   └── redis.conf                   # Redis configuration
├── docker-compose.yml               # Full environment setup
├── docker-compose.dev.yml           # Development only
├── Dockerfile.dev                   # Development container
├── Dockerfile.uat                   # UAT container
├── Dockerfile.prod                  # Production container
└── docker-manage.ps1               # Management script
```

## 🚀 **Quick Start**

### **1. Development Environment**
```powershell
# Start development environment
.\docker-manage.ps1 -Environment dev -Action start

# Check status
.\docker-manage.ps1 -Environment dev -Action status

# View logs
.\docker-manage.ps1 -Environment dev -Action logs
```

### **2. All Environments**
```powershell
# Start all environments
.\docker-manage.ps1 -Environment all -Action start

# Check all statuses
.\docker-manage.ps1 -Environment all -Action status
```

## 🗄️ **Database Schema**

### **Core Tables**
- **profiles** - User profiles and roles
- **nft_collections** - NFT collection definitions
- **nft_types** - Individual NFT types with properties
- **user_loyalty_cards** - User loyalty card data
- **merchant_subscription_plans** - Subscription plans for merchants
- **merchants** - Merchant business information
- **cities_lookup** - City and country data
- **loyalty_networks** - Third-party loyalty networks

### **Custom Types**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'user', 'merchant', 'moderator');
CREATE TYPE merchant_status AS ENUM ('active', 'pending', 'suspended', 'inactive');
CREATE TYPE nft_rarity AS ENUM ('Common', 'Less Common', 'Rare', 'Very Rare', 'Legendary');
CREATE TYPE tier_level AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
```

### **Indexes**
- **Primary indexes** on all primary keys
- **Foreign key indexes** for relationships
- **Search indexes** for city lookup and merchant search
- **Performance indexes** for common queries
- **Composite indexes** for multi-column queries
- **Partial indexes** for active records

### **Row Level Security (RLS)**
- **Public read access** for reference data
- **User-specific access** for personal data
- **Admin-only access** for management functions
- **Environment-specific policies**

## 🔧 **Environment Configuration**

### **Development Environment**
- **Database**: `ignite_rewards_dev` (Port 5432)
- **Debug Mode**: Enabled
- **Log Level**: Debug
- **Cache TTL**: 300 seconds
- **Rate Limit**: 1000/minute
- **Session Timeout**: 3600 seconds

### **UAT Environment**
- **Database**: `ignite_rewards_uat` (Port 5433)
- **Debug Mode**: Disabled
- **Log Level**: Info
- **Cache TTL**: 600 seconds
- **Rate Limit**: 500/minute
- **Session Timeout**: 1800 seconds

### **Production Environment**
- **Database**: `ignite_rewards_prod` (Port 5434)
- **Debug Mode**: Disabled
- **Log Level**: Warn
- **Cache TTL**: 1800 seconds
- **Rate Limit**: 100/minute
- **Session Timeout**: 900 seconds

## 🛠️ **Database Functions**

### **Authentication Functions**
```sql
is_admin()                    -- Check if user is admin
check_admin_access()          -- Verify admin access
can_use_mfa()                -- Check MFA capability
get_current_user_profile()    -- Get current user profile
```

### **Utility Functions**
```sql
generate_loyalty_number()     -- Generate unique loyalty number
generate_referral_code()      -- Generate referral code
get_valid_subscription_plans() -- Get active subscription plans
search_cities(search_term)    -- Search cities by name/country
get_user_loyalty_card(user_id) -- Get user's loyalty card
```

### **Environment Functions**
```sql
get_environment()             -- Get current environment
get_config(key)               -- Get environment configuration
set_config(key, value)        -- Set environment configuration
get_database_stats()          -- Get database statistics
get_performance_metrics()     -- Get performance metrics
```

## 📊 **Sample Data**

### **NFT Collections**
- Classic Collection (6 NFT types)
- Premium Collection (placeholder)
- Elite Collection (placeholder)

### **NFT Types**
- **Pearl White** (Common, Free)
- **Lava Orange** (Less Common, 100 USDT)
- **Pink** (Less Common, 100 USDT)
- **Silver** (Rare, 200 USDT)
- **Gold** (Rare, 300 USDT)
- **Black** (Very Rare, 500 USDT)

### **Subscription Plans**
- **StartUp** ($20/month, $150/year)
- **Momentum Plan** ($50/month, $500/year) - Popular
- **Energizer Plan** ($100/month, $1000/year)
- **Cloud Plan** ($250/month, $2500/year)
- **Super Plan** ($500/month, $5000/year)

### **Cities Data**
- 20+ major cities from US, UK, France, Japan, Australia, Canada
- Population data and coordinates
- Searchable by city name, country, or state

### **Loyalty Networks**
- Starbucks
- Airlines
- Hotels
- Retail
- Restaurants

## 🔐 **Security Features**

### **Row Level Security (RLS)**
- **Public Access**: Cities lookup, subscription plans, NFT types
- **User Access**: Own profile, own loyalty cards
- **Admin Access**: All management functions
- **Merchant Access**: Own merchant data

### **Authentication**
- **Supabase Integration**: For user authentication
- **Role-based Access**: Admin, user, merchant, moderator
- **Session Management**: Environment-specific timeouts

### **Data Protection**
- **Encrypted Connections**: SSL/TLS enabled
- **Secure Passwords**: SCRAM-SHA-256 encryption
- **Access Logging**: All database access logged
- **Backup Encryption**: Automated encrypted backups

## 🚀 **Docker Commands**

### **Basic Operations**
```powershell
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Start all environments
docker-compose up -d

# Stop all environments
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose build --no-cache
```

### **Database Operations**
```powershell
# Connect to development database
docker exec -it rac-rewards-postgres-dev psql -U postgres -d ignite_rewards

# Connect to UAT database
docker exec -it rac-rewards-postgres-uat psql -U postgres -d ignite_rewards_uat

# Connect to production database
docker exec -it rac-rewards-postgres-prod psql -U postgres -d ignite_rewards_prod

# Backup database
docker exec rac-rewards-postgres-dev pg_dump -U postgres -d ignite_rewards > backup.sql

# Restore database
docker exec -i rac-rewards-postgres-dev psql -U postgres -d ignite_rewards < backup.sql
```

### **Management Script**
```powershell
# Start development environment
.\docker-manage.ps1 -Environment dev -Action start

# Stop all environments
.\docker-manage.ps1 -Environment all -Action stop

# Check status
.\docker-manage.ps1 -Environment dev -Action status

# View logs for specific service
.\docker-manage.ps1 -Environment dev -Action logs -Service postgres

# Build containers
.\docker-manage.ps1 -Environment dev -Action build

# Clean up everything
.\docker-manage.ps1 -Environment dev -Action clean -Force

# Backup database
.\docker-manage.ps1 -Environment dev -Action backup

# Restore database
.\docker-manage.ps1 -Environment dev -Action restore
```

## 📈 **Performance Optimization**

### **PostgreSQL Configuration**
- **Shared Buffers**: 256MB
- **Work Memory**: 4MB
- **Maintenance Work Memory**: 64MB
- **Checkpoint Completion**: 90%
- **WAL Buffers**: 16MB
- **Effective Cache Size**: 1GB

### **Indexing Strategy**
- **Primary Keys**: UUID with B-tree indexes
- **Foreign Keys**: B-tree indexes for joins
- **Search Fields**: GIN indexes for full-text search
- **Composite Indexes**: Multi-column queries
- **Partial Indexes**: Active records only

### **Query Optimization**
- **Materialized Views**: For complex aggregations
- **Function-based Indexes**: For computed columns
- **Statistics**: Auto-updated for query planning
- **Connection Pooling**: Configured for each environment

## 🔍 **Monitoring and Logging**

### **Database Monitoring**
```sql
-- Get database statistics
SELECT * FROM get_database_stats();

-- Get performance metrics
SELECT * FROM get_performance_metrics();

-- Get environment information
SELECT * FROM environment_info;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### **Logging Configuration**
- **Development**: Debug level, detailed query logs
- **UAT**: Info level, performance monitoring
- **Production**: Warn level, security events only

### **Health Checks**
- **Container Health**: Built-in Docker health checks
- **Database Health**: Connection and query tests
- **Application Health**: API endpoint monitoring

## 🛡️ **Backup and Recovery**

### **Automated Backups**
```powershell
# Schedule daily backups
.\docker-manage.ps1 -Environment all -Action backup
```

### **Backup Strategy**
- **Development**: Daily backups, 7-day retention
- **UAT**: Daily backups, 30-day retention
- **Production**: Hourly backups, 90-day retention

### **Recovery Procedures**
```powershell
# Restore from backup
.\docker-manage.ps1 -Environment dev -Action restore
# Enter backup file path when prompted
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Container Won't Start**
```powershell
# Check Docker status
docker version

# Check container logs
.\docker-manage.ps1 -Environment dev -Action logs

# Restart Docker Desktop
```

#### **2. Database Connection Issues**
```powershell
# Check if PostgreSQL is running
docker exec rac-rewards-postgres-dev pg_isready -U postgres

# Check database logs
docker logs rac-rewards-postgres-dev

# Verify environment variables
docker exec rac-rewards-postgres-dev env | grep POSTGRES
```

#### **3. Permission Issues**
```powershell
# Check RLS policies
docker exec -it rac-rewards-postgres-dev psql -U postgres -d ignite_rewards -c "\dp"

# Verify user roles
docker exec -it rac-rewards-postgres-dev psql -U postgres -d ignite_rewards -c "\du"
```

#### **4. Performance Issues**
```powershell
# Check slow queries
docker exec -it rac-rewards-postgres-dev psql -U postgres -d ignite_rewards -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check index usage
docker exec -it rac-rewards-postgres-dev psql -U postgres -d ignite_rewards -c "SELECT * FROM pg_stat_user_indexes;"
```

## 📚 **Additional Resources**

### **PostgreSQL Documentation**
- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [Row Level Security](https://www.postgresql.org/docs/15/ddl-rowsecurity.html)
- [Performance Tuning](https://www.postgresql.org/docs/15/performance-tips.html)

### **Docker Documentation**
- [Docker Compose](https://docs.docker.com/compose/)
- [Docker Networking](https://docs.docker.com/network/)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)

### **RAC Rewards Application**
- [Application Stack Guide](APPLICATION_STACK.md)
- [Product Features](PRODUCT_FEATURES.md)
- [Web3 Investment Flow](WEB3_INVESTMENT_FLOW_IMPLEMENTATION.md)

## ✅ **Verification Checklist**

- [ ] Docker Desktop installed and running
- [ ] All containers start successfully
- [ ] Database connections work
- [ ] All tables created with proper indexes
- [ ] RLS policies active and working
- [ ] Sample data loaded correctly
- [ ] Environment configurations applied
- [ ] Functions and triggers working
- [ ] Backup and restore procedures tested
- [ ] Performance monitoring active
- [ ] Security policies enforced
- [ ] Health checks passing

## 🎉 **Success!**

Your Docker PostgreSQL setup is now complete with:
- ✅ **Multi-environment support** (Dev, UAT, Production)
- ✅ **Complete database schema** with all tables and relationships
- ✅ **Comprehensive indexing** for optimal performance
- ✅ **Row Level Security** for data protection
- ✅ **Environment-specific configurations**
- ✅ **Sample data** for development and testing
- ✅ **Management tools** for easy operation
- ✅ **Backup and recovery** procedures
- ✅ **Monitoring and logging** capabilities

**Your containerized PostgreSQL database is ready for the RAC Rewards application!** 🚀
