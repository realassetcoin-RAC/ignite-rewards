-- Add missing columns to nft_types table for product rules compliance
-- Run this SQL in your PostgreSQL database

-- Add mint_quantity column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS mint_quantity INTEGER DEFAULT 1000;

-- Add is_upgradeable column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT true;

-- Add is_evolvable column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT true;

-- Add is_fractional_eligible column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT false;

-- Add auto_staking_duration column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS auto_staking_duration TEXT DEFAULT 'Forever';

-- Add passive_income_rate column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS passive_income_rate DECIMAL(5,4) DEFAULT 0.01;

-- Add custodial_income_rate column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS custodial_income_rate DECIMAL(5,4) DEFAULT 0;

-- Add collection_id column
ALTER TABLE nft_types ADD COLUMN IF NOT EXISTS collection_id UUID;

-- Update existing records with correct product rule values
UPDATE nft_types SET 
  mint_quantity = 10000,
  is_upgradeable = true,
  is_evolvable = true,
  is_fractional_eligible = false,
  auto_staking_duration = 'Forever',
  passive_income_rate = 0.01,
  custodial_income_rate = 0,
  collection_id = NULL
WHERE rarity = 'Common';

UPDATE nft_types SET 
  buy_price_usdt = 100,
  mint_quantity = 3000,
  is_upgradeable = true,
  is_evolvable = true,
  is_fractional_eligible = false,
  auto_staking_duration = 'Forever',
  earn_on_spend_ratio = 0.011,
  upgrade_bonus_ratio = 0.001,
  evolution_min_investment = 500,
  evolution_earnings_ratio = 0.005,
  passive_income_rate = 0.011,
  custodial_income_rate = 0,
  collection_id = NULL
WHERE rarity = 'Less Common';

UPDATE nft_types SET 
  buy_price_usdt = 200,
  mint_quantity = 750,
  is_upgradeable = true,
  is_evolvable = true,
  is_fractional_eligible = false,
  auto_staking_duration = 'Forever',
  earn_on_spend_ratio = 0.012,
  upgrade_bonus_ratio = 0.0015,
  evolution_min_investment = 1000,
  evolution_earnings_ratio = 0.0075,
  passive_income_rate = 0.012,
  custodial_income_rate = 0,
  collection_id = NULL
WHERE rarity = 'Rare';

UPDATE nft_types SET 
  buy_price_usdt = 500,
  mint_quantity = 250,
  is_upgradeable = true,
  is_evolvable = true,
  is_fractional_eligible = false,
  auto_staking_duration = 'Forever',
  earn_on_spend_ratio = 0.014,
  upgrade_bonus_ratio = 0.003,
  evolution_min_investment = 2500,
  evolution_earnings_ratio = 0.0125,
  passive_income_rate = 0.014,
  custodial_income_rate = 0,
  collection_id = NULL
WHERE rarity = 'Very Rare';

-- Verify the updates
SELECT 
  rarity,
  buy_price_usdt,
  mint_quantity,
  ROUND(earn_on_spend_ratio * 100, 2) as earn_on_spend_percent,
  ROUND(upgrade_bonus_ratio * 100, 2) as upgrade_bonus_percent,
  evolution_min_investment,
  ROUND(evolution_earnings_ratio * 100, 2) as evolution_earnings_percent,
  is_upgradeable,
  is_evolvable,
  is_fractional_eligible,
  auto_staking_duration
FROM nft_types 
ORDER BY 
  CASE rarity 
    WHEN 'Common' THEN 1
    WHEN 'Less Common' THEN 2
    WHEN 'Rare' THEN 3
    WHEN 'Very Rare' THEN 4
  END;
