-- Fix Config Proposals Permissions
-- Run this SQL in your Supabase database to fix the RLS policies

-- =====================================================
-- STEP 1: Drop existing restrictive policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage config proposals" ON api.config_proposals;
DROP POLICY IF EXISTS "Users can read approved proposals" ON api.config_proposals;
DROP POLICY IF EXISTS "DAO members can vote on proposals" ON api.config_proposals;

-- =====================================================
-- STEP 2: Create new permissive policies
-- =====================================================

-- Allow anyone to view config proposals (for DAO transparency)
CREATE POLICY "Anyone can view config proposals" ON api.config_proposals
    FOR SELECT USING (true);

-- Allow authenticated users to create config proposals
CREATE POLICY "Authenticated users can create config proposals" ON api.config_proposals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins to update config proposals
CREATE POLICY "Admins can update config proposals" ON api.config_proposals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow admins to delete config proposals
CREATE POLICY "Admins can delete config proposals" ON api.config_proposals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- STEP 3: Grant necessary permissions
-- =====================================================

GRANT ALL ON api.config_proposals TO authenticated;
GRANT ALL ON api.config_proposals TO service_role;
GRANT ALL ON api.config_proposals TO anon;

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

-- Test query to verify permissions work
SELECT 
    id,
    config_id,
    proposed_distribution_interval,
    proposed_max_rewards_per_user,
    status,
    created_at
FROM api.config_proposals 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
To apply this fix:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste this entire SQL script
4. Click "Run" to execute
5. Verify the test query at the end returns results

After running this script:
- Config proposals will be visible in the DAO dashboard
- The "Proposal Pending DAO Approval" will show up properly
- Users can create new config proposals
- Admins can manage all config proposals

If you still see permission errors after running this:
1. Check that you're running this as a database admin
2. Verify the api.config_proposals table exists
3. Check that RLS is enabled on the table
*/
