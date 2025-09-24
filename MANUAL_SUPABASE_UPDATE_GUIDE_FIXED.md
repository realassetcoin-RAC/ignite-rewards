# Manual Supabase Database Update Guide (FIXED)

## 🎯 Objective
Update the cloud Supabase database with merchant subscription plans and loyalty NFT cards as per cursor rules specifications.

## ⚠️ IMPORTANT: Use the FIXED Script
**Use**: `update_cloud_supabase_data_fixed.sql` (NOT the original script)

## 🔧 What Was Fixed
- **Column name mismatch**: Updated to match existing `merchant_subscription_plans` table structure
- **Removed**: `plan_number` from INSERT (auto-generated)
- **Updated**: Column names to match existing schema
- **Fixed**: JSONB format for features array

## 📋 What Needs to be Updated

### 1. Merchant Subscription Plans (5 plans)
- **StartUp Plan** - $20/month ($150/year) - 100 points, 100 transactions
- **Momentum Plan** - $50/month ($500/year) - 300 points, 300 transactions (Popular)
- **Energizer Plan** - $100/month ($1000/year) - 600 points, 600 transactions
- **Cloud Plan** - $250/month ($2500/year) - 1800 points, 1800 transactions
- **Super Plan** - $500/month ($5000/year) - 4000 points, 4000 transactions

### 2. Loyalty NFT Cards (12 cards)
- **6 Custodial NFTs** (Free for custodial users)
- **6 Non-Custodial NFTs** (For external wallet users)

## 🚀 Manual Execution Steps

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### Step 2: Execute the FIXED SQL Script
1. **Copy the content** from `update_cloud_supabase_data_fixed.sql`
2. **Paste it** into the SQL Editor
3. **Click "Run"** to execute the script

### Step 3: Verify the Results
After execution, you should see:
- ✅ **5 merchant subscription plans** inserted
- ✅ **12 NFT types** inserted (6 custodial + 6 non-custodial)
- ✅ **Verification queries** showing the counts

## 📊 Expected Results

### Merchant Subscription Plans
```
plan_number | name            | price_monthly | price_yearly | monthly_points | monthly_transactions | popular
1          | StartUp Plan    | 20.00         | 150.00       | 100            | 100                  | false
2          | Momentum Plan   | 50.00         | 500.00       | 300            | 300                  | true
3          | Energizer Plan  | 100.00        | 1000.00      | 600            | 600                  | false
4          | Cloud Plan      | 250.00        | 2500.00      | 1800           | 1800                 | false
5          | Super Plan      | 500.00        | 5000.00      | 4000           | 4000                 | false
```

### NFT Types Summary
```
Collection | Custodial | Non-Custodial | Total
Classic    | 3         | 3             | 6
Premium    | 2         | 2             | 4
Elite      | 1         | 1             | 2
Total      | 6         | 6             | 12
```

## ✅ Verification Queries

After running the script, you can run these queries to verify:

```sql
-- Check merchant subscription plans
SELECT COUNT(*) as total_plans FROM public.merchant_subscription_plans;

-- Check NFT types
SELECT 
    COUNT(*) as total_nfts,
    COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
    COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts
FROM public.nft_types;

-- Show all plans
SELECT name, price_monthly, monthly_points, popular 
FROM public.merchant_subscription_plans 
ORDER BY plan_number;
```

## 🎉 Success Indicators

- ✅ Script executes without errors
- ✅ 5 merchant subscription plans created
- ✅ 12 NFT types created (6 custodial + 6 non-custodial)
- ✅ All data matches cursor rules specifications
- ✅ Verification queries return expected counts

## 📞 Support

If you encounter any issues:
1. **Make sure you're using the FIXED script**: `update_cloud_supabase_data_fixed.sql`
2. Check the Supabase dashboard for error messages
3. Verify your database connection
4. Ensure you have the necessary permissions

---

**Note**: After successful execution, the application will automatically use the real database data instead of mock data for NFT types.
