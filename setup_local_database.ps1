Write-Host "🚀 Setting up Local PostgreSQL Database for Ignite Rewards" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host ""
Write-Host "📊 Step 1: Creating database if it doesn't exist..." -ForegroundColor Yellow
try {
    psql -U postgres -c "CREATE DATABASE ignite_rewards;" 2>$null
    Write-Host "✅ Database created or already exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database creation failed or already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Step 2: Running database setup script..." -ForegroundColor Yellow
try {
    psql -U postgres -d ignite_rewards -f fix-subscription-plans-table.sql
    Write-Host "✅ Database setup completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database setup failed" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL connection and try again" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Step 3: Testing database connection..." -ForegroundColor Yellow
try {
    node test_local_connection.js
    Write-Host "✅ Database connection test completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection test failed" -ForegroundColor Red
    Write-Host "Please check your database setup" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Setup complete! You can now run: npm run dev" -ForegroundColor Green
Write-Host "👤 Admin Login: admin@igniterewards.com" -ForegroundColor Cyan
Write-Host "🔑 Admin Password: admin123!" -ForegroundColor Cyan
Write-Host "🌐 Application URL: http://localhost:5173" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
