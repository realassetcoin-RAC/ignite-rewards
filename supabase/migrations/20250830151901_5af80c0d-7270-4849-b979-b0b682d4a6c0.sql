-- Update all functions to work with api schema
CREATE OR REPLACE FUNCTION api.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'api'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM api.profiles
    WHERE id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION api.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'api'
AS $function$
BEGIN
  INSERT INTO api.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'api'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION api.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'api'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::app_role
  );
$function$;

-- Update trigger on auth.users to use new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE api.handle_new_user();

-- Drop existing triggers before recreating them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON api.profiles;
DROP TRIGGER IF EXISTS update_merchants_updated_at ON api.merchants;
DROP TRIGGER IF EXISTS update_virtual_cards_updated_at ON api.virtual_cards;
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON api.subscribers;

-- Add updated_at triggers for tables that need them
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON api.profiles
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON api.merchants
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON api.virtual_cards
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON api.subscribers
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();