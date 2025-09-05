#!/bin/bash

# Database Fix Application Script
# This script applies the essential database fixes using the Supabase REST API

SUPABASE_URL="https://wndswqvqogeblksrujpg.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA"

echo "🔧 Starting Database Error Fixes..."
echo

echo "📊 Current Database Status:"
echo "=========================="

echo "🧪 Testing is_admin function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/is_admin" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" | jq -r '.'

echo
echo "🧪 Testing check_admin_access function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/check_admin_access" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" 2>/dev/null || echo "❌ Function does not exist"

echo
echo "🧪 Testing get_current_user_profile function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/get_current_user_profile" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" 2>/dev/null || echo "❌ Function does not exist"

echo
echo "📋 Checking profiles table..."
PROFILES_COUNT=$(curl -s "${SUPABASE_URL}/rest/v1/profiles?select=count" \
  -H "apikey: ${API_KEY}" \
  -H "Prefer: count=exact" | jq -r 'length // 0')
echo "Profiles in database: ${PROFILES_COUNT}"

echo
echo "📋 Current profiles:"
curl -s "${SUPABASE_URL}/rest/v1/profiles?select=id,email,role&limit=10" \
  -H "apikey: ${API_KEY}" | jq -r '.'

echo
echo "💡 Database Issues Identified:"
echo "=============================="
echo "1. ❌ check_admin_access function is missing"
echo "2. ❌ get_current_user_profile function is missing"  
echo "3. ❌ Profiles table appears to be empty"
echo "4. ❌ No admin user profile exists"
echo
echo "🔧 Recommended Fixes:"
echo "==================="
echo "1. Apply the database_fix.sql script in Supabase SQL Editor"
echo "2. Create the missing RPC functions"
echo "3. Create admin user profile"
echo "4. Test authentication flow"
echo
echo "📝 Manual Steps Required:"
echo "========================"
echo "Since we cannot execute DDL statements via REST API, please:"
echo "1. Open Supabase Dashboard → SQL Editor"
echo "2. Copy and paste the contents of database_fix.sql"
echo "3. Execute the script"
echo "4. Run this test script again to verify fixes"
echo

# Create a simplified version for manual application
cat > manual_fix.sql << 'EOF'
-- ESSENTIAL DATABASE FIXES - Apply these in Supabase SQL Editor

-- 1. Create missing check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(public.is_admin(user_id), false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;

-- 2. Create missing get_current_user_profile function  
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = current_user_id OR p.id = current_user_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 3. Create admin user if realassetcoin@gmail.com exists in auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'realassetcoin@gmail.com' 
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
    VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
    ON CONFLICT (user_id) DO UPDATE SET 
      role = 'admin',
      updated_at = now();
    
    RAISE NOTICE 'Admin profile created/updated for realassetcoin@gmail.com';
  END IF;
END;
$$;
EOF

echo "✅ Created manual_fix.sql with essential fixes"
echo "📋 Apply this smaller script in Supabase SQL Editor if the full fix is too large"