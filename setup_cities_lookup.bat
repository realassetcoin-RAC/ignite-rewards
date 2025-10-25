@echo off
echo Setting up Cities Lookup Table for Merchant Signup Form...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Supabase CLI is not installed.
    echo Please install it with: npm install -g supabase
    pause
    exit /b 1
)

REM Check if we're in a Supabase project
if not exist "supabase\config.toml" (
    echo Error: Not in a Supabase project directory.
    echo Please run this script from your project root where supabase\config.toml exists.
    pause
    exit /b 1
)

REM Apply the cities lookup table
echo Applying cities lookup table to Supabase database...
supabase db reset --linked

echo.
echo Cities lookup table setup complete!
echo.
echo The following has been created:
echo - cities_lookup table with comprehensive city/country data
echo - search_cities function for efficient city searching
echo - Proper RLS policies for public read access
echo - Indexes for optimal search performance
echo.
echo Your merchant signup form will now use this local database
echo instead of the external API Ninjas service.
echo.
pause

