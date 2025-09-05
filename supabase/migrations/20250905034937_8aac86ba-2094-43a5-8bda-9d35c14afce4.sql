-- Create user_loyalty_cards table and generate_loyalty_number function

CREATE TABLE public.user_loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loyalty_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_loyalty_cards
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_loyalty_cards
CREATE POLICY "Users can view their own loyalty card" 
ON public.user_loyalty_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty card" 
ON public.user_loyalty_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty card" 
ON public.user_loyalty_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate loyalty numbers
CREATE OR REPLACE FUNCTION public.generate_loyalty_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loyalty_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 12-digit loyalty number
    loyalty_num := 'LY' || lpad(floor(random() * 1000000000)::text, 10, '0');
    
    -- Check if number already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.user_loyalty_cards 
    WHERE loyalty_number = loyalty_num;
    
    -- Exit loop if number is unique
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN loyalty_num;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_user_loyalty_cards_updated_at
  BEFORE UPDATE ON public.user_loyalty_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();