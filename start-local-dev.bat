@echo off
echo 🚀 Starting Ignite Rewards Local Development Environment
echo.

echo 📊 Checking PostgreSQL connection...
psql -U postgres -d ignite_rewards -c "SELECT 'PostgreSQL is running!' as status;" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL connection failed. Please ensure PostgreSQL is running.
    echo    Make sure the service is started and the password is correct.
    pause
    exit /b 1
)
echo ✅ PostgreSQL connection successful

echo.
echo 🔧 Setting up environment...
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy local-env-config.env .env.local > nul
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

echo.
echo 📦 Installing dependencies...
if not exist node_modules (
    echo Installing npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🌐 Starting development server...
echo    The application will be available at: http://localhost:8084
echo    Admin login: admin@igniterewards.com / admin123!
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
