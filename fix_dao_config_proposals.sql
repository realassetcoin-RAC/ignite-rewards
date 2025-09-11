-- Fix DAO Config Proposals Table
-- This script creates the config_proposals table for DAO record creation

-- Create the config_proposals table
CREATE TABLE IF NOT EXISTS public.config_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id VARCHAR(100) NOT NULL,
    proposed_distribution_interval INTEGER NOT NULL,
    proposed_max_rewards_per_user INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    proposer_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID,
    rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.config_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can manage config proposals" ON public.config_proposals;
DROP POLICY IF EXISTS "Users can view config proposals" ON public.config_proposals;

CREATE POLICY "Admins can manage config proposals" ON public.config_proposals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view config proposals" ON public.config_proposals
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.config_proposals TO authenticated;
GRANT ALL ON public.config_proposals TO service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_config_proposals_status ON public.config_proposals(status);
CREATE INDEX IF NOT EXISTS idx_config_proposals_proposer_id ON public.config_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_config_proposals_created_at ON public.config_proposals(created_at);

-- Insert a sample config proposal to test
INSERT INTO public.config_proposals (
    config_id,
    proposed_distribution_interval,
    proposed_max_rewards_per_user,
    status,
    proposer_id
) VALUES (
    'default',
    86400,
    1000,
    'pending',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Config proposals table created successfully' as status;
SELECT COUNT(*) as proposal_count FROM public.config_proposals;
