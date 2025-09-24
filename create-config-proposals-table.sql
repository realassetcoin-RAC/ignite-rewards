-- ===========================================
-- CREATE CONFIG_PROPOSALS TABLE
-- ===========================================
-- This table stores configuration change proposals that require DAO approval

-- Create the config_proposals table
CREATE TABLE IF NOT EXISTS public.config_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id TEXT NOT NULL,
    proposed_distribution_interval INTEGER NOT NULL,
    proposed_max_rewards_per_user INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    proposer_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_config_proposals_status ON public.config_proposals(status);
CREATE INDEX IF NOT EXISTS idx_config_proposals_created_at ON public.config_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_config_proposals_proposer_id ON public.config_proposals(proposer_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_config_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_config_proposals_updated_at
    BEFORE UPDATE ON public.config_proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_config_proposals_updated_at();

-- Grant permissions
GRANT ALL ON public.config_proposals TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.config_proposals TO postgres;

-- Enable RLS (Row Level Security)
ALTER TABLE public.config_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for local development
CREATE POLICY "Enable all operations for postgres role" ON public.config_proposals
    FOR ALL TO postgres USING (true);

-- Insert a sample config proposal for testing
INSERT INTO public.config_proposals (
    config_id,
    proposed_distribution_interval,
    proposed_max_rewards_per_user,
    status,
    proposer_id
) VALUES (
    'default',
    86400,
    1000000,
    'pending',
    'admin'
) ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 
    'config_proposals table created successfully!' as message,
    COUNT(*) as existing_records
FROM public.config_proposals;
