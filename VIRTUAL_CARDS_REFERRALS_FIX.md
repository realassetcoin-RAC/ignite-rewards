# Virtual Cards and Referrals Tab Error Fixes

## Issues Identified

1. **Virtual Cards Tab**: "Failed to load Virtual cards" error
2. **Referrals Tab**: "Failed to load" error when tab is selected

## Root Causes

### Virtual Cards Issues:
- Insufficient error handling in admin permission checks
- RLS policies not properly configured for both `api.profiles` and `public.profiles` schemas
- Generic error messages that didn't help identify the specific issue

### Referrals Issues:
- Missing referral code generation for new users
- RLS policies too restrictive for user access to their own referrals
- Poor error handling when referral table doesn't exist or is inaccessible

## Fixes Implemented

### 1. Enhanced Error Handling (VirtualCardManager.tsx)

**Before:**
```typescript
const { data, error } = await supabase
  .from('virtual_cards')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error loading virtual cards:', error);
  toast({
    title: "Error",
    description: "Failed to load virtual cards",
    variant: "destructive",
  });
}
```

**After:**
```typescript
// Enhanced authentication and profile checking
const { data: { user }, error: authError } = await supabase.auth.getUser();
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

// Specific error handling based on error codes
switch (error.code) {
  case 'PGRST301':
    errorMessage = "You don't have permission to view virtual cards. Admin access required.";
    break;
  case '42501':
    errorMessage = "Insufficient permissions to access virtual cards table.";
    break;
  case 'PGRST116':
    errorMessage = "Virtual cards table not found or not accessible.";
    break;
  default:
    errorMessage = `Failed to load virtual cards: ${error.message}`;
}
```

### 2. Automatic Referral Code Generation (ReferralsTab.tsx)

**Added:**
```typescript
const ensureUserReferralCode = async () => {
  if (!user?.id) return;

  try {
    // Check if user already has a referral code
    const { data: existingReferral, error: checkError } = await supabase
      .from('user_referrals')
      .select('referral_code')
      .eq('referrer_id', user.id)
      .limit(1);

    // If user doesn't have a referral code, create one
    if (!existingReferral || existingReferral.length === 0) {
      const referralCode = `REF${user.id.slice(-8).toUpperCase()}${Date.now().toString().slice(-4)}`;
      
      const { error: insertError } = await supabase
        .from('user_referrals')
        .insert([{
          referrer_id: user.id,
          referral_code: referralCode,
          status: 'pending',
          reward_points: 0
        }]);

      if (!insertError) {
        setMyReferralCode(referralCode);
      }
    }
  } catch (error) {
    console.error('Error ensuring referral code:', error);
  }
};
```

### 3. Improved UI States

**Loading States:**
- Added spinner animations for both components
- Better loading messages

**Empty States:**
- Virtual Cards: Shows a card with call-to-action to create first card
- Referrals: Shows animated skeleton while generating referral code

**Error States:**
- Graceful degradation instead of complete failure
- Specific error messages based on error types

### 4. Database Migration (20250115_fix_virtual_cards_referrals_policies.sql)

**Fixed RLS Policies:**

```sql
-- Virtual Cards - Admin access
CREATE POLICY "Admin full access to virtual_cards" ON public.virtual_cards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Referrals - User access to own data
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Key Improvements:**
- Checks both `api.profiles` and `public.profiles` schemas for admin role
- Allows users to access their own referral data
- Comprehensive CRUD permissions for different user types
- Added performance indexes

## Testing Recommendations

1. **Virtual Cards Tab (Admin Users):**
   - Verify admin users can view and manage virtual cards
   - Test error handling for non-admin users
   - Check empty state when no cards exist

2. **Referrals Tab (All Users):**
   - Verify referral code is automatically generated for new users
   - Test copying referral code and link functionality
   - Check referral history display
   - Verify stats calculations

3. **Error Scenarios:**
   - Test with network disconnection
   - Test with invalid authentication
   - Test with insufficient permissions

## Files Modified

1. `src/components/admin/VirtualCardManager.tsx` - Enhanced error handling and UI states
2. `src/components/dashboard/ReferralsTab.tsx` - Added referral code generation and better error handling
3. `supabase/migrations/20250115_fix_virtual_cards_referrals_policies.sql` - Fixed RLS policies

## Next Steps

1. Apply the database migration to production
2. Test both components with different user roles
3. Monitor error logs for any remaining issues
4. Consider adding analytics to track feature usage

## Notes

- The fixes maintain backward compatibility
- Error handling is non-breaking (graceful degradation)
- All changes follow existing code patterns and conventions
- Database migration is safe to run on existing data