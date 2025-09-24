@echo off
echo Running NFT Schema Migration...
echo.

REM Set environment variables for database connection
set PGPASSWORD=RACRewards2024!

REM Run the migration script
psql -h db.igniterewards.supabase.co -p 5432 -d postgres -U postgres.igniterewards -f "07_nft_schema_complete_migration.sql"

echo.
echo Migration completed!
pause

