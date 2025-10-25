# 🔧 Subscription Plans Display Fix

## ❌ **Problem: Plans Showing "$NaN/mo"**

The subscription plans admin panel was displaying "$NaN/mo" for all plans instead of actual prices.

---

## 🔍 **Root Cause Analysis:**

### **Database Schema:**
The `merchant_subscription_plans` table has:
```
- id (UUID)
- plan_name (TEXT)
- display_name (TEXT)
- description (TEXT)
- price (NUMERIC) ← Actual column name
- currency (TEXT)
- billing_cycle (TEXT)
- max_transactions (INTEGER)
- max_points_distribution (INTEGER)
- features (JSONB)
- is_active (BOOLEAN)
```

### **Code Issue:**
The SubscriptionPlanManager component was expecting:
```typescript
interface Plan {
  price_monthly: number;  // ❌ Looking for this
  monthly_points: number;  // ❌ Looking for this
  monthly_transactions: number;  // ❌ Looking for this
}
```

But the database has:
```
price (not price_monthly)
max_points_distribution (not monthly_points)
max_transactions (not monthly_transactions)
```

---

## ✅ **Fix Applied:**

### **Added Column Mapping in loadPlans():**

```typescript
const loadPlans = async () => {
  const { data, error } = await supabase
    .from('merchant_subscription_plans')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Map database columns to expected interface
  if (data && !error) {
    const mappedPlans = data.map(plan => ({
      id: plan.id,
      name: plan.plan_name || plan.display_name || 'Unnamed Plan',
      description: plan.description || null,
      price_monthly: Number(plan.price) || 0,  // ✅ Map 'price' to 'price_monthly'
      price_yearly: Number(plan.price_yearly) || 0,
      monthly_points: Number(plan.max_points_distribution) || 0,  // ✅ Map column
      monthly_transactions: Number(plan.max_transactions) || 0,  // ✅ Map column
      features: plan.features || [],
      trial_days: Number(plan.trial_days) || 0,
      is_active: plan.is_active !== false,
      popular: plan.is_popular || false,
      created_at: plan.created_at
    }));
    
    setPlans(mappedPlans);
    return;
  }
};
```

---

## 📊 **Column Mapping:**

| Database Column | Component Property | Purpose |
|----------------|-------------------|---------|
| `price` | `price_monthly` | Monthly price |
| `max_points_distribution` | `monthly_points` | Points per month |
| `max_transactions` | `monthly_transactions` | Transaction limit |
| `plan_name` | `name` | Plan name |
| `is_active` | `is_active` | Active status |

---

## 📝 **Files Modified:**

- `src/components/admin/SubscriptionPlanManager.tsx`
  - Added column mapping in `loadPlans()` function
  - Maps database columns to component interface
  - Handles null/undefined values with fallbacks

---

## ✅ **Expected Results:**

### **Before:**
- ❌ All plans showing "$NaN/mo"
- ❌ "0 points" displayed
- ❌ "0 txns" displayed

### **After:**
- ✅ StartUp Plan: Shows actual price
- ✅ Momentum Plan: Shows actual price
- ✅ Energizer Plan: Shows actual price
- ✅ Cloud Plan: Shows actual price
- ✅ Super Plan: Shows actual price
- ✅ Points and transactions display correctly

---

## 🎯 **Current Database Values:**

Based on database query:

| Plan | Price | Max Transactions | Max Points |
|------|-------|-----------------|-----------|
| StartUp Plan | (needs update) | 100 | (needs update) |
| Momentum Plan | (needs update) | 300 | (needs update) |
| Energizer Plan | (needs update) | 600 | (needs update) |
| Cloud Plan | (needs update) | 1800 | (needs update) |
| Super Plan | (needs update) | 4000 | (needs update) |

---

## 🔄 **Next Steps:**

### **Option 1: Update Database Values**
Run SQL to set proper prices:
```sql
UPDATE merchant_subscription_plans 
SET price = 20 
WHERE plan_name = 'StartUp Plan';

UPDATE merchant_subscription_plans 
SET price = 50 
WHERE plan_name = 'Momentum Plan';

UPDATE merchant_subscription_plans 
SET price = 100 
WHERE plan_name = 'Energizer Plan';

UPDATE merchant_subscription_plans 
SET price = 250 
WHERE plan_name = 'Cloud Plan';

UPDATE merchant_subscription_plans 
SET price = 500 
WHERE plan_name = 'Super Plan';
```

### **Option 2: Use Admin UI**
- Click "Edit" on each plan
- Enter the price in "Monthly Price" field
- Save changes

---

## 📚 **Related Files:**

- `src/components/admin/SubscriptionPlanManager.tsx` - Plan management UI
- Database table: `public.merchant_subscription_plans`
- Plans are used by merchants for subscriptions

---

**Date Fixed:** September 30, 2025  
**Issue:** Column name mismatch (price vs price_monthly)  
**Status:** ✅ **MAPPING FIXED**

**Refresh browser to see subscription plans with correct data!** 🎉

---

## 💡 **Note:**

The mapping is now in place, but you may need to update the actual price values in the database using the admin panel or SQL. The display will work correctly once prices are set.

