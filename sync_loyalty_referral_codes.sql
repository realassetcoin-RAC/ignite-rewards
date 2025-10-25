-- =============================================================================
-- SYNC LOYALTY NUMBERS WITH REFERRAL CODES
-- =============================================================================
-- This script ensures that loyalty numbers and referral codes are always the same

-- =============================================================================
-- 1. CREATE FUNCTION TO SYNC LOYALTY NUMBER TO PROFILES
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_loyalty_referral_code(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    loyalty_number TEXT;
BEGIN
    -- Get the user's loyalty number
    SELECT ulc.loyalty_number INTO loyalty_number
    FROM user_loyalty_cards ulc
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = true
    LIMIT 1;
    
    IF loyalty_number IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the profile with the loyalty number as referral code
    UPDATE profiles 
    SET loyalty_card_number = loyalty_number
    WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. CREATE TRIGGER TO AUTO-SYNC ON LOYALTY CARD CHANGES
-- =============================================================================

-- Create function for trigger
CREATE OR REPLACE FUNCTION trigger_sync_loyalty_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync the loyalty number to profiles table
    PERFORM sync_loyalty_referral_code(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_loyalty_cards
DROP TRIGGER IF EXISTS trigger_sync_loyalty_referral_code ON user_loyalty_cards;
CREATE TRIGGER trigger_sync_loyalty_referral_code
    AFTER INSERT OR UPDATE ON user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_loyalty_referral_code();

-- =============================================================================
-- 3. SYNC EXISTING DATA
-- =============================================================================

-- Sync existing loyalty cards with profiles
DO $$
DECLARE
    user_record RECORD;
    synced_count INTEGER := 0;
BEGIN
    -- Loop through all users with loyalty cards
    FOR user_record IN 
        SELECT DISTINCT ulc.user_id, ulc.loyalty_number
        FROM user_loyalty_cards ulc
        WHERE ulc.is_active = true
    LOOP
        -- Update profile with loyalty number
        UPDATE profiles 
        SET loyalty_card_number = user_record.loyalty_number
        WHERE id = user_record.user_id;
        
        synced_count := synced_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Synced % loyalty cards with profiles', synced_count;
END $$;

-- =============================================================================
-- 4. CREATE FUNCTION TO GET UNIFIED REFERRAL CODE
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    referral_code TEXT;
BEGIN
    -- First try to get from loyalty card
    SELECT ulc.loyalty_number INTO referral_code
    FROM user_loyalty_cards ulc
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = true
    LIMIT 1;
    
    -- If not found, try to get from profile
    IF referral_code IS NULL THEN
        SELECT p.loyalty_card_number INTO referral_code
        FROM profiles p
        WHERE p.id = user_uuid;
    END IF;
    
    -- If still not found, generate a fallback
    IF referral_code IS NULL THEN
        referral_code := 'REF' || UPPER(SUBSTRING(user_uuid::TEXT, 1, 8));
    END IF;
    
    RETURN referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION sync_loyalty_referral_code(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_user_referral_code(UUID) TO postgres;

-- =============================================================================
-- 6. VERIFY SYNC
-- =============================================================================

-- Check that loyalty numbers and referral codes are now synchronized
SELECT 
    'SYNC VERIFICATION' as info,
    ulc.user_id,
    ulc.loyalty_number as loyalty_card_number,
    p.loyalty_card_number as profile_referral_code,
    CASE 
        WHEN ulc.loyalty_number = p.loyalty_card_number THEN 'SYNCED ✅'
        ELSE 'NOT SYNCED ❌'
    END as sync_status
FROM user_loyalty_cards ulc
JOIN profiles p ON ulc.user_id = p.id
WHERE ulc.is_active = true;

-- =============================================================================
-- 7. TEST THE UNIFIED FUNCTION
-- =============================================================================

-- Test the get_user_referral_code function
SELECT 
    'TEST FUNCTION' as info,
    get_user_referral_code('00000000-0000-0000-0000-000000000001') as referral_code;

-- =============================================================================
-- 8. SUMMARY
-- =============================================================================

DO $$
DECLARE
    loyalty_count INTEGER;
    profile_count INTEGER;
    synced_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO loyalty_count FROM user_loyalty_cards WHERE is_active = true;
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE loyalty_card_number IS NOT NULL;
    
    SELECT COUNT(*) INTO synced_count
    FROM user_loyalty_cards ulc
    JOIN profiles p ON ulc.user_id = p.id
    WHERE ulc.is_active = true 
    AND ulc.loyalty_number = p.loyalty_card_number;
    
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'LOYALTY-REFERRAL CODE SYNC COMPLETE';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Active loyalty cards: %', loyalty_count;
    RAISE NOTICE 'Profiles with referral codes: %', profile_count;
    RAISE NOTICE 'Synchronized records: %', synced_count;
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '- sync_loyalty_referral_code(user_uuid)';
    RAISE NOTICE '- get_user_referral_code(user_uuid)';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Trigger created:';
    RAISE NOTICE '- trigger_sync_loyalty_referral_code (auto-sync on loyalty card changes)';
    RAISE NOTICE '===============================================================================';
END $$;
