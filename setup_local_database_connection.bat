@echo off
echo ================================================================================
echo RAC Rewards - Local Database Connection Setup
echo ================================================================================
echo.

echo [1/4] Copying environment configuration...
copy "env.local.database" ".env.local" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Environment file copied successfully
) else (
    echo ❌ Failed to copy environment file
    pause
    exit /b 1
)

echo.
echo [2/4] Verifying local PostgreSQL connection...
echo Testing connection to: postgresql://postgres:***@localhost:5432/ignite_rewards

REM Test PostgreSQL connection
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL connection successful
) else (
    echo ❌ PostgreSQL connection failed
    echo.
    echo Please ensure:
    echo - PostgreSQL is running on localhost:5432
    echo - Database 'ignite_rewards' exists
    echo - User 'postgres' has access
    echo - Password is correct
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] Checking database tables...
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database tables accessible
) else (
    echo ⚠️  Database tables may not exist yet
    echo    Run the database restoration scripts to create tables
)

echo.
echo [4/4] Environment configuration complete!
echo.
echo ================================================================================
echo SETUP COMPLETE
echo ================================================================================
echo.
echo Your application is now configured to use:
echo - Database: Local PostgreSQL (localhost:5432)
echo - Database Name: ignite_rewards
echo - User: postgres
echo - Supabase: DISABLED
echo.
echo Next steps:
echo 1. Start your application: npm run dev
echo 2. If tables are missing, run the database restoration scripts
echo 3. Check the browser console for connection status
echo.
echo ================================================================================
pause
