-- Create the api schema
CREATE SCHEMA IF NOT EXISTS api;

-- Move all custom types to api schema
CREATE TYPE api.app_role AS ENUM ('admin', 'customer');
CREATE TYPE api.card_type AS ENUM ('loyalty', 'loyalty_plus');
CREATE TYPE api.merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

-- Move all tables from public to api schema
ALTER TABLE public.profiles SET SCHEMA api;
ALTER TABLE public.subscribers SET SCHEMA api;
ALTER TABLE public.merchants SET SCHEMA api;
ALTER TABLE public.virtual_cards SET SCHEMA api;
ALTER TABLE public.merchant_subscriptions SET SCHEMA api;
ALTER TABLE public.merchant_cards SET SCHEMA api;

-- Update table columns to use api schema types (handle defaults carefully)
-- For profiles.role
ALTER TABLE api.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE api.profiles ALTER COLUMN role TYPE api.app_role USING role::text::api.app_role;
ALTER TABLE api.profiles ALTER COLUMN role SET DEFAULT 'customer'::api.app_role;

-- For virtual_cards columns
ALTER TABLE api.virtual_cards ALTER COLUMN card_type TYPE api.card_type USING card_type::text::api.card_type;
ALTER TABLE api.virtual_cards ALTER COLUMN pricing_type DROP DEFAULT;
ALTER TABLE api.virtual_cards ALTER COLUMN pricing_type TYPE api.pricing_type USING pricing_type::text::api.pricing_type;
ALTER TABLE api.virtual_cards ALTER COLUMN pricing_type SET DEFAULT 'free'::api.pricing_type;
ALTER TABLE api.virtual_cards ALTER COLUMN subscription_plan TYPE api.subscription_plan USING subscription_plan::text::api.subscription_plan;

-- For merchants columns  
ALTER TABLE api.merchants ALTER COLUMN status DROP DEFAULT;
ALTER TABLE api.merchants ALTER COLUMN status TYPE api.merchant_status USING status::text::api.merchant_status;
ALTER TABLE api.merchants ALTER COLUMN status SET DEFAULT 'pending'::api.merchant_status;
ALTER TABLE api.merchants ALTER COLUMN subscription_plan TYPE api.subscription_plan USING subscription_plan::text::api.subscription_plan;

-- For merchant_subscriptions
ALTER TABLE api.merchant_subscriptions ALTER COLUMN plan TYPE api.subscription_plan USING plan::text::api.subscription_plan;

-- Update all functions to work with api schema
CREATE OR REPLACE FUNCTION api.has_role(_user_id uuid, _role api.app_role)
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
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::api.app_role
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