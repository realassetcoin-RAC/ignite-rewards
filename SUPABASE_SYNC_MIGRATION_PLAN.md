# Supabase Database Synchronization Plan

## 🎯 **Migration Overview**

This plan will synchronize your cloud Supabase database with your local database structure and data. The local database contains a comprehensive loyalty rewards system with DAO governance, marketplace, NFT management, and merchant features.

## 📊 **Current State Analysis**

### **Local Database Structure:**
- **Database**: `ignite_rewards` (PostgreSQL)
- **Schema**: `public` (primary schema)
- **Extensions**: `uuid-ossp`, `pgcrypto`
- **Tables**: 25+ tables including DAO, marketplace, loyalty, merchant systems

### **Cloud Database Structure:**
- **Database**: `wndswqvqogeblksrujpg.supabase.co`
- **Current Status**: Needs full synchronization
- **Schema**: `public` (target schema)

## 🗄️ **Database Tables to Synchronize**

### **Core Tables:**
1. `profiles` - User profiles and authentication
2. `merchants` - Merchant information and management
3. `merchant_subscription_plans` - Subscription plans for merchants
4. `nft_types` - NFT card types and configurations
5. `user_loyalty_cards` - User loyalty card assignments
6. `loyalty_transactions` - Transaction history
7. `user_points` - User point balances
8. `user_referrals` - Referral system
9. `referral_campaigns` - Referral campaign management

### **DAO System Tables:**
10. `dao_organizations` - DAO organizations
11. `dao_members` - DAO member management
12. `dao_proposals` - DAO proposal system
13. `dao_votes` - DAO voting system

### **Marketplace Tables:**
14. `marketplace_listings` - Marketplace listings
15. `marketplace_investments` - User investments
16. `passive_income_distributions` - Income distributions
17. `user_passive_earnings` - User earnings

### **Advanced Features:**
18. `virtual_cards` - Virtual loyalty cards
19. `user_wallets` - Solana wallet integration
20. `loyalty_networks` - Third-party loyalty integration
21. `loyalty_links` - User loyalty account links
22. `loyalty_otp_codes` - OTP verification
23. `merchant_discount_codes` - Discount code system
24. `merchant_custom_nfts` - Custom NFT management
25. `asset_initiatives` - Asset/initiative selection
26. `user_asset_selections` - User selections
27. `email_templates` - Email notification templates
28. `email_notifications` - Email notification log

## 🔧 **Migration Strategy**

### **Phase 1: Backup & Clear Cloud Database**
1. Backup existing cloud data (if any)
2. **Clear all existing data from cloud database**
3. Drop all existing tables and schemas
4. Prepare clean slate for migration

### **Phase 2: Schema Synchronization**
1. Create all tables from local database in cloud
2. Create all required indexes
3. Set up Row Level Security (RLS) policies
4. Create all required functions and triggers
5. Set up all enums and constraints

### **Phase 3: Data Synchronization**
1. Export data from local database
2. Import all data to cloud database
3. Verify data integrity
4. Test all relationships

### **Phase 4: Configuration & Testing**
1. Update environment variables
2. Test all application features
3. Verify DAO functionality
4. Test marketplace features
5. Validate loyalty system

## 📋 **Migration Steps**

### **Step 1: Backup Cloud Data**
- Export existing cloud data (if any)
- Create backup of current cloud schema

### **Step 2: Clear Cloud Database**
- **Drop all existing tables and data**
- Clear all schemas except system schemas
- Prepare clean slate for migration

### **Step 3: Schema Migration**
- Run comprehensive schema migration script
- Create all tables, indexes, and constraints
- Set up RLS policies
- Create all functions and triggers

### **Step 4: Data Migration**
- Export local database data
- Import all data to cloud database
- Verify data integrity

### **Step 5: Application Configuration**
- Update environment variables
- Test database connections
- Verify all features work

### **Step 6: Validation**
- Run comprehensive tests
- Verify DAO system functionality
- Test marketplace features
- Validate loyalty system

## 🚀 **Execution Plan**

The migration will be executed in the following order:

1. **Backup existing cloud data**
2. **Clear all cloud database data and tables**
3. **Execute schema synchronization**
4. **Execute data synchronization**
5. **Update application configuration**
6. **Verify synchronization**

## ⚠️ **Important Notes**

- **Backup First**: Always backup existing cloud data before migration
- **Test Environment**: Test migration in a development environment first
- **Rollback Plan**: Have a rollback plan ready in case of issues
- **Data Integrity**: Verify all data is correctly migrated
- **Application Testing**: Test all application features after migration

## 📁 **Migration Files**

The following files will be created for the migration:

1. `01_backup_cloud_data.sql` - Backup existing cloud data
2. `02_clear_cloud_database.sql` - Clear all cloud data and tables
3. `03_schema_synchronization.sql` - Complete schema migration
4. `04_data_export_local.sql` - Export local data
5. `05_data_import_cloud.sql` - Import data to cloud
6. `06_verification_queries.sql` - Verification queries
7. `07_rollback_script.sql` - Rollback script (if needed)

## 🎯 **Success Criteria**

- All tables created in cloud database
- All data successfully migrated
- All RLS policies working
- All application features functional
- DAO system operational
- Marketplace features working
- Loyalty system validated

## 📞 **Support**

If any issues arise during migration:
1. Check the rollback script
2. Verify environment variables
3. Test database connections
4. Review error logs
5. Contact support if needed

---

**Ready to proceed with the migration?**
