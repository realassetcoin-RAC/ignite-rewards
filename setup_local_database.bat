@echo off
echo 🚀 Setting up Local PostgreSQL Database for Ignite Rewards
echo ========================================================

echo.
echo 📊 Step 1: Creating database if it doesn't exist...
psql -U postgres -c "CREATE DATABASE ignite_rewards;" 2>nul || echo Database already exists or error occurred

echo.
echo 📊 Step 2: Running database setup script...
psql -U postgres -d ignite_rewards -f fix-subscription-plans-table.sql

echo.
echo 📊 Step 3: Testing database connection...
node test_local_connection.js

echo.
echo 🎉 Setup complete! You can now run: npm run dev
echo 👤 Admin Login: admin@igniterewards.com
echo 🔑 Admin Password: admin123!
echo 🌐 Application URL: http://localhost:5173

pause
