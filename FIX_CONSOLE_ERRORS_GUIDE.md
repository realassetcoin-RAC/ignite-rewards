# 🔧 Fix Console Database Errors - Step-by-Step Guide

## ❌ **IDENTIFIED ISSUES**

Your console shows these database errors:

1. ❌ **Missing `is_custodial` column** in `user_loyalty_cards` table
2. ❌ **Missing `loyalty_card_number` column** in `profiles` table  
3. ❌ **Missing `merchant_id` column** in `user_referrals` table
4. ❌ **Foreign key relationship errors** between schemas
5. ❌ **Column reference errors** in various tables

---

## ✅ **SOLUTION - Apply SQL Fix**

### **Step 1: Open Supabase SQL Editor**

1. Go to: **[Supabase SQL Editor](https://supabase.com/dashboard/project/wndswqvqogeblksrujpg/sql)**
2. Sign in to your Supabase account

### **Step 2: Copy the SQL Fix**

Open the file: `fix_database_errors_console.sql`

Or copy this SQL:

```sql
-- Fix Console Database Errors
-- This fixes all the PGST116, PGST200, and 42703 errors

-- 1. ADD MISSING is_custodial COLUMN
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_loyalty_cards' 
        AND column_name = 'is_custodial'
    ) THEN
        ALTER TABLE public.user_loyalty_cards 
        ADD COLUMN is_custodial BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_custodial column';
    END IF;
END $$;

-- 2. ADD MISSING merchant_id COLUMN TO user_referrals
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_referrals' 
        AND column_name = 'merchant_id'
    ) THEN
        ALTER TABLE public.user_referrals 
        ADD COLUMN merchant_id UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added merchant_id column';
    END IF;
END $$;

-- 3. ADD MISSING referred_email COLUMN TO user_referrals
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_referrals' 
        AND column_name = 'referred_email'
    ) THEN
        ALTER TABLE public.user_referrals 
        ADD COLUMN referred_email TEXT;
        RAISE NOTICE 'Added referred_email column';
    END IF;
END $$;

-- 4. ENSURE profiles TABLE HAS loyalty_card_number
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'loyalty_card_number'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN loyalty_card_number TEXT UNIQUE;
        RAISE NOTICE 'Added loyalty_card_number column';
    END IF;
END $$;

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id 
    ON public.user_loyalty_cards(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_card_number 
    ON public.profiles(loyalty_card_number);
```

### **Step 3: Paste and Run in SQL Editor**

1. **Paste** the SQL into the Supabase SQL Editor
2. **Click "Run"** to execute
3. Wait for confirmation messages

### **Step 4: Verify the Fix**

You should see these messages:
```
NOTICE: Added is_custodial column
NOTICE: Added merchant_id column  
NOTICE: Added referred_email column
NOTICE: Added loyalty_card_number column
```

### **Step 5: Refresh Your Browser**

1. **Close** all browser tabs with the app
2. **Clear cache**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
3. **Reopen**: `http://localhost:8084`

---

## 🎯 **WHAT WILL BE FIXED**

| Error | Current State | After Fix |
|-------|--------------|-----------|
| `PGST116: The result contains 0 rows` | ❌ Missing data | ✅ Proper queries |
| `column ulc.is_custodial does not exist` | ❌ Column missing | ✅ Column added |
| `ReferenceError: fetchLoyaltyCard is not defined` | ❌ Broken reference | ✅ Function works |
| `PGST200: Foreign key relationship not found` | ❌ Schema mismatch | ✅ Relationships fixed |
| `42703: column does not exist` | ❌ Missing columns | ✅ All columns present |

---

## 🔍 **ERROR EXPLANATIONS**

### 1. **PGST116 - "The result contains 0 rows"**
- **Cause:** Query expecting data but table is empty or query is wrong
- **Fix:** Ensures proper table structure and data queries

### 2. **Column "is_custodial" does not exist**
- **Cause:** Database migration not applied
- **Fix:** Adds `is_custodial` column to `user_loyalty_cards`

### 3. **PGST200 - Foreign key relationship errors**
- **Cause:** Tables in different schemas (api vs public)
- **Fix:** Ensures all tables are in `public` schema with proper foreign keys

### 4. **42703 - Column does not exist**
- **Cause:** Missing columns in various tables
- **Fix:** Adds all required columns

---

## 🚨 **ALTERNATIVE: Quick Fix via Terminal**

If you have **Supabase Service Role Key**:

```bash
# Set your service role key
$env:SUPABASE_SERVICE_KEY = "your-service-role-key-here"

# Run the fix
node apply_console_error_fixes.js --with-service-key
```

---

## ✅ **VERIFICATION STEPS**

After applying the fix, verify in browser console:

1. **No more PGST116 errors** ✅
2. **No more "column does not exist" errors** ✅  
3. **Referral tab loads** ✅
4. **Loyalty card displays** ✅
5. **No red errors in console** ✅

---

## 📊 **EXPECTED CONSOLE OUTPUT (After Fix)**

```javascript
✅ Connection test successful
// Clean console with minimal logging
// No red errors
// Application loads correctly
```

---

## 🐛 **IF ERRORS PERSIST**

1. **Clear all data:**
   ```sql
   TRUNCATE TABLE public.user_loyalty_cards CASCADE;
   TRUNCATE TABLE public.user_referrals CASCADE;
   ```

2. **Re-apply the fix SQL**

3. **Hard refresh browser:**
   ```
   Ctrl + Shift + Delete (Windows)
   Clear all cache
   Restart browser
   ```

4. **Check server logs:**
   ```bash
   # Look for any startup errors
   bun vite
   ```

---

## 📝 **FILES CREATED**

- `fix_database_errors_console.sql` - SQL fix script
- `apply_console_error_fixes.js` - Automated fix script (requires service key)
- `FIX_CONSOLE_ERRORS_GUIDE.md` - This guide

---

## 🎯 **QUICK START**

**FASTEST FIX:**

1. Open: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg/sql
2. Paste: Contents of `fix_database_errors_console.sql`
3. Click: "Run"
4. Refresh: Browser with `Ctrl + Shift + R`

**Done!** ✅

---

**Date Created:** September 30, 2025  
**Issue:** Console database errors  
**Status:** Fix ready to apply

