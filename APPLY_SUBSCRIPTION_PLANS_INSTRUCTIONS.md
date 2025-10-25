# 📋 How to Apply Subscription Plans Yearly Pricing

## ⚠️ **Important: Database Column Missing**

The `price_yearly` column doesn't exist in the `merchant_subscription_plans` table yet. You need to run the SQL script in Supabase to add it.

---

## 🔧 **Step-by-Step Instructions:**

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** button

### **Step 2: Copy and Paste SQL Script**

1. Open the file: `fix_subscription_plans_complete.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor (Ctrl+V)

### **Step 3: Run the Script**

1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for the script to complete
3. You should see success messages in the Results panel

### **Step 4: Verify the Changes**

Run this verification query in SQL Editor:

```sql
SELECT 
    plan_name,
    display_name,
    price AS monthly_price,
    price_yearly AS yearly_price,
    max_transactions,
    max_points_distribution AS monthly_points,
    is_active
FROM public.merchant_subscription_plans
ORDER BY price ASC;
```

**Expected Results:**
```
plan_name  | monthly_price | yearly_price | max_transactions | monthly_points
-----------|---------------|--------------|------------------|---------------
StartUp    | 20.00         | 150.00       | 100              | 100
Momentum   | 50.00         | 500.00       | 300              | 300
Energizer  | 100.00        | 1000.00      | 600              | 600
Cloud      | 250.00        | 2500.00      | 1800             | 1800
Super      | 500.00        | 5000.00      | 4000             | 4000
```

### **Step 5: Refresh Browser**

1. Go back to your application
2. Hard refresh: **Ctrl + Shift + R**
3. Navigate to: **Admin Panel → Merchants → Subscription Plans**
4. You should now see both monthly and yearly pricing!

---

## 📸 **What You Should See:**

After applying the fix, the Subscription Plans section will show:

```
┌──────────────────────────────────────────────────────────┐
│ StartUp Plan                                             │
│ Basic loyalty, email support                             │
│                                                          │
│ $20.00/mo                                               │
│ $150.00/yr  ← YEARLY PRICE (in primary color)          │
│                                                          │
│ 100 points, 100 txns                                    │
└──────────────────────────────────────────────────────────┘
```

---

## ❓ **Troubleshooting:**

### **Error: "permission denied for table merchant_subscription_plans"**
- You need to be logged in as a Supabase admin
- Use the Service Role key instead of Anon key (if available)

### **Error: "column price_yearly already exists"**
- The column was already added
- Skip to Step 4 to verify the data

### **Plans still showing $NaN/mo**
1. Make sure the script ran successfully
2. Check that `price` and `price_yearly` columns have values
3. Hard refresh browser (Ctrl+Shift+R)
4. Clear browser cache if needed

### **Yearly pricing not showing**
1. Verify `price_yearly` column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'merchant_subscription_plans' 
   AND column_name = 'price_yearly';
   ```
2. Check if values are set:
   ```sql
   SELECT plan_name, price_yearly 
   FROM merchant_subscription_plans;
   ```

---

## 🎯 **Quick Summary:**

1. ✅ Open Supabase Dashboard → SQL Editor
2. ✅ Copy `fix_subscription_plans_complete.sql`
3. ✅ Paste and Run in SQL Editor
4. ✅ Verify with SELECT query
5. ✅ Refresh browser (Ctrl+Shift+R)
6. ✅ Check Admin Panel → Subscription Plans

---

## 📚 **Files Reference:**

- **SQL Script:** `fix_subscription_plans_complete.sql`
- **Documentation:** `SUBSCRIPTION_PLANS_YEARLY_FIX.md`
- **Product Specs:** `PRODUCT_FEATURES.md` (lines 151-158)

---

**Once applied, all subscription plans will show both monthly and yearly pricing according to the product specifications!** 🎉

