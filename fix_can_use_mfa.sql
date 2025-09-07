-- Quick fix for can_use_mfa function ambiguous column reference
DROP FUNCTION IF EXISTS api.can_use_mfa(uuid) CASCADE;

CREATE OR REPLACE FUNCTION api.can_use_mfa(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  user_auth_methods text[];
  target_user_id uuid;
BEGIN
  target_user_id := can_use_mfa.user_id;
  
  -- Get user's authentication methods from auth.users and auth.identities
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT 
        CASE 
          WHEN provider = 'email' THEN 'email'
          WHEN provider = 'google' THEN 'google'
          WHEN provider = 'github' THEN 'github'
          ELSE provider
        END
      FROM auth.identities 
      WHERE auth.identities.user_id = target_user_id
    ), 
    '{}'
  ) INTO user_auth_methods;
  
  -- Check if user has email or social auth (not wallet-based)
  -- MFA is only available for email and social authentication
  RETURN 'email' = ANY(user_auth_methods) OR 
         'google' = ANY(user_auth_methods) OR 
         'github' = ANY(user_auth_methods);
END;
$$;

GRANT EXECUTE ON FUNCTION api.can_use_mfa(uuid) TO authenticated;
