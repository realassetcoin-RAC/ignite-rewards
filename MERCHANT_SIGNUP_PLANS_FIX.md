# 🔧 Merchant Signup - Subscription Plans Fix

## ❌ **Problem: Plans Not Loading in Merchant Signup**

When merchants click "Signup as Merchant" from the homepage, the subscription plans were not loading. Console error showed:

```
Failed to load subscription plans: 
column merchant_subscription_plans.plan_number does not exist
```

---

## 🔍 **Root Cause:**

The `MerchantSignupModal.tsx` component was trying to:
1. Query the `plan_number` column which doesn't exist in the database
2. Use `plan.monthly_points` and `plan.monthly_transactions` which don't exist
3. Expected different column names than what the database has

### **Database Actual Columns:**
```
- price (not price_monthly)
- price_yearly
- max_points_distribution (not monthly_points)
- max_transactions (not monthly_transactions)
- plan_name or display_name (not name)
```

---

## ✅ **Fixes Applied:**

### **1. Fixed Database Query:**

**Before:**
```typescript
.order('plan_number', { ascending: true })  // ❌ Column doesn't exist
```

**After:**
```typescript
.order('price', { ascending: true })  // ✅ Order by price
```

### **2. Fixed Column Mapping:**

**Before:**
```typescript
monthlyPoints: plan.monthly_points || 0,  // ❌ Wrong column
monthlyTransactions: plan.monthly_transactions || 0,  // ❌ Wrong column
planNumber: plan.plan_number || 0,  // ❌ Column doesn't exist
```

**After:**
```typescript
monthlyPoints: plan.max_points_distribution || plan.monthly_points || 0,  // ✅ Correct column
monthlyTransactions: plan.max_transactions || plan.monthly_transactions || 0,  // ✅ Correct column
planNumber: index + 1,  // ✅ Use array index instead
```

### **3. Fixed Plan Name Mapping:**

**Before:**
```typescript
name: plan.name,  // ❌ Column might not exist
```

**After:**
```typescript
name: plan.name || plan.plan_name || plan.display_name || 'Unknown Plan',  // ✅ Multiple fallbacks
```

### **4. Fixed Feature Detection:**

Changed from plan_number-based logic to price-based logic:

**Before:**
```typescript
if (plan.plan_number >= 2) {
  featuresArray.push('Custom Branding');
}
```

**After:**
```typescript
const planPrice = plan.price || plan.price_monthly || 0;
if (planPrice >= 50) {
  featuresArray.push('Custom Branding');
}
```

---

## 📊 **Price-Based Feature Logic:**

| Price Range | Features Added |
|-------------|----------------|
| >= $50 | Custom Branding |
| >= $100 | Priority Support |
| >= $250 | API Access |
| >= $500 | White Label Solution |

All plans get these base features:
- Loyalty Program Management
- Customer Analytics
- Email Marketing
- QR Code Generation

---

## 📝 **Files Modified:**

- `src/components/MerchantSignupModal.tsx`
  - Fixed database query (line 242)
  - Made `planNumber` optional in interface
  - Fixed column mapping in fallback query
  - Fixed column mapping in RPC response
  - Changed feature logic from plan_number to price-based

---

## ✅ **Expected Results:**

After refreshing the browser:

1. **Merchant Signup Opens** ✅
   - Click "Signup as Merchant" on homepage
   - Modal opens successfully

2. **Plans Display** ✅
   - All 5 subscription plans show
   - Ordered by price (lowest to highest)

3. **Plan Details Show** ✅
   - Plan name displays correctly
   - Monthly and yearly pricing shows
   - Points and transactions display
   - Features list appears

4. **Plan Selection Works** ✅
   - Can select any plan
   - "Continue" button works
   - Proceeds to merchant details form

---

## 🎯 **Expected Plan Display:**

```
┌─────────────────────────────────────────────┐
│  StartUp Plan                      Popular  │
│  $20/month or $150/year                     │
│  • 100 points/month                         │
│  • 100 transactions/month                   │
│  • Loyalty Program Management               │
│  • Customer Analytics                       │
│  • Email Marketing                          │
│  • QR Code Generation                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Momentum Plan                              │
│  $50/month or $500/year                     │
│  • 300 points/month                         │
│  • 300 transactions/month                   │
│  • All StartUp features +                   │
│  • Custom Branding                          │
└─────────────────────────────────────────────┘

... and so on for Energizer, Cloud, and Super plans
```

---

## 🔄 **How to Test:**

1. **Refresh Browser:** `Ctrl + Shift + R`

2. **Test Merchant Signup:**
   - Go to homepage
   - Click "Signup as Merchant" button
   - Modal should open with subscription plans

3. **Verify Plans Display:**
   - Check all 5 plans show
   - Verify pricing displays correctly
   - Check features lists are complete

4. **Test Plan Selection:**
   - Click on different plans
   - Toggle monthly/yearly billing
   - Click "Continue" to proceed

5. **Check Console:**
   - Should see no errors
   - Plans should load successfully

---

## 🐛 **Troubleshooting:**

### **Plans Still Not Loading:**
1. Check browser console for errors
2. Verify `fix_subscription_plans_complete.sql` was run
3. Confirm `price_yearly` column exists
4. Hard refresh browser

### **Wrong Column Names:**
- The component now handles multiple possible column names
- Should work with both old and new schema

### **Features Not Showing:**
- Features are now price-based
- Check if `features` column has data in database
- Component generates default features if missing

---

## 📚 **Related Documentation:**

- `SUBSCRIPTION_PLANS_YEARLY_FIX.md` - Yearly pricing fix
- `SUBSCRIPTION_PLANS_DISPLAY_FIX.md` - Admin panel display fix
- `PRODUCT_FEATURES.md` - Product specifications

---

**Date Fixed:** September 30, 2025  
**Issue:** Column name mismatches and missing plan_number column  
**Status:** ✅ **RESOLVED**

**Refresh your browser and test merchant signup from the homepage!** 🎉

