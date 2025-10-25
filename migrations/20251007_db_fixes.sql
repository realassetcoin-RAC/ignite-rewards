-- Loyalty number trigger for user_loyalty_cards
CREATE OR REPLACE FUNCTION public.set_user_loyalty_cards_loyalty_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.loyalty_number IS NULL OR NEW.loyalty_number = '' THEN
    NEW.loyalty_number := generate_loyalty_number(COALESCE(NEW.email, 'U@example.com'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_user_loyalty_cards_loyalty_number'
  ) THEN
    CREATE TRIGGER trg_set_user_loyalty_cards_loyalty_number
    BEFORE INSERT ON public.user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_loyalty_cards_loyalty_number();
  END IF;
END $$;

-- Referral campaigns: add/sync campaign_name for compatibility
ALTER TABLE public.referral_campaigns
  ADD COLUMN IF NOT EXISTS campaign_name TEXT;

UPDATE public.referral_campaigns
SET campaign_name = COALESCE(campaign_name, name)
WHERE name IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_referral_campaign_name()
RETURNS trigger AS $$
BEGIN
  NEW.campaign_name := COALESCE(NEW.campaign_name, NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_referral_campaign_name'
  ) THEN
    CREATE TRIGGER trg_sync_referral_campaign_name
    BEFORE INSERT OR UPDATE ON public.referral_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_referral_campaign_name();
  END IF;
END $$;

ALTER TABLE public.referral_campaigns
  ALTER COLUMN campaign_name SET NOT NULL;


