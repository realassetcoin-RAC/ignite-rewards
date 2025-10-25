# Database Restoration Guide

## 🚨 **Critical Issue: All Tables Deleted**

Your Supabase database appears to have lost all tables. This is a serious situation that needs immediate restoration.

## 🎯 **What Happened**

Based on the error messages and your report, it appears that:
- All database tables have been deleted or are missing
- The `public.user_loyalty_cards` table doesn't exist
- Other essential tables are also missing

## 🚀 **Immediate Solution**

### **Step 1: Run the Complete Database Restoration Script**

Execute this script in your Supabase SQL Editor:

```sql
\i restore_complete_database.sql
```

### **Step 2: Verify the Restoration**

After running the script, you should see:
```
Database restoration completed successfully!
Tables created: 18
NFT types: 4
Subscription plans: 5
DAO organizations: 3
```

## 📊 **What the Restoration Script Creates**

### **Core Tables (18 total):**

1. **`profiles`** - User profiles and authentication
2. **`merchants`** - Merchant information and management
3. **`merchant_subscription_plans`** - Subscription plans for merchants
4. **`nft_types`** - NFT card types and configurations
5. **`user_loyalty_cards`** - User loyalty card assignments
6. **`loyalty_transactions`** - Transaction history
7. **`dao_organizations`** - DAO organizations
8. **`dao_members`** - DAO member management
9. **`dao_proposals`** - DAO proposal system
10. **`dao_votes`** - DAO voting system
11. **`marketplace_listings`** - Marketplace listings
12. **`marketplace_investments`** - User investments
13. **`referral_campaigns`** - Referral campaign management
14. **`user_referrals`** - User referral tracking
15. **`user_wallets`** - Solana wallet integration
16. **`user_points`** - User point balances
17. **`terms_privacy_acceptance`** - Terms and privacy acceptance
18. **`user_notifications`** - User notification system

### **Default Data Inserted:**

- ✅ **4 NFT Types**: Common, Less Common, Rare, Very Rare
- ✅ **5 Subscription Plans**: Startup, Momentum, Energizer, Cloud9, Super
- ✅ **3 DAO Organizations**: RAC Governance, Merchant Council, User Community
- ✅ **1 Referral Campaign**: Welcome Referral Program

### **Security & Permissions:**

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Proper RLS policies** for user data protection
- ✅ **Authenticated user permissions** for all operations
- ✅ **Anonymous read access** for public data

### **Essential Functions:**

- ✅ **`get_user_loyalty_card`** - Retrieves user loyalty card data
- ✅ **`generate_loyalty_number`** - Generates unique loyalty numbers

### **Performance Optimizations:**

- ✅ **Database indexes** on frequently queried columns
- ✅ **Foreign key constraints** for data integrity
- ✅ **Proper data types** and constraints

## 🔧 **After Restoration**

### **1. Test the Application**

- **Log in** to your application
- **Check loyalty cards** - they should now load
- **Test merchant signup** - should work with cities data
- **Verify DAO functionality** - proposals and voting
- **Test marketplace** - listings and investments

### **2. Verify Key Features**

```sql
-- Test loyalty card function
SELECT * FROM public.get_user_loyalty_card('your-user-id-here');

-- Check NFT types
SELECT * FROM public.nft_types;

-- Check subscription plans
SELECT * FROM public.merchant_subscription_plans;

-- Check DAO organizations
SELECT * FROM public.dao_organizations;
```

### **3. Restore Any Missing Data**

If you had existing data that was lost:
- **User profiles** will be recreated when users log in
- **Loyalty cards** will be created when users sign up
- **Merchant data** will need to be re-entered
- **DAO proposals** will need to be recreated

## 🛡️ **Prevention for Future**

### **1. Regular Backups**

Set up automated backups in Supabase:
- Go to **Settings** → **Database** → **Backups**
- Enable **Point-in-time recovery**
- Set up **Daily backups**

### **2. Migration Management**

- Always use **Supabase migrations** for schema changes
- Test migrations in **staging environment** first
- Keep **migration history** in version control

### **3. Database Monitoring**

- Monitor **table counts** regularly
- Set up **alerts** for unusual activity
- Review **access logs** periodically

## 🚨 **Emergency Recovery**

If the restoration script fails:

### **1. Check Supabase Status**
- Visit [status.supabase.com](https://status.supabase.com)
- Check for any ongoing incidents

### **2. Contact Support**
- Use Supabase support if database is corrupted
- Provide your project reference: `wndswqvqogeblksrujpg`

### **3. Alternative Recovery**
- Restore from **point-in-time backup** if available
- Use **database dump** if you have one

## 📋 **Verification Checklist**

After running the restoration script:

- [ ] **18 tables created** successfully
- [ ] **4 NFT types** inserted
- [ ] **5 subscription plans** inserted
- [ ] **3 DAO organizations** inserted
- [ ] **RLS policies** active
- [ ] **Functions working** (get_user_loyalty_card, generate_loyalty_number)
- [ ] **Indexes created** for performance
- [ ] **Permissions granted** to authenticated users
- [ ] **Application loads** without errors
- [ ] **Loyalty cards** display correctly
- [ ] **Cities lookup** still works (from previous setup)

## 🎉 **Expected Results**

After successful restoration:

1. **Loyalty cards will load** in the dashboard
2. **Merchant signup** will work with cities data
3. **DAO functionality** will be available
4. **Marketplace** will be operational
5. **Referral system** will work
6. **All user features** will be restored

## 📞 **Need Help?**

If you encounter any issues during restoration:

1. **Check the error messages** in Supabase SQL Editor
2. **Verify your Supabase connection** is working
3. **Ensure you have admin permissions** on the project
4. **Contact support** if the script fails completely

The restoration script is comprehensive and should restore your entire database structure. Run it now to get your application back online! 🚀
