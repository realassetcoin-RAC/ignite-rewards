CREATE OR REPLACE FUNCTION generate_loyalty_number(email_input TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
  user_initial TEXT;
BEGIN
  -- Get user initial from email or use 'U' as default
  IF email_input IS NOT NULL THEN
    user_initial := UPPER(LEFT(email_input, 1));
  ELSE
    user_initial := 'U';
  END IF;
  
  LOOP
    new_number := user_initial || LPAD(counter::text, 7, '0');
    
    -- Check if this number already exists in user_loyalty_cards table
    IF NOT EXISTS (
      SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = new_number
    ) THEN
      RETURN new_number;
    END IF;
    
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 9999999 THEN
      RAISE EXCEPTION 'Unable to generate unique loyalty number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
