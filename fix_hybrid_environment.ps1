# Fix Hybrid Environment Configuration
# This script updates the .env.local file to enable Supabase authentication

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Fixing Hybrid Environment Configuration" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Backup the current .env.local file
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env.local.backup" -Force
    Write-Host "✅ Backed up current .env.local to .env.local.backup" -ForegroundColor Green
}

# Create the new hybrid environment configuration
$hybridConfig = @"
# Hybrid Database Configuration
# This file configures the application to use Supabase for authentication and local PostgreSQL for data

# =============================================================================
# LOCAL POSTGRESQL DATABASE CONFIGURATION
# =============================================================================

# Local PostgreSQL Database Connection
VITE_DATABASE_URL=postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=ignite_rewards
VITE_DB_USER=postgres
VITE_DB_PASSWORD=Maegan@200328

# =============================================================================
# SUPABASE CONFIGURATION (FOR AUTHENTICATION ONLY)
# =============================================================================

# Supabase credentials for authentication (data operations use local PostgreSQL)
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# Force local development mode
VITE_APP_ENV=development
VITE_APP_DEBUG=true

# Enable hybrid database features
VITE_USE_LOCAL_DATABASE=true
VITE_USE_SUPABASE_AUTH=true

# =============================================================================
# BLOCKCHAIN CONFIGURATION (LOCAL/DEVNET)
# =============================================================================

# Solana Configuration (using devnet for local development)
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet

# Ethereum Configuration (using sepolia testnet)
VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
VITE_ETHEREUM_NETWORK=sepolia

# =============================================================================
# EXTERNAL API CONFIGURATION
# =============================================================================

# API Ninjas for city/country lookup
VITE_API_NINJAS_KEY=mmukoqC1YD+DnoIYT1bUFQ==3yeUixLPT1Y8IxQt

# =============================================================================
# ADMIN CONFIGURATION
# =============================================================================

VITE_ADMIN_EMAIL=admin@igniterewards.com
VITE_ADMIN_PASSWORD=admin123!

# =============================================================================
# DEVELOPMENT FEATURES
# =============================================================================

# Enable development features
VITE_ENABLE_DEBUG_PANEL=true
VITE_ENABLE_TEST_DATA=true
VITE_ENABLE_MOCK_AUTH=false

# Local database specific settings
VITE_LOCAL_DB_SSL=false
VITE_LOCAL_DB_POOL_SIZE=10
VITE_LOCAL_DB_TIMEOUT=30000

# =============================================================================
# SECURITY SETTINGS (LOCAL DEVELOPMENT)
# =============================================================================

# Disable HTTPS for local development
VITE_FORCE_HTTPS=false
VITE_SECURE_COOKIES=false

# Local JWT settings (for mock auth if needed)
VITE_JWT_SECRET=local-development-secret-key
VITE_JWT_EXPIRES_IN=24h

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Enable detailed logging for local development
VITE_LOG_LEVEL=debug
VITE_ENABLE_DB_LOGGING=true
VITE_ENABLE_QUERY_LOGGING=true

# =============================================================================
# CORS SETTINGS (LOCAL DEVELOPMENT)
# =============================================================================

# Allow localhost connections
VITE_CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
VITE_CORS_CREDENTIALS=true

# =============================================================================
# DATABASE MIGRATION SETTINGS
# =============================================================================

# Local database migration settings
VITE_AUTO_MIGRATE=true
VITE_MIGRATION_PATH=./migrations
VITE_SEED_DATABASE=true

# =============================================================================
# PERFORMANCE SETTINGS (LOCAL DEVELOPMENT)
# =============================================================================

# Enable performance monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_QUERY_PROFILING=true

# Cache settings
VITE_ENABLE_QUERY_CACHE=true
VITE_CACHE_TTL=300000

# =============================================================================
# TESTING CONFIGURATION
# =============================================================================

# Test database settings
VITE_TEST_DATABASE_URL=postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards_test
VITE_TEST_DB_NAME=ignite_rewards_test

# Test mode settings
VITE_TEST_MODE=false
"@

# Write the new configuration to .env.local
$hybridConfig | Out-File -FilePath ".env.local" -Encoding UTF8 -Force

Write-Host "✅ Updated .env.local with hybrid configuration" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "  🔐 Authentication: Supabase Cloud" -ForegroundColor White
Write-Host "  📊 Data Operations: Local PostgreSQL" -ForegroundColor White
Write-Host "  🔄 Mode: Hybrid" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your development server (npm run dev)" -ForegroundColor White
Write-Host "2. Check the browser console for successful initialization" -ForegroundColor White
Write-Host "3. Test authentication and data loading" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
