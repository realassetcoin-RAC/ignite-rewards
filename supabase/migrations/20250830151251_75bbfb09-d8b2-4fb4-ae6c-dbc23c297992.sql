-- Create the api schema
CREATE SCHEMA IF NOT EXISTS api;

-- Move all tables from public to api schema
ALTER TABLE public.profiles SET SCHEMA api;
ALTER TABLE public.subscribers SET SCHEMA api;
ALTER TABLE public.merchants SET SCHEMA api;
ALTER TABLE public.virtual_cards SET SCHEMA api;
ALTER TABLE public.merchant_subscriptions SET SCHEMA api;
ALTER TABLE public.merchant_cards SET SCHEMA api;

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

-- Clean up old public functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.is_admin(uuid);