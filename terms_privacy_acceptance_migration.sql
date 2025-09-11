-- Create terms_privacy_acceptance table for storing user acceptance of terms and privacy policy
-- This table tracks when users accept the terms of service and privacy policy

CREATE TABLE IF NOT EXISTS public.terms_privacy_acceptance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    privacy_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    privacy_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_terms_privacy_acceptance_user_id ON public.terms_privacy_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_privacy_acceptance_accepted_at ON public.terms_privacy_acceptance(accepted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view and update their own acceptance records
CREATE POLICY "Users can manage their own acceptance" ON public.terms_privacy_acceptance
    FOR ALL USING (user_id = auth.uid());

-- Admins can view all acceptance records
CREATE POLICY "Admins can view all acceptance" ON public.terms_privacy_acceptance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.terms_privacy_acceptance TO authenticated;
GRANT ALL ON public.terms_privacy_acceptance TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.terms_privacy_acceptance IS 'Stores user acceptance of terms of service and privacy policy';
COMMENT ON COLUMN public.terms_privacy_acceptance.terms_accepted IS 'Whether the user has accepted the terms of service';
COMMENT ON COLUMN public.terms_privacy_acceptance.privacy_accepted IS 'Whether the user has accepted the privacy policy';
COMMENT ON COLUMN public.terms_privacy_acceptance.terms_version IS 'Version of terms of service that was accepted';
COMMENT ON COLUMN public.terms_privacy_acceptance.privacy_version IS 'Version of privacy policy that was accepted';
COMMENT ON COLUMN public.terms_privacy_acceptance.accepted_at IS 'When the user accepted the terms and privacy policy';

