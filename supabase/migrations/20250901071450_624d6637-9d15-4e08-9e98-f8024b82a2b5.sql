-- Create user loyalty cards table
CREATE TABLE api.user_loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loyalty_number VARCHAR(8) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table for loyalty point distributions
CREATE TABLE api.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  loyalty_number VARCHAR(8) NOT NULL REFERENCES api.user_loyalty_cards(loyalty_number) ON DELETE CASCADE,
  transaction_amount DECIMAL(10,2) NOT NULL,
  transaction_reference VARCHAR(50) NOT NULL UNIQUE,
  reward_points INTEGER NOT NULL DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create QR codes table for transaction QR codes
CREATE TABLE api.transaction_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL UNIQUE,
  transaction_amount DECIMAL(10,2) NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by_loyalty_number VARCHAR(8) REFERENCES api.user_loyalty_cards(loyalty_number),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE api.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.transaction_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_loyalty_cards
CREATE POLICY "Users can view their own loyalty cards" 
ON api.user_loyalty_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loyalty cards" 
ON api.user_loyalty_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty cards" 
ON api.user_loyalty_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view loyalty cards for their transactions"
ON api.user_loyalty_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.user_id = auth.uid()
  )
);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Merchants can view their own transactions" 
ON api.loyalty_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = merchant_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can create transactions" 
ON api.loyalty_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = merchant_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view transactions for their loyalty cards"
ON api.loyalty_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM api.user_loyalty_cards ulc
    WHERE ulc.loyalty_number = loyalty_transactions.loyalty_number 
    AND ulc.user_id = auth.uid()
  )
);

-- RLS Policies for transaction_qr_codes
CREATE POLICY "Merchants can manage their QR codes" 
ON api.transaction_qr_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = merchant_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active QR codes for scanning"
ON api.transaction_qr_codes
FOR SELECT
USING (is_used = false AND expires_at > now());

-- Create indexes for better performance
CREATE INDEX idx_loyalty_cards_user_id ON api.user_loyalty_cards(user_id);
CREATE INDEX idx_loyalty_cards_loyalty_number ON api.user_loyalty_cards(loyalty_number);
CREATE INDEX idx_transactions_merchant_id ON api.loyalty_transactions(merchant_id);
CREATE INDEX idx_transactions_loyalty_number ON api.loyalty_transactions(loyalty_number);
CREATE INDEX idx_transactions_date ON api.loyalty_transactions(transaction_date);
CREATE INDEX idx_qr_codes_merchant_id ON api.transaction_qr_codes(merchant_id);
CREATE INDEX idx_qr_codes_expires_at ON api.transaction_qr_codes(expires_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_loyalty_cards_updated_at
BEFORE UPDATE ON api.user_loyalty_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_qr_codes_updated_at
BEFORE UPDATE ON api.transaction_qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate loyalty number with user's initial
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT)
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
    initial CHAR(1);
    random_digits VARCHAR(7);
    loyalty_number VARCHAR(8);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Get the first character of the email as initial
    initial := UPPER(LEFT(user_email, 1));
    
    -- Generate unique loyalty number
    LOOP
        -- Generate 7 random digits
        random_digits := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        loyalty_number := initial || random_digits;
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM api.user_loyalty_cards WHERE loyalty_number = loyalty_number) THEN
            RETURN loyalty_number;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;