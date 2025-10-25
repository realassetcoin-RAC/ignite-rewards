# 🔧 Subscription Plans - Yearly Pricing Fix

## ❌ **Problem: Missing Yearly Subscription Plans**

The merchant subscription plans were only showing monthly pricing, but according to `PRODUCT_FEATURES.md`, there should be **BOTH monthly AND yearly pricing** for all plans.

---

## 📋 **Product Requirements (from PRODUCT_FEATURES.md):**

| Plan | Monthly Price | Yearly Price | Monthly Points | Transactions |
|------|---------------|--------------|----------------|--------------|
| **StartUp** | $20 | $150 | 100 | 100 |
| **Momentum** | $50 | $500 | 300 | 300 |
| **Energizer** | $100 | $1,000 | 600 | 600 |
| **Cloud** | $250 | $2,500 | 1,800 | 1,800 |
| **Super** | $500 | $5,000 | 4,000 | 4,000 |

### **Yearly Savings:**
- StartUp: Save $90/year (37.5% discount)
- Momentum: Save $100/year (16.7% discount)
- Energizer: Save $200/year (16.7% discount)
- Cloud: Save $500/year (16.7% discount)
- Super: Save $1,000/year (16.7% discount)

---

## 🔍 **Issues Found:**

### **1. Database Schema:**
- ❌ Missing `price_yearly` column
- ❌ Only had `price` column for monthly pricing
- ❌ No yearly pricing data

### **2. UI Display:**
- ❌ Yearly pricing was hidden with small gray text
- ❌ Not prominently displayed to encourage annual subscriptions
- ❌ Savings not highlighted

---

## ✅ **Fixes Applied:**

### **1. Database Schema Update:**

```sql
-- Added price_yearly column
ALTER TABLE public.merchant_subscription_plans 
ADD COLUMN price_yearly NUMERIC(10,2);

-- Updated all plans with correct pricing
UPDATE merchant_subscription_plans SET
    price = 20.00,
    price_yearly = 150.00
WHERE plan_name = 'StartUp';
-- ... (and so on for all plans)
```

### **2. UI Enhancement:**

**Before:**
```tsx
<div className="text-xs text-muted-foreground">
  ${price_yearly}/yr  {/* Small, gray, hard to see */}
</div>
```

**After:**
```tsx
<div className="text-sm text-primary font-medium">
  ${price_yearly}/yr  {/* Larger, primary color, prominent */}
</div>
```

### **3. Complete Plan Data:**

All plans now include:
- ✅ Monthly price
- ✅ Yearly price (prominently displayed)
- ✅ Monthly points allocation
- ✅ Transaction limits
- ✅ Detailed feature lists
- ✅ Proper descriptions

---

## 📊 **Updated Plan Details:**

### **StartUp Plan - $20/mo or $150/yr**
- 100 monthly points
- 100 monthly transactions
- Basic loyalty, email support
- **Save $90/year with annual billing!**

### **Momentum Plan - $50/mo or $500/yr**
- 300 monthly points
- 300 monthly transactions
- Advanced features, priority support
- Custom NFT creation
- **Save $100/year with annual billing!**

### **Energizer Plan - $100/mo or $1,000/yr**
- 600 monthly points
- 600 monthly transactions
- Premium features, account manager
- Custom NFT creation, API access
- **Save $200/year with annual billing!**

### **Cloud Plan - $250/mo or $2,500/yr**
- 1,800 monthly points
- 1,800 monthly transactions
- Enterprise features, 24/7 support
- Multi-location support
- **Save $500/year with annual billing!**

### **Super Plan - $500/mo or $5,000/yr**
- 4,000 monthly points
- 4,000 monthly transactions
- Ultimate features, white-label
- Custom integrations, priority feature requests
- **Save $1,000/year with annual billing!**

---

## 📝 **Files Modified:**

### **1. Database Script:**
- `fix_subscription_plans_complete.sql` (NEW)
  - Adds `price_yearly` column
  - Updates all plans with correct monthly and yearly pricing
  - Updates descriptions and features
  - Sets max_points_distribution values

### **2. UI Component:**
- `src/components/admin/SubscriptionPlanManager.tsx`
  - Enhanced yearly price display (larger, primary color)
  - Already had column mapping from previous fix
  - Now properly displays both monthly and yearly pricing

---

## 🎯 **Expected Results:**

### **Admin Panel Display:**

```
Plans
┌─────────────────────────────────────────────────────────────┐
│ Name         │ Pricing              │ Points/Txns │ Status │
├─────────────────────────────────────────────────────────────┤
│ StartUp      │ $20.00/mo           │ 100 / 100   │ Active │
│              │ $150.00/yr          │             │        │
├─────────────────────────────────────────────────────────────┤
│ Momentum     │ $50.00/mo           │ 300 / 300   │ Active │
│              │ $500.00/yr          │             │        │
├─────────────────────────────────────────────────────────────┤
│ Energizer    │ $100.00/mo          │ 600 / 600   │ Active │
│              │ $1,000.00/yr        │             │        │
├─────────────────────────────────────────────────────────────┤
│ Cloud        │ $250.00/mo          │ 1,800/1,800 │ Active │
│              │ $2,500.00/yr        │             │        │
├─────────────────────────────────────────────────────────────┤
│ Super        │ $500.00/mo          │ 4,000/4,000 │ Active │
│              │ $5,000.00/yr        │             │        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **How to Apply:**

### **Option 1: Using Supabase SQL Editor**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of `fix_subscription_plans_complete.sql`
4. Run the script
5. Refresh browser

### **Option 2: Using psql**
```bash
psql -h db.wndswqvqogeblksrujpg.supabase.co \
     -U postgres \
     -d postgres \
     -f fix_subscription_plans_complete.sql
```

### **Option 3: Using Node.js**
```bash
node -e "const {createClient} = require('@supabase/supabase-js'); const fs = require('fs'); const sql = fs.readFileSync('fix_subscription_plans_complete.sql', 'utf8'); /* execute sql */"
```

---

## ✅ **Verification Checklist:**

After running the SQL script:

- [ ] All 5 plans exist (StartUp, Momentum, Energizer, Cloud, Super)
- [ ] Each plan shows monthly price
- [ ] Each plan shows yearly price (in primary color)
- [ ] Yearly price is prominently displayed
- [ ] Points and transactions are correct
- [ ] Descriptions are accurate
- [ ] Features are listed
- [ ] All plans are active

---

## 💡 **Future Enhancements:**

### **Billing Period Selection:**
Consider adding a toggle in the merchant signup flow:
```tsx
<RadioGroup defaultValue="monthly">
  <RadioGroupItem value="monthly">Monthly Billing</RadioGroupItem>
  <RadioGroupItem value="yearly">
    Yearly Billing 
    <Badge>Save up to 20%</Badge>
  </RadioGroupItem>
</RadioGroup>
```

### **Savings Display:**
Show annual savings to encourage yearly subscriptions:
```tsx
{plan.price_yearly && (
  <Badge variant="success">
    Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(0)}/year
  </Badge>
)}
```

---

## 📚 **Related Documentation:**

- `PRODUCT_FEATURES.md` - Lines 151-158 (Subscription Plans)
- `SUBSCRIPTION_PLANS_DISPLAY_FIX.md` - Previous fix for column mapping
- `SESSION_FIXES_SUMMARY.md` - Overall session summary

---

**Date Fixed:** September 30, 2025  
**Issue:** Missing yearly subscription pricing  
**Status:** ✅ **COMPLETE**

**Run the SQL script and refresh to see both monthly and yearly pricing!** 🎉

