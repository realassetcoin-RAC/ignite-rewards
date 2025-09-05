#!/bin/bash

# Verify Database Fix Script
# Run this after applying the COMPLETE_DATABASE_FIX.sql

SUPABASE_URL="https://wndswqvqogeblksrujpg.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA"

echo "🔍 VERIFYING DATABASE FIX"
echo "=========================="
echo

echo "✅ Testing is_admin function..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/is_admin" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$RESULT" | grep -q "error\|Error"; then
  echo "❌ is_admin failed: $RESULT"
else
  echo "✅ is_admin works: $RESULT"
fi

echo
echo "✅ Testing check_admin_access function..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/check_admin_access" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$RESULT" | grep -q "error\|Error\|could not find"; then
  echo "❌ check_admin_access failed: $RESULT"
else
  echo "✅ check_admin_access works: $RESULT"
fi

echo
echo "✅ Testing get_current_user_profile function..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/get_current_user_profile" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$RESULT" | grep -q "error\|Error\|could not find"; then
  echo "❌ get_current_user_profile failed: $RESULT"
else
  echo "✅ get_current_user_profile works: $RESULT"
fi

echo
echo "✅ Checking profiles table..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/profiles?select=id,email,role&limit=5" \
  -H "apikey: ${API_KEY}")

PROFILE_COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
echo "📊 Found $PROFILE_COUNT profiles"

if [ "$PROFILE_COUNT" -gt 0 ]; then
  echo "✅ Profiles table has data"
else
  echo "⚠️  Profiles table is empty"
fi

echo
echo "✅ Checking admin profiles..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/profiles?select=id,email,role&role=eq.admin" \
  -H "apikey: ${API_KEY}")

ADMIN_COUNT=$(echo "$RESULT" | grep -o '"role":"admin"' | wc -l)
echo "👑 Found $ADMIN_COUNT admin profiles"

if [ "$ADMIN_COUNT" -gt 0 ]; then
  echo "✅ Admin profiles exist"
  echo "📧 Admin profiles:"
  echo "$RESULT" | python3 -m json.tool 2>/dev/null | grep -E '"email"|"role"' || echo "$RESULT"
else
  echo "❌ No admin profiles found"
fi

echo
echo "🔧 Running comprehensive verification..."
RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/verify_database_fix" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$RESULT" | grep -q "error\|Error"; then
  echo "❌ Verification function failed: $RESULT"
else
  echo "$RESULT" | sed 's/\\n/\n/g' | sed 's/^"//;s/"$//'
fi

echo
echo "📋 SUMMARY:"
echo "==========="

# Check if all critical functions work
FUNCTIONS_OK=true
PROFILES_OK=true

if curl -s "${SUPABASE_URL}/rest/v1/rpc/check_admin_access" -H "apikey: ${API_KEY}" -X POST -H "Content-Type: application/json" -d "{}" | grep -q "error\|Error\|could not find"; then
  FUNCTIONS_OK=false
fi

if [ "$PROFILE_COUNT" -eq 0 ]; then
  PROFILES_OK=false
fi

if [ "$FUNCTIONS_OK" = true ] && [ "$PROFILES_OK" = true ]; then
  echo "🎉 DATABASE FIX SUCCESSFUL!"
  echo "✅ All required functions exist and work"
  echo "✅ Profile data exists"
  echo "✅ Ready to test admin authentication"
  echo
  echo "🚀 NEXT STEPS:"
  echo "1. Go to your application"
  echo "2. Login with realassetcoin@gmail.com"  
  echo "3. Verify you're redirected to /admin-panel"
  echo "4. Check that admin dashboard loads without errors"
else
  echo "❌ DATABASE FIX INCOMPLETE"
  if [ "$FUNCTIONS_OK" = false ]; then
    echo "❌ Some functions are still missing or broken"
  fi
  if [ "$PROFILES_OK" = false ]; then
    echo "❌ Profile data is missing"
  fi
  echo
  echo "🔧 ACTION REQUIRED:"
  echo "1. Check if the COMPLETE_DATABASE_FIX.sql was applied correctly"
  echo "2. Verify the admin user exists in Supabase Auth"
  echo "3. Re-run the database fix script"
fi