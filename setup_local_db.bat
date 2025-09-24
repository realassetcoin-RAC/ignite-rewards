@echo off
echo Setting up Local PostgreSQL Database for RAC Rewards...
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL service...
sc query postgresql-x64-16 | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL 16 is running
    set PG_VERSION=16
) else (
    sc query postgresql-x64-17 | find "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL 17 is running
        set PG_VERSION=17
    ) else (
        echo ❌ PostgreSQL is not running. Please start PostgreSQL service.
        pause
        exit /b 1
    )
)

echo.
echo Creating database 'rac_rewards'...
createdb rac_rewards
if %errorlevel% equ 0 (
    echo ✅ Database 'rac_rewards' created successfully
) else (
    echo ⚠️  Database might already exist or there was an error
)

echo.
echo Running database setup script...
psql -d rac_rewards -f src\sql\setup_local_database.sql
if %errorlevel% equ 0 (
    echo ✅ Database setup completed successfully
) else (
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo Verifying database configuration...
node src\scripts\verifyLocalDatabase.js

echo.
echo Setup complete! Press any key to exit...
pause >nul
