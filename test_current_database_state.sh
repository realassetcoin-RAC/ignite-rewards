#!/bin/bash

# Test Current Database State
# Run this to see the current errors before applying fixes

SUPABASE_URL="https://wndswqvqogeblksrujpg.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA"

echo "🔍 TESTING CURRENT DATABASE STATE"
echo "================================="
echo

echo "1. Testing is_admin function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/is_admin" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" | python3 -m json.tool 2>/dev/null || echo "❌ Function call failed"

echo
echo "2. Testing check_admin_access function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/check_admin_access" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" | python3 -m json.tool 2>/dev/null || echo "❌ Function does not exist or failed"

echo
echo "3. Testing get_current_user_profile function..."
curl -s "${SUPABASE_URL}/rest/v1/rpc/get_current_user_profile" \
  -H "apikey: ${API_KEY}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{}" | python3 -m json.tool 2>/dev/null || echo "❌ Function does not exist or failed"

echo
echo "4. Checking profiles table..."
curl -s "${SUPABASE_URL}/rest/v1/profiles?select=id,email,role&limit=5" \
  -H "apikey: ${API_KEY}" | python3 -m json.tool 2>/dev/null || echo "❌ Could not access profiles table"

echo
echo "5. Checking for admin profiles..."
curl -s "${SUPABASE_URL}/rest/v1/profiles?select=id,email,role&role=eq.admin" \
  -H "apikey: ${API_KEY}" | python3 -m json.tool 2>/dev/null || echo "❌ Could not check admin profiles"

echo
echo "📊 SUMMARY OF CURRENT ISSUES:"
echo "=============================="
echo "❌ check_admin_access function is missing"
echo "❌ get_current_user_profile function is missing"
echo "❌ Profiles table may be empty or inaccessible"
echo "❌ Admin authentication will fail"
echo
echo "🔧 SOLUTION:"
echo "============"
echo "Apply the consolidated_database_fix.sql script in Supabase Dashboard"
echo "Then run the verification script to confirm fixes"