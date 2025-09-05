-- Fix virtual card creation permissions
-- This migration ensures proper permissions for virtual card creation

-- Grant execute permission on the generate_loyalty_number function
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;

-- Ensure the function is accessible via RPC
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- Make sure the user_loyalty_cards table is accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- Ensure the table sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Test the function accessibility
DO $$
BEGIN
  -- Test if the function can be called
  PERFORM api.generate_loyalty_number('test@example.com');
  RAISE NOTICE 'SUCCESS: generate_loyalty_number function is accessible';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: generate_loyalty_number function failed: %', SQLERRM;
END $$;