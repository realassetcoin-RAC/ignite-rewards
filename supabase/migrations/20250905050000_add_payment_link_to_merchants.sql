-- Add payment_link_url column to api.merchants if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'api' AND table_name = 'merchants' AND column_name = 'payment_link_url'
  ) THEN
    ALTER TABLE api.merchants ADD COLUMN payment_link_url TEXT;
  END IF;
END $$;

