# Execute Database Fixes Script
# This script will apply the database fixes to Supabase

Write-Host "🔧 Executing database fixes for all form gaps..." -ForegroundColor Green
Write-Host ""

# Check if the SQL file exists
if (-not (Test-Path "fix_all_form_database_gaps.sql")) {
    Write-Host "❌ SQL file 'fix_all_form_database_gaps.sql' not found!" -ForegroundColor Red
    Write-Host "Please ensure the file exists in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 SQL file found: fix_all_form_database_gaps.sql" -ForegroundColor Green
Write-Host ""

# Display the SQL file size
$fileSize = (Get-Item "fix_all_form_database_gaps.sql").Length
Write-Host "📊 File size: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Open your Supabase dashboard" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Copy the contents of 'fix_all_form_database_gaps.sql'" -ForegroundColor White
Write-Host "4. Paste and execute the SQL script" -ForegroundColor White
Write-Host "5. Run the verification script after completion" -ForegroundColor White
Write-Host ""

Write-Host "📋 The SQL script will:" -ForegroundColor Cyan
Write-Host "   ✅ Add missing columns to profiles table" -ForegroundColor Green
Write-Host "   ✅ Add missing columns to merchants table" -ForegroundColor Green
Write-Host "   ✅ Create contact system tables" -ForegroundColor Green
Write-Host "   ✅ Create DAO governance tables" -ForegroundColor Green
Write-Host "   ✅ Create marketplace tables" -ForegroundColor Green
Write-Host "   ✅ Create user wallet tables" -ForegroundColor Green
Write-Host "   ✅ Create referral system tables" -ForegroundColor Green
Write-Host "   ✅ Create loyalty system tables" -ForegroundColor Green
Write-Host "   ✅ Add performance indexes" -ForegroundColor Green
Write-Host "   ✅ Enable Row Level Security" -ForegroundColor Green
Write-Host "   ✅ Create RLS policies" -ForegroundColor Green
Write-Host "   ✅ Insert default data" -ForegroundColor Green
Write-Host "   ✅ Create helper functions" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 After executing the SQL script, run:" -ForegroundColor Yellow
Write-Host "   node verify_form_database_fixes.js" -ForegroundColor White
Write-Host ""

# Ask if user wants to open the SQL file
$openFile = Read-Host "Would you like to open the SQL file now? (y/n)"
if ($openFile -eq "y" -or $openFile -eq "Y") {
    Write-Host "📂 Opening SQL file..." -ForegroundColor Green
    Start-Process "fix_all_form_database_gaps.sql"
}

Write-Host ""
Write-Host "✅ Script completed. Please follow the instructions above." -ForegroundColor Green
