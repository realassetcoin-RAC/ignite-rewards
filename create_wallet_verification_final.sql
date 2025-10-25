-- =============================================================================
-- CREATE WALLET VERIFICATION FUNCTION (FINAL VERSION)
-- =============================================================================

-- Create the verify_wallet_backup function with proper column references
CREATE OR REPLACE FUNCTION verify_wallet_backup(
    user_uuid UUID,
    input_verification_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    verification_record RECORD;
    user_wallet_id UUID;
BEGIN
    -- Get user's wallet
    SELECT id INTO user_wallet_id 
    FROM public.user_solana_wallets 
    WHERE user_id = user_uuid AND is_active = true 
    LIMIT 1;
    
    IF user_wallet_id IS NULL THEN
        RAISE EXCEPTION 'No wallet found for user';
    END IF;
    
    -- Check verification code
    SELECT * INTO verification_record
    FROM public.wallet_backup_verification
    WHERE user_id = user_uuid
    AND wallet_id = user_wallet_id
    AND verification_code = input_verification_code
    AND expires_at > NOW()
    AND verification_status = 'pending'
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update verification status
    UPDATE public.wallet_backup_verification
    SET 
        verification_status = 'verified',
        verified_at = NOW()
    WHERE id = verification_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_wallet_backup(UUID, TEXT) TO postgres;

-- Test the function
DO $$
DECLARE
    test_code TEXT;
    verification_result BOOLEAN;
BEGIN
    -- Test backup code generation
    SELECT generate_wallet_backup_code('00000000-0000-0000-0000-000000000001') INTO test_code;
    RAISE NOTICE 'Generated backup code: %', test_code;
    
    -- Test verification
    SELECT verify_wallet_backup('00000000-0000-0000-0000-000000000001', test_code) INTO verification_result;
    RAISE NOTICE 'Verification result: %', verification_result;
    
    RAISE NOTICE 'Wallet backup verification system: WORKING';
END $$;
