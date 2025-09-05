-- Seed Phrase Recovery Enhancement Migration
-- This migration enhances the user_wallets table to better support seed phrase recovery authentication

-- Add recovery metadata to user_wallets table
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS recovery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_recovery_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recovery_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_recovery_attempts INTEGER DEFAULT 5;

-- Create index for faster wallet lookups by address
CREATE INDEX IF NOT EXISTS idx_user_wallets_solana_address ON public.user_wallets(solana_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id_active ON public.user_wallets(user_id, is_active);

-- Create function to validate seed phrase recovery
CREATE OR REPLACE FUNCTION public.validate_seed_phrase_recovery(
  wallet_address TEXT,
  seed_phrase TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  user_id UUID,
  user_email TEXT,
  recovery_attempts INTEGER,
  max_attempts INTEGER
) AS $$
DECLARE
  wallet_record RECORD;
  current_attempts INTEGER;
BEGIN
  -- Find wallet by address
  SELECT 
    uw.*,
    u.email as user_email
  INTO wallet_record
  FROM public.user_wallets uw
  JOIN auth.users u ON uw.user_id = u.id
  WHERE uw.solana_address = wallet_address
    AND uw.is_active = true
    AND uw.recovery_enabled = true;

  -- If wallet not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Check if max attempts exceeded
  IF wallet_record.recovery_attempts >= wallet_record.max_recovery_attempts THEN
    RETURN QUERY SELECT false, wallet_record.user_id, wallet_record.user_email, 
                        wallet_record.recovery_attempts, wallet_record.max_recovery_attempts;
    RETURN;
  END IF;

  -- Validate seed phrase (simple base64 comparison for now)
  -- In production, you'd want more sophisticated validation
  IF wallet_record.encrypted_seed_phrase = encode(convert_to(seed_phrase, 'UTF8'), 'base64') THEN
    -- Reset recovery attempts on successful validation
    UPDATE public.user_wallets 
    SET recovery_attempts = 0,
        last_recovery_used = now()
    WHERE id = wallet_record.id;
    
    RETURN QUERY SELECT true, wallet_record.user_id, wallet_record.user_email, 
                       0, wallet_record.max_recovery_attempts;
  ELSE
    -- Increment failed attempts
    UPDATE public.user_wallets 
    SET recovery_attempts = recovery_attempts + 1
    WHERE id = wallet_record.id;
    
    RETURN QUERY SELECT false, wallet_record.user_id, wallet_record.user_email, 
                       wallet_record.recovery_attempts + 1, wallet_record.max_recovery_attempts;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create recovery session
CREATE OR REPLACE FUNCTION public.create_recovery_session(
  p_user_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE(
  session_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  token TEXT;
  expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate a secure token
  token := encode(gen_random_bytes(32), 'hex');
  expires := now() + interval '1 hour';
  
  -- Store session in a temporary table or use Supabase's built-in session management
  -- For now, we'll return the token and let the application handle session creation
  
  RETURN QUERY SELECT token, expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log for recovery attempts
CREATE TABLE IF NOT EXISTS public.recovery_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL, -- 'attempt', 'success', 'failure', 'blocked'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for recovery audit log
ALTER TABLE public.recovery_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for recovery audit log
CREATE POLICY "Users can view their own recovery logs" 
ON public.recovery_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert recovery logs" 
ON public.recovery_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to log recovery attempts
CREATE OR REPLACE FUNCTION public.log_recovery_attempt(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.recovery_audit_log (
    user_id,
    wallet_address,
    action,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_wallet_address,
    p_action,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing wallets to have recovery enabled
UPDATE public.user_wallets 
SET recovery_enabled = true,
    max_recovery_attempts = 5
WHERE recovery_enabled IS NULL;

-- Add comment explaining the recovery system
COMMENT ON TABLE public.user_wallets IS 'User wallets with seed phrase recovery capabilities for email bypass authentication';
COMMENT ON COLUMN public.user_wallets.recovery_enabled IS 'Whether seed phrase recovery is enabled for this wallet';
COMMENT ON COLUMN public.user_wallets.last_recovery_used IS 'Timestamp of last successful recovery attempt';
COMMENT ON COLUMN public.user_wallets.recovery_attempts IS 'Number of failed recovery attempts since last success';
COMMENT ON COLUMN public.user_wallets.max_recovery_attempts IS 'Maximum allowed recovery attempts before lockout';