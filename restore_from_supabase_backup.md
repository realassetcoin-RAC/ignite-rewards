# Restore from Supabase Backup Guide

## 🎯 **Supabase Backup Restoration Options**

Supabase provides several ways to restore your database from backups:

### **Option 1: Point-in-Time Recovery (Recommended)**
This restores your database to a specific point in time before the data loss.

### **Option 2: Database Backup Restoration**
This restores from a full database backup.

## 🚀 **How to Restore from Supabase Backup**

### **Step 1: Access Supabase Dashboard**

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `wndswqvqogeblksrujpg`

### **Step 2: Access Database Settings**

1. In your project dashboard, go to **Settings** (gear icon)
2. Click on **Database** in the left sidebar
3. Scroll down to **Backups** section

### **Step 3: Choose Restoration Method**

#### **Method A: Point-in-Time Recovery**

1. **Click "Restore"** next to Point-in-time recovery
2. **Select a date/time** before the data loss occurred
3. **Choose what to restore**:
   - Full database
   - Specific tables
   - Specific schemas
4. **Click "Restore"** to start the process

#### **Method B: Database Backup Restoration**

1. **Click "Restore"** next to Database backups
2. **Select a backup** from the list (most recent before data loss)
3. **Review the backup details**:
   - Backup date/time
   - Database size
   - Tables included
4. **Click "Restore"** to start the process

### **Step 4: Monitor Restoration Progress**

- The restoration process may take several minutes
- You'll see progress indicators in the dashboard
- Don't interrupt the process once started

### **Step 5: Verify Restoration**

After restoration completes:

1. **Check table counts**:
   ```sql
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
   ```

2. **Verify key tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_loyalty_cards', 'merchants', 'profiles', 'nft_types');
   ```

3. **Check data integrity**:
   ```sql
   SELECT COUNT(*) FROM public.user_loyalty_cards;
   SELECT COUNT(*) FROM public.merchants;
   SELECT COUNT(*) FROM public.nft_types;
   ```

## ⚠️ **Important Considerations**

### **Before Restoring:**

1. **Current Data**: The restoration will **overwrite** your current database
2. **Recent Changes**: Any data created after the backup will be **lost**
3. **Downtime**: Your application will be **unavailable** during restoration
4. **Backup Age**: Choose a backup from **before** the data loss occurred

### **What Gets Restored:**

- ✅ **All tables** and their data
- ✅ **Database schema** and structure
- ✅ **Functions** and stored procedures
- ✅ **Indexes** and constraints
- ✅ **RLS policies** and permissions
- ✅ **Extensions** and configurations

### **What Doesn't Get Restored:**

- ❌ **Recent data** created after the backup
- ❌ **Custom configurations** made after backup
- ❌ **New users** registered after backup
- ❌ **Recent transactions** or activities

## 🔍 **Finding the Right Backup**

### **Check Backup Availability:**

1. **Go to Database → Backups**
2. **Look for backups** from before the data loss
3. **Check backup details**:
   - Date and time
   - Database size
   - Number of tables
   - Data completeness

### **Recommended Backup Selection:**

- **Choose the most recent backup** before data loss
- **Ensure it includes** all your essential tables
- **Verify the backup size** is reasonable (not too small)
- **Check the backup date** is from when your app was working

## 🛠️ **Alternative: Manual Data Recovery**

If backups are not available or suitable:

### **Option 1: Use the Restoration Script**
The `restore_complete_database.sql` script we created will:
- Recreate all table structures
- Insert default data
- Set up proper permissions
- Restore basic functionality

### **Option 2: Contact Supabase Support**
If you need help with backup restoration:
1. **Go to Supabase Dashboard**
2. **Click "Support"** in the bottom left
3. **Submit a ticket** explaining your situation
4. **Provide your project reference**: `wndswqvqogeblksrujpg`

## 📋 **Post-Restoration Checklist**

After successful backup restoration:

- [ ] **Verify all tables** are present
- [ ] **Check data integrity** and counts
- [ ] **Test application functionality**
- [ ] **Verify user authentication** works
- [ ] **Check loyalty cards** load correctly
- [ ] **Test merchant signup** with cities
- [ ] **Verify DAO functionality**
- [ ] **Test marketplace** features
- [ ] **Check referral system**
- [ ] **Monitor for any errors**

## 🚨 **Emergency Contacts**

### **Supabase Support:**
- **Dashboard**: Go to your project → Support
- **Email**: support@supabase.com
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)

### **Your Project Details:**
- **Project Reference**: `wndswqvqogeblksrujpg`
- **Database URL**: `https://wndswqvqogeblksrujpg.supabase.co`
- **Region**: Check your project settings

## 🎯 **Recommended Action**

1. **First**: Try Point-in-Time Recovery to restore to before data loss
2. **If that fails**: Use Database Backup Restoration
3. **If no backups**: Use the `restore_complete_database.sql` script
4. **If all else fails**: Contact Supabase Support

The backup restoration should restore your exact data and configuration from before the data loss occurred! 🚀
