-- Automated Referral Settlement System
-- This script creates automated functions for referral settlements

-- Create or replace the referral settlement function
CREATE OR REPLACE FUNCTION public.process_referral_settlements()
RETURNS TABLE (
    processed_count INTEGER,
    total_rewards_awarded INTEGER,
    settlement_summary TEXT
) AS $$
DECLARE
    v_referral RECORD;
    v_campaign RECORD;
    v_processed_count INTEGER := 0;
    v_total_rewards INTEGER := 0;
    v_summary TEXT := '';
BEGIN
    -- Get the current active campaign
    SELECT * INTO v_campaign
    FROM public.referral_campaigns
    WHERE is_active = true
      AND now() BETWEEN start_date AND end_date
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no active campaign, return early
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 'No active referral campaign found'::TEXT;
        RETURN;
    END IF;

    -- Process all pending referrals that meet settlement criteria
    FOR v_referral IN
        SELECT ur.*
        FROM public.user_referrals ur
        WHERE ur.status = 'pending'
          AND ur.referred_user_id IS NOT NULL
          AND ur.completed_at IS NOT NULL
          -- Settlement criteria: referred user has completed their first transaction
          AND EXISTS (
              SELECT 1 FROM public.loyalty_transactions lt
              WHERE lt.user_id = ur.referred_user_id
                AND lt.status = 'completed'
                AND lt.created_at >= ur.created_at
          )
    LOOP
        -- Update referral status to rewarded
        UPDATE public.user_referrals
        SET 
            status = 'rewarded',
            reward_points = COALESCE(v_campaign.reward_points, v_referral.reward_points, 10),
            rewarded_at = now(),
            completed_at = COALESCE(completed_at, now())
        WHERE id = v_referral.id;

        -- Award points to the referrer
        INSERT INTO public.user_points (
            user_id,
            points,
            point_type,
            source,
            source_id,
            description,
            created_at
        ) VALUES (
            v_referral.referrer_id,
            COALESCE(v_campaign.reward_points, v_referral.reward_points, 10),
            'referral',
            'referral_settlement',
            v_referral.id,
            'Referral reward for user: ' || v_referral.referred_user_id,
            now()
        );

        v_processed_count := v_processed_count + 1;
        v_total_rewards := v_total_rewards + COALESCE(v_campaign.reward_points, v_referral.reward_points, 10);
    END LOOP;

    -- Create summary
    v_summary := 'Processed ' || v_processed_count || ' referrals, awarded ' || v_total_rewards || ' total points';

    RETURN QUERY SELECT v_processed_count, v_total_rewards, v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check referral completion criteria
