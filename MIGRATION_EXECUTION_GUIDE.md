# Database Migration Execution Guide

## 🎯 **Quick Start**

This guide will help you execute the complete migration from your local database to your cloud Supabase database.

## 📋 **Prerequisites**

1. **Local Database**: Your local PostgreSQL database with all data
2. **Cloud Database**: Your Supabase cloud database (cleared and ready)
3. **Database Access**: Admin access to both databases
4. **Backup**: Ensure you have backups of both databases

## 🚀 **Execution Steps**

### **Step 1: Prepare Your Environment**

1. **Connect to your cloud Supabase database** using your preferred PostgreSQL client
2. **Ensure you have admin privileges** on the cloud database
3. **Verify your connection** to the cloud database

### **Step 2: Execute Migration Scripts**

Run the following scripts **in order** on your **cloud Supabase database**:

#### **Script 1: Backup Cloud Data**
```sql
-- Run this first to backup any existing data
\i 01_backup_cloud_data.sql
```

#### **Script 2: Clear Cloud Database**
```sql
-- This will completely clear the cloud database
\i 02_clear_cloud_database.sql
```

#### **Script 3: Schema Synchronization**
```sql
-- This creates the complete database schema
\i 03_schema_synchronization.sql
```

#### **Script 4: Data Import**
```sql
-- This imports all the data (includes sample data)
\i 05_data_import_cloud.sql
```

#### **Script 5: Verification**
```sql
-- This verifies the migration was successful
\i 06_verification_queries.sql
```

### **Step 3: Alternative - Single Script Execution**

If you prefer to run everything at once:

```sql
-- Run the complete migration in one go
\i EXECUTE_MIGRATION.sql
```

## ⚠️ **Important Notes**

### **Data Import Options**

The current migration includes **sample data** to get you started. If you want to import your **actual local data**:

1. **Export your local data** using `04_data_export_local.sql`
2. **Modify the import script** to include your actual data
3. **Or use pg_dump/pg_restore** for direct data transfer

### **Environment Variables**

After migration, update your application environment variables:

```env
# Update these in your .env file
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔧 **Troubleshooting**

### **If Migration Fails**

1. **Check the migration log**:
   ```sql
   SELECT * FROM public.migration_log ORDER BY step_number;
   ```

2. **Use the rollback script**:
   ```sql
   \i 07_rollback_script.sql
   ```

3. **Check for errors** in the verification queries

### **Common Issues**

- **Permission errors**: Ensure you have admin access to the cloud database
- **Connection issues**: Verify your Supabase connection details
- **Data conflicts**: The clear script should handle this, but check for any remaining data

## 📊 **Verification Checklist**

After migration, verify:

- [ ] All tables created successfully
- [ ] All data imported correctly
- [ ] RLS policies working
- [ ] Functions working (loyalty number generation, subscription plans)
- [ ] Sample users can log in
- [ ] DAO system functional
- [ ] Marketplace features working
- [ ] Loyalty system operational

## 🎯 **Success Criteria**

Your migration is successful when:

1. **All 20+ tables** are created in the cloud database
2. **All sample data** is present and accessible
3. **All functions** are working correctly
4. **RLS policies** are active and working
5. **Application connects** successfully to the cloud database
6. **All features** work as expected

## 📞 **Support**

If you encounter issues:

1. **Check the migration log** for specific error details
2. **Use the rollback script** to restore previous state
3. **Review the verification queries** for specific issues
4. **Check Supabase dashboard** for any service issues

## 🎉 **Completion**

Once migration is complete:

1. **Update your application** to use the cloud database
2. **Test all features** thoroughly
3. **Monitor performance** and usage
4. **Keep backups** of both databases
5. **Document any customizations** made during migration

---

**Ready to migrate? Start with Step 1 above!**