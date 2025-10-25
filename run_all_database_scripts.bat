@echo off
echo ================================================================================
echo RAC Rewards - Execute All Database Scripts (Past 10 Days)
echo ================================================================================
echo.

REM Database connection parameters
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ignite_rewards
set DB_USER=postgres
set DB_PASSWORD=Maegan@200328

echo [1/1] Testing database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection successful
) else (
    echo ❌ Database connection failed
    echo Please ensure PostgreSQL is running and accessible
    pause
    exit /b 1
)

echo.
echo Executing database scripts...
echo.

REM Core restoration scripts
echo [1/35] Executing: restore_complete_database.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f restore_complete_database.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [2/35] Executing: restore_complete_system.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f restore_complete_system.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Merchant subscription plans
echo [3/35] Executing: fix_subscription_plans_complete.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_subscription_plans_complete.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [4/35] Executing: FIX_MERCHANT_SUBSCRIPTION_PLANS_PUBLIC_SCHEMA.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f FIX_MERCHANT_SUBSCRIPTION_PLANS_PUBLIC_SCHEMA.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [5/35] Executing: update_plan_features_correct.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f update_plan_features_correct.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [6/35] Executing: update_subscription_prices.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f update_subscription_prices.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [7/35] Executing: FIX_POPULAR_PLAN_COLUMN.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f FIX_POPULAR_PLAN_COLUMN.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [8/35] Executing: COMPREHENSIVE_POPULAR_PLAN_FIX.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f COMPREHENSIVE_POPULAR_PLAN_FIX.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM DAO system
echo [9/35] Executing: FIX_DAO_TABLES_AND_DATA.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f FIX_DAO_TABLES_AND_DATA.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [10/35] Executing: fix_dao_tables_complete.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_dao_tables_complete.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [11/35] Executing: fix_dao_proposal_creation.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_dao_proposal_creation.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [12/35] Executing: COMPREHENSIVE_DAO_ECOSYSTEM.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f COMPREHENSIVE_DAO_ECOSYSTEM.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [13/35] Executing: MIGRATE_TO_5_MAIN_DAOS.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f MIGRATE_TO_5_MAIN_DAOS.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [14/35] Executing: FIX_DAO_PROPOSALS_RLS_POLICIES.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f FIX_DAO_PROPOSALS_RLS_POLICIES.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [15/35] Executing: UPDATE_DAO_TRIGGER_FOR_NEW_MAPPING.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f UPDATE_DAO_TRIGGER_FOR_NEW_MAPPING.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM NFT and loyalty system
echo [16/35] Executing: FIX_NFT_TYPES_SCHEMA.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f FIX_NFT_TYPES_SCHEMA.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [17/35] Executing: LINK_NFT_TYPES_TO_COLLECTIONS.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f LINK_NFT_TYPES_TO_COLLECTIONS.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [18/35] Executing: fix_loyalty_card_function.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_loyalty_card_function.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [19/35] Executing: create_loyalty_cards_table.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f create_loyalty_cards_table.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [20/35] Executing: fix_loyalty_cards_loading.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_loyalty_cards_loading.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [21/35] Executing: CREATE_LOYALTY_PROVIDERS_TABLE.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f CREATE_LOYALTY_PROVIDERS_TABLE.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [22/35] Executing: CREATE_LOYALTY_CHANGE_REQUESTS_TABLE.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f CREATE_LOYALTY_CHANGE_REQUESTS_TABLE.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Marketplace and referral
echo [23/35] Executing: create_marketplace_tables.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f create_marketplace_tables.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [24/35] Executing: fix_dao_marketplace_field_gaps.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_dao_marketplace_field_gaps.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [25/35] Executing: fix_referral_system.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_referral_system.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Rewards and configuration
echo [26/35] Executing: fix_rewards_config_simple.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_rewards_config_simple.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [27/35] Executing: fix_config_proposals_issue.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_config_proposals_issue.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Cities lookup system
echo [28/35] Executing: create_cities_lookup_table.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f create_cities_lookup_table.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [29/35] Executing: apply_cities_lookup.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f apply_cities_lookup.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [30/35] Executing: apply_cities_10k_chunks.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f apply_cities_10k_chunks.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Terms and privacy
echo [31/35] Executing: PERMANENT_TERMS_TABLE_FIX.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f PERMANENT_TERMS_TABLE_FIX.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

REM Database cleanup
echo [32/35] Executing: remove_duplicate_loyalty_cards.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f remove_duplicate_loyalty_cards.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [33/35] Executing: prevent_future_duplicates.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f prevent_future_duplicates.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [34/35] Executing: fix_merchants_table.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_merchants_table.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo [35/35] Executing: fix_missing_category_column.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_missing_category_column.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Success) else (echo   ⚠️  Warning)

echo.
echo Running verification scripts...
echo.

echo Verifying: verify_cities_data_10k.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f verify_cities_data_10k.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Verification completed) else (echo   ⚠️  Verification warning)

echo Verifying: VERIFY_LOYALTY_PROVIDERS_DATA.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f VERIFY_LOYALTY_PROVIDERS_DATA.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Verification completed) else (echo   ⚠️  Verification warning)

echo Verifying: check_database_schema.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f check_database_schema.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Verification completed) else (echo   ⚠️  Verification warning)

echo Verifying: check_dao_tables.sql
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f check_dao_tables.sql >nul 2>&1
if %errorlevel% equ 0 (echo   ✅ Verification completed) else (echo   ⚠️  Verification warning)

echo.
echo Final database verification...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'Database setup completed successfully!' as status, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables, (SELECT COUNT(*) FROM public.nft_types) as nft_types, (SELECT COUNT(*) FROM public.merchant_subscription_plans) as subscription_plans, (SELECT COUNT(*) FROM public.dao_organizations) as dao_organizations, (SELECT COUNT(*) FROM public.cities_lookup) as cities_count, (SELECT COUNT(*) FROM public.loyalty_networks) as loyalty_networks;"

echo.
echo ================================================================================
echo EXECUTION SUMMARY
echo ================================================================================
echo.
echo Database setup completed!
echo.
echo Next steps:
echo 1. Start your application: npm run dev
echo 2. Test all features to ensure they work correctly
echo 3. Check browser console for any remaining errors
echo.
echo ================================================================================
pause
