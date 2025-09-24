# Supabase Import Fix

## Issue Identified
Multiple components were showing `ReferenceError: supabase is not defined` because they had their supabase imports commented out.

## Root Cause
Several admin components had their supabase imports commented out, likely during development or testing, but were still trying to use the `supabase` object in their code.

## Files Fixed

### 1. `src/components/admin/MerchantManager.tsx`
- **Issue**: Line 10 had `// import { supabase } from "@/lib/supabaseClient";`
- **Fix**: Uncommented and updated to `import { supabase } from "@/integrations/supabase/client";`
- **Impact**: Fixed "Error loading subscription plans" error

### 2. `src/components/admin/SubscriptionPlanManager.tsx`
- **Issue**: Line 3 had `// import { supabase } from "@/lib/supabaseClient";`
- **Fix**: Uncommented and updated to `import { supabase } from "@/integrations/supabase/client";`
- **Impact**: Fixed "Failed to load plans" error

### 3. `src/components/admin/SubscriptionPlansVerification.tsx`
- **Issue**: Line 2 had `// import { supabase } from "@/lib/supabaseClient";`
- **Fix**: Uncommented and updated to `import { supabase } from "@/integrations/supabase/client";`
- **Impact**: Fixed supabase usage in auth.getUser() call

### 4. `src/components/admin/ReferralCampaignManager.tsx`
- **Issue**: Line 3 had `// import { supabase } from "@/integrations/supabase/client";`
- **Fix**: Uncommented the import
- **Impact**: Fixed supabase usage in auth.getUser() call

## Changes Made

### Before (Commented Out):
```typescript
// import { supabase } from "@/lib/supabaseClient";
// or
// import { supabase } from "@/integrations/supabase/client";
```

### After (Active Import):
```typescript
import { supabase } from "@/integrations/supabase/client";
```

## Why This Fix Works

1. **Correct Import Path**: All imports now use `@/integrations/supabase/client` which exports our `databaseAdapter` as `supabase`
2. **Active Imports**: No more commented out imports that were causing `ReferenceError`
3. **Consistent Pattern**: All components now use the same import pattern
4. **Database Adapter Integration**: All components now use our enhanced database adapter with proper fallbacks

## Expected Results

### ✅ **No More Errors:**
- ❌ `ReferenceError: supabase is not defined`
- ❌ `Error loading subscription plans`
- ❌ `Failed to load plans`

### ✅ **Working Features:**
- ✅ Merchant Manager subscription plan loading
- ✅ Subscription Plan Manager functionality
- ✅ Subscription Plans Verification
- ✅ Referral Campaign Manager authentication

## Files Modified
1. `src/components/admin/MerchantManager.tsx` - Fixed supabase import
2. `src/components/admin/SubscriptionPlanManager.tsx` - Fixed supabase import
3. `src/components/admin/SubscriptionPlansVerification.tsx` - Fixed supabase import
4. `src/components/admin/ReferralCampaignManager.tsx` - Fixed supabase import

## Next Steps

### 1. Test the Application
The application should now work without the `ReferenceError: supabase is not defined` errors.

### 2. Verify Admin Features
Test the following admin features:
- Merchant Manager (subscription plans)
- Subscription Plan Manager
- Subscription Plans Verification
- Referral Campaign Manager

### 3. Check Console
The console should no longer show the supabase reference errors.

## Additional Notes

### Other Files with Commented Imports
There are many other files with commented out supabase imports, but these are mostly:
- Test files (`*Test*.tsx`)
- Backup files (`*backup*.ts`)
- Debug files (`*Debug*.tsx`)
- Unused service files

These files are not actively used in the application, so they don't need to be fixed unless they become active.

### Import Path Standardization
All active components now use the standardized import path:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

This ensures consistency and proper integration with our database adapter system.

The application should now work properly without the supabase reference errors!

