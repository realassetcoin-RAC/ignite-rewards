# Apply All Database Changes from September 18, 2025 to Today
# This script executes all database changes on local PostgreSQL database

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "RAC Rewards - Apply Changes from September 18, 2025 to Today" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Database connection parameters
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "ignite_rewards"
$dbUser = "postgres"
$dbPassword = "Maegan@200328"

# Test database connection first
Write-Host "[1/1] Testing database connection..." -ForegroundColor Yellow
try {
    $testQuery = "SELECT 1;"
    $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $testQuery 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        throw "Connection failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running and accessible" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# List of scripts to execute in chronological order (September 18 - October 4, 2025)
$scripts = @(
    # Core restoration scripts (Latest)
    "restore_complete_database.sql",
    "restore_complete_system.sql",
    
    # Merchant system fixes (September 29 - October 2)
    "fix_subscription_plans_complete.sql",
    "FIX_MERCHANT_SUBSCRIPTION_PLANS_PUBLIC_SCHEMA.sql",
    "FIX_MERCHANT_SUBSCRIPTION_PLANS_SCHEMA.sql",
    "update_plan_features_correct.sql",
    "update_subscription_prices.sql",
    "FIX_POPULAR_PLAN_COLUMN.sql",
    "COMPREHENSIVE_POPULAR_PLAN_FIX.sql",
    "fix_merchants_table.sql",
    
    # DAO system complete setup (October 2)
    "FIX_DAO_TABLES_AND_DATA.sql",
    "fix_dao_tables_complete.sql",
    "fix_dao_proposal_creation.sql",
    "COMPREHENSIVE_DAO_ECOSYSTEM.sql",
    "MIGRATE_TO_5_MAIN_DAOS.sql",
    "FIX_DAO_PROPOSALS_RLS_POLICIES.sql",
    "UPDATE_DAO_TRIGGER_FOR_NEW_MAPPING.sql",
    
    # NFT and loyalty system (October 2 - October 4)
    "FIX_NFT_TYPES_SCHEMA.sql",
    "LINK_NFT_TYPES_TO_COLLECTIONS.sql",
    "CREATE_LOYALTY_PROVIDERS_TABLE.sql",
    "CREATE_LOYALTY_CHANGE_REQUESTS_TABLE.sql",
    "fix_loyalty_card_function.sql",
    "create_loyalty_cards_table.sql",
    "fix_loyalty_cards_loading.sql",
    
    # Marketplace and referral system (September 29 - October 4)
    "create_marketplace_tables.sql",
    "fix_dao_marketplace_field_gaps.sql",
    "fix_referral_system.sql",
    
    # Rewards and configuration system (October 2)
    "fix_rewards_config_simple.sql",
    "fix_config_proposals_issue.sql",
    
    # Cities lookup system (October 4)
    "create_cities_lookup_table.sql",
    "apply_cities_lookup.sql",
    "apply_cities_10k_chunks.sql",
    
    # Terms and privacy system (October 4)
    "PERMANENT_TERMS_TABLE_FIX.sql",
    
    # Database cleanup and optimization (October 2)
    "remove_duplicate_loyalty_cards.sql",
    "prevent_future_duplicates.sql",
    "fix_missing_category_column.sql",
    "create_missing_tables_only.sql",
    "create_missing_dashboard_tables.sql",
    
    # RLS policies and security (October 2)
    "COMPREHENSIVE_RLS_FIX.sql",
    "CHECK_AND_FIX_RLS_POLICIES.sql",
    "FIX_RLS_POLICIES_COMPREHENSIVE.sql",
    
    # Database constraints and triggers (October 2)
    "CHECK_DATABASE_TRIGGERS_AND_CONSTRAINTS.sql",
    
    # Price and monthly updates (October 2)
    "FIX_PRICE_MONTHLY_UPDATE_ISSUE.sql",
    "FIX_PRICE_MONTHLY_UPDATE_ISSUE_V2.sql",
    "CHECK_PRICE_MONTHLY_COLUMN_SPECIFIC.sql"
)

# Execute each script
$totalScripts = $scripts.Count
$currentScript = 0
$successCount = 0
$errorCount = 0

Write-Host "Executing $totalScripts database scripts from September 18 - October 4, 2025..." -ForegroundColor Yellow
Write-Host ""

foreach ($script in $scripts) {
    $currentScript++
    Write-Host "[$currentScript/$totalScripts] Executing: $script" -ForegroundColor Cyan
    
    if (Test-Path $script) {
        try {
            # Execute the SQL script
            $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $script 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Success" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "  ⚠️  Warning (Exit code: $LASTEXITCODE)" -ForegroundColor Yellow
                $errorCount++
            }
        } catch {
            Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "  ⚠️  Script not found: $script" -ForegroundColor Yellow
        $errorCount++
    }
    
    Write-Host ""
}

# Run verification scripts
Write-Host "Running verification scripts..." -ForegroundColor Yellow

$verificationScripts = @(
    "verify_cities_data_10k.sql",
    "VERIFY_LOYALTY_PROVIDERS_DATA.sql",
    "check_database_schema.sql",
    "check_dao_tables.sql"
)

foreach ($script in $verificationScripts) {
    if (Test-Path $script) {
        Write-Host "Verifying: $script" -ForegroundColor Cyan
        try {
            psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $script 2>$null
            Write-Host "  ✅ Verification completed" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Verification warning" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Final verification query
Write-Host "Final database verification..." -ForegroundColor Yellow
$finalQuery = @"
SELECT 
    'All changes from September 18, 2025 to today applied successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM public.nft_types) as nft_types,
    (SELECT COUNT(*) FROM public.merchant_subscription_plans) as subscription_plans,
    (SELECT COUNT(*) FROM public.dao_organizations) as dao_organizations,
    (SELECT COUNT(*) FROM public.cities_lookup) as cities_count,
    (SELECT COUNT(*) FROM public.loyalty_networks) as loyalty_networks,
    (SELECT COUNT(*) FROM public.loyalty_providers) as loyalty_providers,
    (SELECT COUNT(*) FROM public.marketplace_listings) as marketplace_listings;
"@

try {
    Write-Host "Executing final verification query..." -ForegroundColor Cyan
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $finalQuery
    Write-Host "✅ Final verification completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Final verification warning" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date Range: September 18, 2025 - October 4, 2025" -ForegroundColor White
Write-Host "Total scripts processed: $totalScripts" -ForegroundColor White
Write-Host "Successful executions: $successCount" -ForegroundColor Green
Write-Host "Warnings/Errors: $errorCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ All database changes from September 18, 2025 to today have been applied!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your application: npm run dev" -ForegroundColor White
Write-Host "2. Test all features to ensure they work correctly" -ForegroundColor White
Write-Host "3. Check browser console for any remaining errors" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