CREATE OR REPLACE FUNCTION public.check_referral_completion_criteria(p_referred_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_completed_transaction BOOLEAN := FALSE;
    v_has_verified_account BOOLEAN := FALSE;
    v_has_minimum_activity BOOLEAN := FALSE;
BEGIN
    -- Check if user has completed at least one transaction
    SELECT EXISTS(
        SELECT 1 FROM public.loyalty_transactions
        WHERE user_id = p_referred_user_id
          AND status = 'completed'
          AND amount > 0
    ) INTO v_has_completed_transaction;

    -- Check if user has verified their account (if applicable)
    SELECT EXISTS(
        SELECT 1 FROM auth.users
        WHERE id = p_referred_user_id
          AND email_confirmed_at IS NOT NULL
    ) INTO v_has_verified_account;

    -- Check if user has minimum activity (e.g., profile completion, first login)
    SELECT EXISTS(
        SELECT 1 FROM api.profiles
        WHERE id = p_referred_user_id
          AND full_name IS NOT NULL
          AND full_name != ''
    ) INTO v_has_minimum_activity;

    -- Return true if all criteria are met
    RETURN v_has_completed_transaction AND v_has_verified_account AND v_has_minimum_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically process referrals when criteria are met
CREATE OR REPLACE FUNCTION public.auto_process_referral_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_referral RECORD;
    v_campaign RECORD;
BEGIN
    -- Only process if this is a completed transaction
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Find pending referrals for this user
        FOR v_referral IN
            SELECT ur.*
            FROM public.user_referrals ur
            WHERE ur.referred_user_id = NEW.user_id
              AND ur.status = 'pending'
              AND ur.completed_at IS NULL
        LOOP
            -- Check if completion criteria are met
            IF public.check_referral_completion_criteria(NEW.user_id) THEN
                -- Get active campaign
                SELECT * INTO v_campaign
                FROM public.referral_campaigns
                WHERE is_active = true
                  AND now() BETWEEN start_date AND end_date
                ORDER BY created_at DESC
                LIMIT 1;

                -- Update referral status
                UPDATE public.user_referrals
                SET 
                    status = 'completed',
                    completed_at = now()
                WHERE id = v_referral.id;

                -- Award points to referrer
                INSERT INTO public.user_points (
                    user_id,
                    points,
                    point_type,
                    source,
                    source_id,
                    description,
                    created_at
                ) VALUES (
                    v_referral.referrer_id,
                    COALESCE(v_campaign.reward_points, v_referral.reward_points, 10),
                    'referral',
                    'referral_auto_settlement',
                    v_referral.id,
                    'Automatic referral reward for completed user: ' || NEW.user_id,
                    now()
                );

                -- Update referral to rewarded status
                UPDATE public.user_referrals
                SET 
                    status = 'rewarded',
                    reward_points = COALESCE(v_campaign.reward_points, v_referral.reward_points, 10),
                    rewarded_at = now()
                WHERE id = v_referral.id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on loyalty_transactions table
DROP TRIGGER IF EXISTS trigger_auto_process_referral ON public.loyalty_transactions;
CREATE TRIGGER trigger_auto_process_referral
    AFTER INSERT OR UPDATE ON public.loyalty_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_process_referral_on_completion();

-- Create a scheduled job function (requires pg_cron extension)
-- This would run daily to process any missed settlements
CREATE OR REPLACE FUNCTION public.scheduled_referral_settlement()
RETURNS VOID AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Process settlements
    SELECT * INTO v_result FROM public.process_referral_settlements();
    
    -- Log the results
    INSERT INTO public.system_logs (
        log_level,
        log_message,
        log_data,
        created_at
    ) VALUES (
        'INFO',
        'Scheduled referral settlement completed',
        json_build_object(
            'processed_count', v_result.processed_count,
            'total_rewards', v_result.total_rewards_awarded,
            'summary', v_result.settlement_summary
        ),
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_referral_settlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_referral_completion_criteria(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.scheduled_referral_settlement() TO authenticated;

-- Create a view for referral settlement monitoring
CREATE OR REPLACE VIEW public.referral_settlement_status AS
SELECT 
    ur.id,
    ur.referrer_id,
    ur.referred_user_id,
    ur.status,
    ur.reward_points,
    ur.created_at,
    ur.completed_at,
    ur.rewarded_at,
    rc.name as campaign_name,
    rc.reward_points as campaign_reward_points,
    CASE 
        WHEN ur.status = 'pending' AND ur.referred_user_id IS NOT NULL THEN
            CASE 
                WHEN public.check_referral_completion_criteria(ur.referred_user_id) THEN 'Ready for Settlement'
                ELSE 'Pending Completion'
            END
        WHEN ur.status = 'completed' THEN 'Completed - Ready for Reward'
        WHEN ur.status = 'rewarded' THEN 'Settled'
        ELSE 'Unknown Status'
    END as settlement_status
FROM public.user_referrals ur
LEFT JOIN public.referral_campaigns rc ON ur.campaign_id = rc.id
ORDER BY ur.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.referral_settlement_status TO authenticated;

-- Verify the setup
SELECT 'Referral settlement automation setup completed successfully' as status;
