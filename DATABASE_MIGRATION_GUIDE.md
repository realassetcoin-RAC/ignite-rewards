# Database Migration Guide for NFT Types

## Overview
The Virtual Card Manager needs the `nft_types` table to have all the required fields. This guide will help you update your database schema.

## Option 1: Manual SQL Migration (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Run the Migration SQL
Copy and paste the entire contents of `nft_types_complete_migration.sql` into the SQL editor and execute it.

### Step 3: Verify the Migration
Run this query to verify all fields are present:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see these fields:
- `id` (uuid)
- `nft_name` (character varying)
- `display_name` (character varying)
- `description` (text)
- `image_url` (text)
- `buy_price_usdt` (numeric)
- `rarity` (character varying)
- `mint_quantity` (integer)
- `is_upgradeable` (boolean)
- `is_evolvable` (boolean)
- `is_fractional_eligible` (boolean)
- `is_custodial` (boolean)
- `auto_staking_duration` (character varying)
- `earn_on_spend_ratio` (numeric)
- `upgrade_bonus_ratio` (numeric)
- `evolution_min_investment` (numeric)
- `evolution_earnings_ratio` (numeric)
- `passive_income_rate` (numeric)
- `custodial_income_rate` (numeric)
- `is_active` (boolean)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `features` (jsonb)
- `subscription_plan` (character varying)
- `pricing_type` (character varying)
- `one_time_fee` (numeric)
- `monthly_fee` (numeric)
- `annual_fee` (numeric)

## Option 2: Automated Migration Script

### Prerequisites
Make sure you have these environment variables set:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Run the Script
```bash
node apply_nft_migration.js
```

## Option 3: Quick Field Addition

If you just need to add the missing fields to an existing table:

```sql
-- Add missing fields
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS one_time_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records
UPDATE public.nft_types 
SET display_name = nft_name 
WHERE display_name IS NULL OR display_name = '';

UPDATE public.nft_types 
SET description = 'NFT Loyalty Card'
WHERE description IS NULL;
```

## Testing the Migration

After running the migration, test it by:

1. **Restart your development server**
2. **Go to Admin Dashboard → Virtual Cards**
3. **Click "Add New Loyalty Card"**
4. **Fill out the form with all the new fields**
5. **Submit the form**

If successful, you should see:
- ✅ No database errors
- ✅ All form fields working
- ✅ Data saved successfully
- ✅ Card appears in the list

## Troubleshooting

### Error: "column does not exist"
- Run the migration SQL again
- Check that all fields were added

### Error: "permission denied"
- Make sure you're using the service role key
- Check RLS policies are set correctly

### Error: "table does not exist"
- Run the complete migration SQL
- Check table name is `nft_types` (not `virtual_cards`)

### Form fields not showing
- Clear browser cache
- Restart development server
- Check browser console for errors

## What This Migration Does

1. **Creates the `nft_types` table** with all required fields
2. **Adds missing fields** like `passive_income_rate`, `custodial_income_rate`
3. **Sets up proper indexes** for performance
4. **Creates RLS policies** for security
5. **Adds sample data** for testing
6. **Sets up triggers** for automatic timestamp updates

## Next Steps

After successful migration:
1. Test creating a new loyalty card
2. Verify all fields save correctly
3. Test editing existing cards
4. Check that the full-page layout works properly

The Virtual Card Manager should now work perfectly with all the new NFT fields! 🎉







