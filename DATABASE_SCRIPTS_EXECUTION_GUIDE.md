# Database Scripts Execution Guide

## 🎯 **Overview**

This guide will help you execute all the database scripts from the past 10 days on your local PostgreSQL database. These scripts include all the fixes, updates, and new features that have been developed.

## 📊 **Scripts Identified (Past 10 Days)**

I found **85+ SQL scripts** created in the past 10 days, including:

### **Core Restoration Scripts:**
- `restore_complete_database.sql` - Complete database restoration
- `restore_complete_system.sql` - Advanced system features restoration

### **Merchant System Scripts:**
- `fix_subscription_plans_complete.sql`
- `FIX_MERCHANT_SUBSCRIPTION_PLANS_PUBLIC_SCHEMA.sql`
- `update_plan_features_correct.sql`
- `update_subscription_prices.sql`
- `FIX_POPULAR_PLAN_COLUMN.sql`
- `COMPREHENSIVE_POPULAR_PLAN_FIX.sql`

### **DAO System Scripts:**
- `FIX_DAO_TABLES_AND_DATA.sql`
- `fix_dao_tables_complete.sql`
- `fix_dao_proposal_creation.sql`
- `COMPREHENSIVE_DAO_ECOSYSTEM.sql`
- `MIGRATE_TO_5_MAIN_DAOS.sql`
- `FIX_DAO_PROPOSALS_RLS_POLICIES.sql`
- `UPDATE_DAO_TRIGGER_FOR_NEW_MAPPING.sql`

### **NFT & Loyalty System Scripts:**
- `FIX_NFT_TYPES_SCHEMA.sql`
- `LINK_NFT_TYPES_TO_COLLECTIONS.sql`
- `fix_loyalty_card_function.sql`
- `create_loyalty_cards_table.sql`
- `fix_loyalty_cards_loading.sql`
- `CREATE_LOYALTY_PROVIDERS_TABLE.sql`
- `CREATE_LOYALTY_CHANGE_REQUESTS_TABLE.sql`

### **Cities Lookup System Scripts:**
- `create_cities_lookup_table.sql`
- `apply_cities_lookup.sql`
- `apply_cities_10k_chunks.sql` (33 chunk files)
- `verify_cities_data_10k.sql`

### **Marketplace & Referral Scripts:**
- `create_marketplace_tables.sql`
- `fix_dao_marketplace_field_gaps.sql`
- `fix_referral_system.sql`

### **Rewards & Configuration Scripts:**
- `fix_rewards_config_simple.sql`
- `fix_config_proposals_issue.sql`

### **Database Cleanup Scripts:**
- `remove_duplicate_loyalty_cards.sql`
- `prevent_future_duplicates.sql`
- `fix_merchants_table.sql`
- `fix_missing_category_column.sql`

### **RLS & Security Scripts:**
- `COMPREHENSIVE_RLS_FIX.sql`
- `CHECK_AND_FIX_RLS_POLICIES.sql`
- `FIX_RLS_POLICIES_COMPREHENSIVE.sql`

## 🚀 **Execution Methods**

### **Option 1: Automated PowerShell Script (Recommended)**

```powershell
.\run_all_database_scripts.ps1
```

**Features:**
- ✅ **Progress tracking** with detailed output
- ✅ **Error handling** and reporting
- ✅ **Verification scripts** included
- ✅ **Final database verification**
- ✅ **Summary report** at the end

### **Option 2: Automated Batch Script**

```cmd
run_all_database_scripts.bat
```

**Features:**
- ✅ **Simple execution** for Windows
- ✅ **Basic progress tracking**
- ✅ **Verification included**
- ✅ **Summary report**

### **Option 3: Manual SQL Execution**

```sql
-- Run the master SQL file
\i execute_all_database_scripts.sql
```

**Features:**
- ✅ **Complete script** with all includes
- ✅ **Organized by category**
- ✅ **Verification queries** included

## 📋 **Execution Order**

The scripts are executed in this specific order to ensure dependencies are met:

1. **Core Restoration** (2 scripts)
   - Complete database restoration
   - Advanced system features

2. **Merchant System** (6 scripts)
   - Subscription plans fixes
   - Schema updates
   - Popular plan fixes

3. **DAO System** (7 scripts)
   - DAO tables and data
   - Proposal system
   - Migration to 5 main DAOs

4. **NFT & Loyalty** (7 scripts)
   - NFT types schema
   - Loyalty card functions
   - Loyalty providers

5. **Marketplace & Referral** (3 scripts)
   - Marketplace tables
   - Referral system

6. **Rewards & Configuration** (2 scripts)
   - Rewards config
   - Config proposals

