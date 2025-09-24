-- ROLLBACK PLAN FOR SCHEMA MIGRATION
-- Use this script if you need to rollback the schema migration
-- WARNING: This will restore the previous state with mixed schemas

-- ==============================================
-- PHASE 1: RESTORE API SCHEMA
-- ==============================================

-- Recreate api schema
CREATE SCHEMA IF NOT EXISTS api;

-- ==============================================
-- PHASE 2: MOVE TABLES BACK TO API SCHEMA
-- ==============================================

-- Move tables back to api schema (only if they were originally there)
-- Note: This assumes the tables were originally in api schema

-- Move profiles table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles SET SCHEMA api;
        RAISE NOTICE 'Moved public.profiles back to api.profiles';
    END IF;
END $$;

-- Move merchants table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
        ALTER TABLE public.merchants SET SCHEMA api;
        RAISE NOTICE 'Moved public.merchants back to api.merchants';
    END IF;
END $$;

-- Move virtual_cards table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        ALTER TABLE public.virtual_cards SET SCHEMA api;
        RAISE NOTICE 'Moved public.virtual_cards back to api.virtual_cards';
    END IF;
END $$;

-- Move merchant_subscriptions table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
        ALTER TABLE public.merchant_subscriptions SET SCHEMA api;
        RAISE NOTICE 'Moved public.merchant_subscriptions back to api.merchant_subscriptions';
    END IF;
END $$;

-- Move merchant_cards table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_cards') THEN
        ALTER TABLE public.merchant_cards SET SCHEMA api;
        RAISE NOTICE 'Moved public.merchant_cards back to api.merchant_cards';
    END IF;
END $$;

-- Move subscribers table back to api schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
        ALTER TABLE public.subscribers SET SCHEMA api;
        RAISE NOTICE 'Moved public.subscribers back to api.subscribers';
    END IF;
END $$;

-- ==============================================
-- PHASE 3: RESTORE API SCHEMA TYPES
-- ==============================================

-- Recreate api schema types
CREATE TYPE api.app_role AS ENUM ('admin', 'customer');
CREATE TYPE api.card_type AS ENUM ('loyalty', 'loyalty_plus');
CREATE TYPE api.merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

-- ==============================================
-- PHASE 4: RESTORE API SCHEMA FUNCTIONS
-- ==============================================

-- Restore api schema functions
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
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$function$;

-- ==============================================
-- PHASE 5: RESTORE API SCHEMA TRIGGERS
-- ==============================================

-- Restore triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION api.handle_new_user();

-- ==============================================
-- PHASE 6: RESTORE API SCHEMA POLICIES
-- ==============================================

-- Restore api schema policies
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.merchant_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for api schema
CREATE POLICY "Users can view their own profile" ON api.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON api.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active merchants" ON api.merchants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own cards" ON api.virtual_cards
  FOR SELECT USING (auth.uid() = user_id);

-- ==============================================
-- PHASE 7: RESTORE ORIGINAL RPC FUNCTIONS
-- ==============================================

-- Restore original RPC functions (if they were different)
-- Note: This may need to be customized based on your original setup

-- ==============================================
-- PHASE 8: CLEAN UP PUBLIC SCHEMA
-- ==============================================

-- Remove any tables that should not be in public schema
-- Note: Be careful here - only remove tables that were moved to api schema

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check tables are in correct schemas
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_schema IN ('public', 'api')
ORDER BY table_schema, table_name;

-- Check functions are in correct schemas
SELECT 
    routine_schema,
    routine_name
FROM information_schema.routines 
WHERE routine_schema IN ('public', 'api')
ORDER BY routine_schema, routine_name;

-- Check types are in correct schemas
SELECT 
    n.nspname as schema_name,
    t.typname as type_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname IN ('public', 'api')
AND t.typtype IN ('e', 'c', 'd')
ORDER BY n.nspname, t.typname;
