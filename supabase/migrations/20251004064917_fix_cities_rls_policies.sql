-- Fix RLS policies for cities_lookup table
-- This script will ensure proper RLS policies are in place

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Cities lookup is publicly readable" ON cities_lookup;
DROP POLICY IF EXISTS "Cities lookup is publicly writable" ON cities_lookup;

-- Create new policies that allow both read and write access
CREATE POLICY "Cities lookup is publicly readable" ON cities_lookup
    FOR SELECT USING (true);

CREATE POLICY "Cities lookup is publicly writable" ON cities_lookup
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cities lookup is publicly updatable" ON cities_lookup
    FOR UPDATE USING (true);

CREATE POLICY "Cities lookup is publicly deletable" ON cities_lookup
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cities_lookup TO anon, authenticated;
GRANT USAGE ON SEQUENCE cities_lookup_id_seq TO anon, authenticated;
