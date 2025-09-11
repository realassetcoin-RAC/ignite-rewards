-- Fix RLS policies for config_proposals table
-- This script fixes the permission issues with the config_proposals table

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage config proposals" ON api.config_proposals;
DROP POLICY IF EXISTS "Users can read approved proposals" ON api.config_proposals;
DROP POLICY IF EXISTS "DAO members can vote on proposals" ON api.config_proposals;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can view config proposals" ON api.config_proposals
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create config proposals" ON api.config_proposals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update config proposals" ON api.config_proposals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete config proposals" ON api.config_proposals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON api.config_proposals TO authenticated;
GRANT ALL ON api.config_proposals TO service_role;
GRANT ALL ON api.config_proposals TO anon;
