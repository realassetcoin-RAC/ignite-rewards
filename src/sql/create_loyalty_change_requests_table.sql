-- Create loyalty_change_requests table for DAO governance
-- This table tracks all loyalty application behavior changes that require DAO approval
-- Enforces the rule: "Any changes that change the behavior of the loyalty application must create a DAO record for voting"

CREATE TABLE IF NOT EXISTS public.loyalty_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Change identification
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'point_release_delay',
        'referral_parameters', 
        'nft_earning_ratios',
        'loyalty_network_settings',
        'merchant_limits',
        'inactivity_timeout',
        'sms_otp_settings',
        'subscription_plans',
        'asset_initiative_selection',
        'wallet_management',
        'payment_gateway',
        'email_notifications'
    )),
    
    -- Change details
    parameter_name VARCHAR(100) NOT NULL,
    old_value TEXT NOT NULL, -- JSON string of old value
    new_value TEXT NOT NULL, -- JSON string of new value
    reason TEXT NOT NULL,
    
    -- Governance tracking
    proposed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dao_proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE SET NULL,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    implementation_notes TEXT,
    rollback_plan TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_type ON public.loyalty_change_requests(change_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_status ON public.loyalty_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_proposed_by ON public.loyalty_change_requests(proposed_by);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_dao_proposal ON public.loyalty_change_requests(dao_proposal_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_created_at ON public.loyalty_change_requests(created_at);

-- Enable Row Level Security
ALTER TABLE public.loyalty_change_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for local development, we'll use postgres role)
DROP POLICY IF EXISTS "Users can read all loyalty change requests" ON public.loyalty_change_requests;
CREATE POLICY "Users can read all loyalty change requests" ON public.loyalty_change_requests
    FOR SELECT TO postgres USING (true);

DROP POLICY IF EXISTS "Users can create loyalty change requests" ON public.loyalty_change_requests;
CREATE POLICY "Users can create loyalty change requests" ON public.loyalty_change_requests
    FOR INSERT TO postgres WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update loyalty change requests" ON public.loyalty_change_requests;
CREATE POLICY "Admins can update loyalty change requests" ON public.loyalty_change_requests
    FOR UPDATE TO postgres USING (true);

-- Add loyalty_change_id column to dao_proposals table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dao_proposals' 
        AND column_name = 'loyalty_change_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.dao_proposals 
        ADD COLUMN loyalty_change_id UUID REFERENCES public.loyalty_change_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_dao_proposals_loyalty_change ON public.dao_proposals(loyalty_change_id);
    END IF;
END $$;

-- Insert default data for testing
INSERT INTO public.loyalty_change_requests (
    change_type,
    parameter_name,
    old_value,
    new_value,
    reason,
    proposed_by,
    status
) VALUES (
    'point_release_delay',
    'release_delay_days',
    '30',
    '45',
    'Increase point release delay to allow more time for merchant reversals',
    (SELECT id FROM auth.users LIMIT 1),
    'pending'
) ON CONFLICT DO NOTHING;

-- Create a function to automatically create DAO proposals for loyalty changes
CREATE OR REPLACE FUNCTION public.create_dao_proposal_for_loyalty_change()
RETURNS TRIGGER AS $$
DECLARE
    proposal_id UUID;
    proposal_title TEXT;
    proposal_description TEXT;
    proposal_full_description TEXT;
BEGIN
    -- Only create proposal for new pending changes
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
        
        -- Generate proposal details
        proposal_title := 'Loyalty Change: ' || 
            CASE NEW.change_type
                WHEN 'point_release_delay' THEN 'Point Release Delay'
                WHEN 'referral_parameters' THEN 'Referral Parameters'
                WHEN 'nft_earning_ratios' THEN 'NFT Earning Ratios'
                WHEN 'loyalty_network_settings' THEN 'Loyalty Network Settings'
                WHEN 'merchant_limits' THEN 'Merchant Limits'
                WHEN 'inactivity_timeout' THEN 'Inactivity Timeout'
                WHEN 'sms_otp_settings' THEN 'SMS OTP Settings'
                WHEN 'subscription_plans' THEN 'Subscription Plans'
                WHEN 'asset_initiative_selection' THEN 'Asset Initiative Selection'
                WHEN 'wallet_management' THEN 'Wallet Management'
                WHEN 'payment_gateway' THEN 'Payment Gateway'
                WHEN 'email_notifications' THEN 'Email Notifications'
                ELSE NEW.change_type
            END || ' - ' || NEW.parameter_name;
            
        proposal_description := 'Change ' || NEW.parameter_name || ' from "' || NEW.old_value || '" to "' || NEW.new_value || '"';
        
        proposal_full_description := '
# Loyalty Application Behavior Change

## Change Type
' || proposal_title || '

## Parameter
' || NEW.parameter_name || '

## Current Value
' || NEW.old_value || '

## Proposed Value
' || NEW.new_value || '

## Reason for Change
' || NEW.reason || '

## Impact Assessment
This change will affect the behavior of the loyalty application and requires community approval through DAO governance.

## Implementation
Once approved by the DAO, this change will be implemented automatically.

---
*This proposal was automatically generated by the loyalty governance system to ensure all behavior changes are properly governed.*';

        -- Create DAO proposal
        INSERT INTO public.dao_proposals (
            title,
            description,
            full_description,
            category,
            voting_type,
            status,
            treasury_impact_amount,
            treasury_impact_currency,
            tags,
            loyalty_change_id
        ) VALUES (
            proposal_title,
            proposal_description,
            proposal_full_description,
            'technical',
            'simple_majority',
            'draft',
            0,
            'SOL',
            ARRAY['loyalty', 'governance', NEW.change_type],
            NEW.id
        ) RETURNING id INTO proposal_id;
        
        -- Update the loyalty change request with the proposal ID
        UPDATE public.loyalty_change_requests 
        SET dao_proposal_id = proposal_id 
        WHERE id = NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create DAO proposals
DROP TRIGGER IF EXISTS trigger_create_dao_proposal_for_loyalty_change ON public.loyalty_change_requests;
CREATE TRIGGER trigger_create_dao_proposal_for_loyalty_change
    AFTER INSERT OR UPDATE ON public.loyalty_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_dao_proposal_for_loyalty_change();

-- Grant permissions (for local development)
GRANT SELECT, INSERT, UPDATE ON public.loyalty_change_requests TO postgres;

-- Add comments for documentation
COMMENT ON TABLE public.loyalty_change_requests IS 'Tracks all loyalty application behavior changes that require DAO approval';
COMMENT ON COLUMN public.loyalty_change_requests.change_type IS 'Type of loyalty change (point_release_delay, referral_parameters, etc.)';
COMMENT ON COLUMN public.loyalty_change_requests.parameter_name IS 'Name of the parameter being changed';
COMMENT ON COLUMN public.loyalty_change_requests.old_value IS 'Previous value (stored as JSON string)';
COMMENT ON COLUMN public.loyalty_change_requests.new_value IS 'New proposed value (stored as JSON string)';
COMMENT ON COLUMN public.loyalty_change_requests.dao_proposal_id IS 'Reference to the DAO proposal created for this change';
COMMENT ON COLUMN public.loyalty_change_requests.status IS 'Status of the change (pending, approved, rejected, implemented)';
