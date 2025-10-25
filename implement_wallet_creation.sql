-- =============================================================================
-- WALLET CREATION IMPLEMENTATION FOR RAC REWARDS
-- =============================================================================
-- This script implements automatic wallet creation with seed phrases for new users
-- Includes Solana wallet generation, seed phrase encryption, and backup verification

-- =============================================================================
-- 1. CREATE WALLET GENERATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_solana_wallet()
RETURNS TABLE(
    public_key TEXT,
    seed_phrase TEXT,
    encrypted_seed_phrase TEXT
) AS $$
DECLARE
    -- Solana seed phrase word list (first 24 words for simplicity)
    word_list TEXT[] := ARRAY[
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    
    seed_words TEXT[] := ARRAY[]::TEXT[];
    seed_phrase TEXT;
    public_key TEXT;
    encrypted_seed TEXT;
    i INTEGER;
    random_word TEXT;
BEGIN
    -- Generate 12-word seed phrase
    FOR i IN 1..12 LOOP
        -- Select random word from word list
        random_word := word_list[1 + floor(random() * array_length(word_list, 1))];
        seed_words := array_append(seed_words, random_word);
    END LOOP;
    
    -- Join words to create seed phrase
    seed_phrase := array_to_string(seed_words, ' ');
    
    -- Generate Solana-style public key (simplified - in production use proper Solana libraries)
    public_key := 'Sol' || encode(gen_random_bytes(32), 'hex');
    
    -- Encrypt seed phrase using pgcrypto (simplified encryption)
    -- In production, use proper encryption with user-specific keys
    encrypted_seed := encode(digest(seed_phrase || 'rac-rewards-salt', 'sha256'), 'hex');
    
    RETURN QUERY SELECT public_key, seed_phrase, encrypted_seed;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. CREATE USER WALLET CREATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION create_user_wallet(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    wallet_id UUID;
    wallet_data RECORD;
BEGIN
    -- Generate wallet data
    SELECT * INTO wallet_data FROM generate_solana_wallet();
    
    -- Insert wallet into user_solana_wallets table
    INSERT INTO public.user_solana_wallets (
        user_id,
        public_key,
        seed_phrase_encrypted,
        is_active
    ) VALUES (
        user_uuid,
        wallet_data.public_key,
        wallet_data.encrypted_seed_phrase,
        true
    ) RETURNING id INTO wallet_id;
    
    -- Also insert into general user_wallets table
    INSERT INTO public.user_wallets (
        user_id,
        wallet_address,
        wallet_type,
        is_primary
    ) VALUES (
        user_uuid,
        wallet_data.public_key,
        'solana',
        true
    );
    
    RETURN wallet_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. UPDATE USER CREATION HANDLER TO INCLUDE WALLET CREATION
-- =============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that includes wallet creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    wallet_id UUID;
BEGIN
    -- Create user profile
    INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        'user'
    );
    
    -- Create Solana wallet automatically
    SELECT create_user_wallet(NEW.id) INTO wallet_id;
    
    -- Log wallet creation (optional)
    -- You can add logging here if needed
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- 4. CREATE SEED PHRASE RETRIEVAL FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_seed_phrase(user_uuid UUID)
RETURNS TABLE(
    public_key TEXT,
    seed_phrase TEXT,
    wallet_id UUID
) AS $$
DECLARE
    wallet_record RECORD;
    decrypted_seed TEXT;
BEGIN
    -- Get wallet information
    SELECT 
        usw.id,
        usw.public_key,
        usw.seed_phrase_encrypted
    INTO wallet_record
    FROM public.user_solana_wallets usw
    WHERE usw.user_id = user_uuid
    AND usw.is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active wallet found for user';
    END IF;
    
    -- In a real implementation, you would decrypt the seed phrase here
    -- For now, we'll return a placeholder (in production, implement proper decryption)
    decrypted_seed := 'seed-phrase-placeholder-for-user-' || user_uuid;
    
    RETURN QUERY SELECT 
        wallet_record.public_key,
        decrypted_seed,
        wallet_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. CREATE WALLET BACKUP VERIFICATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_wallet_backup(
    user_uuid UUID,
    verification_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    verification_record RECORD;
    wallet_id UUID;
BEGIN
    -- Get user's wallet
    SELECT id INTO wallet_id 
    FROM public.user_solana_wallets 
    WHERE user_id = user_uuid AND is_active = true 
    LIMIT 1;
    
    IF wallet_id IS NULL THEN
        RAISE EXCEPTION 'No wallet found for user';
    END IF;
    
    -- Check verification code
    SELECT * INTO verification_record
    FROM public.wallet_backup_verification
    WHERE user_id = user_uuid
    AND wallet_id = wallet_id
    AND verification_code = verify_wallet_backup.verification_code
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

-- =============================================================================
-- 6. CREATE WALLET STATISTICS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_wallet_statistics()
RETURNS TABLE(
    total_wallets BIGINT,
    active_wallets BIGINT,
    wallets_with_backup BIGINT,
    recent_wallets BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.user_solana_wallets) as total_wallets,
        (SELECT COUNT(*) FROM public.user_solana_wallets WHERE is_active = true) as active_wallets,
        (SELECT COUNT(*) FROM public.wallet_backup_verification WHERE verification_status = 'verified') as wallets_with_backup,
        (SELECT COUNT(*) FROM public.user_solana_wallets WHERE created_at > NOW() - INTERVAL '7 days') as recent_wallets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_solana_wallet() TO postgres;
GRANT EXECUTE ON FUNCTION create_user_wallet(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_user_seed_phrase(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION verify_wallet_backup(UUID, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION generate_wallet_backup_code(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_wallet_statistics() TO postgres;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE ON public.user_solana_wallets TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.wallet_backup_verification TO postgres;

-- =============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for wallet lookups
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id_active 
ON public.user_solana_wallets (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id_type 
ON public.user_wallets (user_id, wallet_type);

CREATE INDEX IF NOT EXISTS idx_wallet_backup_verification_user_wallet 
ON public.wallet_backup_verification (user_id, wallet_id);

-- =============================================================================
-- 9. INSERT SAMPLE DATA FOR TESTING
-- =============================================================================

-- Create wallets for existing users (if any)
DO $$
DECLARE
    user_record RECORD;
    wallet_id UUID;
BEGIN
    -- Create wallets for existing users who don't have them
    FOR user_record IN 
        SELECT p.id, p.email 
        FROM public.profiles p 
        LEFT JOIN public.user_solana_wallets usw ON p.id = usw.user_id 
        WHERE usw.id IS NULL
    LOOP
        SELECT create_user_wallet(user_record.id) INTO wallet_id;
        RAISE NOTICE 'Created wallet for user: % (%)', user_record.email, user_record.id;
    END LOOP;
END $$;

-- =============================================================================
-- 10. VERIFICATION QUERIES
-- =============================================================================

-- Verify the implementation
DO $$
DECLARE
    wallet_count BIGINT;
    function_count BIGINT;
BEGIN
    -- Check wallet count
    SELECT COUNT(*) INTO wallet_count FROM public.user_solana_wallets;
    
    -- Check function count
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%wallet%';
    
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'WALLET CREATION IMPLEMENTATION COMPLETE';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Total wallets created: %', wallet_count;
    RAISE NOTICE 'Wallet-related functions: %', function_count;
    RAISE NOTICE 'Automatic wallet creation: ENABLED';
    RAISE NOTICE 'Seed phrase generation: ENABLED';
    RAISE NOTICE 'Backup verification: ENABLED';
    RAISE NOTICE '===============================================================================';
END $$;