7. **Cities Lookup** (3 scripts)
   - Cities table creation
   - Data population (323,573 cities)

8. **Terms & Privacy** (1 script)
   - Terms table fix

9. **Database Cleanup** (4 scripts)
   - Duplicate removal
   - Table fixes

10. **RLS & Security** (3 scripts)
    - Row Level Security policies
    - Security fixes

## 🔍 **Verification Scripts**

After execution, these verification scripts run:

- `verify_cities_data_10k.sql` - Verify cities data
- `VERIFY_LOYALTY_PROVIDERS_DATA.sql` - Verify loyalty providers
- `check_database_schema.sql` - Check database schema
- `check_dao_tables.sql` - Check DAO tables

## 📊 **Expected Results**

After successful execution, you should have:

### **Database Tables:**
- ✅ **35+ tables** created
- ✅ **All core tables** (profiles, merchants, users)
- ✅ **DAO system tables** (organizations, members, proposals, votes)
- ✅ **NFT & loyalty tables** (nft_types, user_loyalty_cards)
- ✅ **Marketplace tables** (listings, investments)
- ✅ **Cities lookup table** (323,573 cities)

### **Default Data:**
- ✅ **4 NFT types** (Common, Less Common, Rare, Very Rare)
- ✅ **5 subscription plans** (Startup, Momentum, Energizer, Cloud9, Super)
- ✅ **3 DAO organizations** (RAC Governance, Merchant Council, User Community)
- ✅ **3 loyalty networks** (Starbucks, Airlines, Hotels)
- ✅ **3 marketplace categories** (Real Estate, Crypto, Stocks)
- ✅ **2 asset initiatives** (Real Estate Fund, Crypto Growth Fund)

### **Functions & Features:**
- ✅ **get_user_loyalty_card** function
- ✅ **generate_loyalty_number** function
- ✅ **generate_wallet_backup_code** function
- ✅ **verify_wallet_backup** function
- ✅ **sync_loyalty_points** function

## 🚨 **Prerequisites**

Before running the scripts, ensure:

1. **PostgreSQL is running** on localhost:5432
2. **Database `ignite_rewards` exists**
3. **User `postgres` has access** with password `Maegan@200328`
4. **All SQL files are present** in the project directory

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Script Not Found:**
```
⚠️ Script not found: script_name.sql
```
**Solution:** Ensure all SQL files are in the project directory

#### **2. Permission Denied:**
```
❌ Permission denied for table
```
**Solution:** Grant proper permissions to postgres user

#### **3. Table Already Exists:**
```
⚠️ Warning (Exit code: 1)
```
**Solution:** This is normal - scripts use `CREATE TABLE IF NOT EXISTS`

#### **4. Connection Failed:**
```
❌ Database connection failed
```
**Solution:** Check PostgreSQL is running and accessible

### **Debug Commands:**

```bash
# Test database connection
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT 1;"

# Check database exists
psql -h localhost -p 5432 -U postgres -l | grep ignite_rewards

# Check tables
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "\dt"

# Check specific table
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT COUNT(*) FROM public.nft_types;"
```

## 🎯 **Post-Execution Steps**

After successful execution:

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Test key features:**
   - User authentication
   - Loyalty card creation
   - Merchant signup with cities
   - DAO proposal creation
   - Marketplace functionality

3. **Check browser console** for any remaining errors

4. **Verify data integrity:**
   - Check cities lookup works
   - Verify loyalty cards load
   - Test DAO functionality
   - Confirm marketplace features

## 📈 **Performance Impact**

### **Execution Time:**
- **PowerShell script**: ~5-10 minutes
- **Batch script**: ~3-5 minutes
- **Manual SQL**: ~2-3 minutes

### **Database Size:**
- **Cities data**: ~21 MB (323,573 records)
- **Total database**: ~25-30 MB
- **Tables**: 35+ tables with indexes

## 🎉 **Success Indicators**

You'll know the execution was successful when:

1. **All scripts execute** without critical errors
2. **Verification queries** return expected results
3. **Application starts** without database errors
4. **All features work** correctly
5. **Cities lookup** functions properly
6. **Loyalty cards** load without issues

## 📞 **Need Help?**

If you encounter issues:

1. **Check PostgreSQL** is running and accessible
2. **Verify database** exists and has proper permissions
3. **Review error messages** in the execution output
4. **Test individual scripts** if batch execution fails
5. **Check file permissions** for SQL scripts

**Run the PowerShell script now to execute all database scripts on your local PostgreSQL database!** 🚀

This will bring your local database up to date with all the latest features and fixes from the past 10 days.
