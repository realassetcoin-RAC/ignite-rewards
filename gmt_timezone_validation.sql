-- GMT Timezone Validation for Referral Campaigns
-- This script adds server-side validation and automatic timezone conversion to GMT

-- 1. Create function to validate and convert dates to GMT
CREATE OR REPLACE FUNCTION public.validate_and_convert_to_gmt(
  input_date TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Convert the input date to GMT (UTC)
  -- This ensures all campaign dates are stored in GMT regardless of input timezone
  RETURN input_date AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- 2. Create function to validate campaign dates are in GMT
CREATE OR REPLACE FUNCTION public.validate_campaign_dates_gmt(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if end date is after start date
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;
  
  -- Check if dates are not in the past (for new campaigns)
  IF p_start_date < NOW() THEN
    RAISE EXCEPTION 'Start date cannot be in the past';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger function to automatically convert dates to GMT on insert/update
CREATE OR REPLACE FUNCTION public.ensure_campaign_dates_gmt()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert dates to GMT before storing
  NEW.start_date := public.validate_and_convert_to_gmt(NEW.start_date);
  NEW.end_date := public.validate_and_convert_to_gmt(NEW.end_date);
  
  -- Validate the dates
  PERFORM public.validate_campaign_dates_gmt(NEW.start_date, NEW.end_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to enforce GMT conversion on referral_campaigns table
DROP TRIGGER IF EXISTS ensure_gmt_campaign_dates ON public.referral_campaigns;

CREATE TRIGGER ensure_gmt_campaign_dates
  BEFORE INSERT OR UPDATE ON public.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_campaign_dates_gmt();

-- 5. Add comments to explain the GMT enforcement
COMMENT ON FUNCTION public.validate_and_convert_to_gmt(TIMESTAMP WITH TIME ZONE) IS 
'Converts any timezone input to GMT (UTC) for consistent campaign scheduling';

COMMENT ON FUNCTION public.validate_campaign_dates_gmt(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 
'Validates that campaign dates are valid and properly ordered';

COMMENT ON FUNCTION public.ensure_campaign_dates_gmt() IS 
'Trigger function that automatically converts campaign dates to GMT and validates them';

COMMENT ON TRIGGER ensure_gmt_campaign_dates ON public.referral_campaigns IS 
'Ensures all campaign dates are stored in GMT timezone for global consistency';

-- 6. Create function to get campaign dates in GMT format for display
CREATE OR REPLACE FUNCTION public.get_campaign_dates_gmt_display(
  p_campaign_id UUID
)
RETURNS TABLE(
  start_date_gmt TEXT,
  end_date_gmt TEXT,
  start_date_iso TEXT,
  end_date_iso TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(rc.start_date AT TIME ZONE 'UTC', 'DD Mon YYYY HH24:MI') || ' GMT' as start_date_gmt,
    TO_CHAR(rc.end_date AT TIME ZONE 'UTC', 'DD Mon YYYY HH24:MI') || ' GMT' as end_date_gmt,
    rc.start_date::TEXT as start_date_iso,
    rc.end_date::TEXT as end_date_iso
  FROM public.referral_campaigns rc
  WHERE rc.id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Add RLS policy to ensure only admins can manage campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.referral_campaigns;

-- Create a simple admin check function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage campaigns" 
ON public.referral_campaigns 
FOR ALL 
USING (public.check_admin_access());

-- 8. Create function to check if a campaign is currently active (in GMT)
CREATE OR REPLACE FUNCTION public.is_campaign_active_gmt(
  p_campaign_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  campaign_record RECORD;
BEGIN
  SELECT * INTO campaign_record
  FROM public.referral_campaigns
  WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if campaign is active and current time (in GMT) is within the date range
  RETURN campaign_record.is_active 
    AND NOW() AT TIME ZONE 'UTC' >= campaign_record.start_date 
    AND NOW() AT TIME ZONE 'UTC' <= campaign_record.end_date;
END;
$$ LANGUAGE plpgsql;

-- 9. Add helpful comments to the referral_campaigns table
COMMENT ON TABLE public.referral_campaigns IS 
'Referral campaigns with GMT timezone enforcement for global consistency';

COMMENT ON COLUMN public.referral_campaigns.start_date IS 
'Campaign start date stored in GMT timezone';
COMMENT ON COLUMN public.referral_campaigns.end_date IS 
'Campaign end date stored in GMT timezone';

-- 10. Test the functions with sample data (optional - remove in production)
-- This is just to verify the functions work correctly
DO $$
DECLARE
  test_start TIMESTAMP WITH TIME ZONE;
  test_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Test with different timezone inputs
  test_start := '2024-01-01 10:00:00+05:00'::TIMESTAMP WITH TIME ZONE; -- EST
  test_end := '2024-12-31 23:59:59-08:00'::TIMESTAMP WITH TIME ZONE;   -- PST
  
  -- Convert to GMT
  test_start := public.validate_and_convert_to_gmt(test_start);
  test_end := public.validate_and_convert_to_gmt(test_end);
  
  RAISE NOTICE 'Start date converted to GMT: %', test_start;
  RAISE NOTICE 'End date converted to GMT: %', test_end;
  
  -- Validate dates
  IF public.validate_campaign_dates_gmt(test_start, test_end) THEN
    RAISE NOTICE 'Date validation passed';
  END IF;
END $$;
