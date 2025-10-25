-- Verify Loyalty Providers Data with All Columns
-- This script shows all the important data including conversion limits

-- =============================================================================
-- 1. CHECK ALL COLUMNS IN THE TABLE
-- =============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loyalty_providers'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. VERIFY SAMPLE DATA WITH ALL IMPORTANT COLUMNS
-- =============================================================================

SELECT 
  id,
  provider_name,
  description,
  conversion_rate,
  minimum_conversion,
  maximum_conversion,
  is_active,
  requires_phone_verification,
  supported_countries,
  created_at
FROM public.loyalty_providers 
ORDER BY created_at;

-- =============================================================================
-- 3. CHECK SPECIFIC CONVERSION LIMITS
-- =============================================================================

SELECT 
  provider_name,
  conversion_rate,
  minimum_conversion,
  maximum_conversion,
  CASE 
    WHEN minimum_conversion IS NULL THEN '❌ MISSING'
    WHEN maximum_conversion IS NULL THEN '❌ MISSING'
    WHEN minimum_conversion > maximum_conversion THEN '❌ INVALID (min > max)'
    ELSE '✅ VALID'
  END as conversion_limits_status
FROM public.loyalty_providers 
ORDER BY provider_name;

-- =============================================================================
-- 4. SUMMARY OF CONVERSION RULES
-- =============================================================================

SELECT 
  provider_name,
  CONCAT('Convert ', minimum_conversion, ' to ', maximum_conversion, ' points at rate ', conversion_rate) as conversion_rule,
  CASE 
    WHEN requires_phone_verification THEN 'Phone verification required'
    ELSE 'No phone verification needed'
  END as verification_requirement
FROM public.loyalty_providers 
WHERE is_active = true
ORDER BY provider_name;
