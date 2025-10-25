#!/bin/bash

# Health check script for RAC Rewards PostgreSQL
# This script checks if PostgreSQL is healthy and ready to accept connections

set -e

# Configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-dwarfintel}"
DB_NAME="${POSTGRES_DB:-ignite_rewards}"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] HEALTH CHECK: $1"
}

# Function to check if PostgreSQL is accepting connections
check_connection() {
    log "🔍 Checking PostgreSQL connection..."
    
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log "✅ PostgreSQL is accepting connections"
        return 0
    else
        log "❌ PostgreSQL is not accepting connections"
        return 1
    fi
}

# Function to check if database exists and is accessible
check_database() {
    log "🔍 Checking database accessibility..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        log "❌ Database is not accessible"
        return 1
    fi
}

# Function to check if required tables exist
check_tables() {
    log "🔍 Checking required tables..."
    
    local required_tables=(
        "profiles"
        "nft_collections"
        "nft_types"
        "user_loyalty_cards"
        "merchant_subscription_plans"
        "merchants"
        "cities_lookup"
        "loyalty_networks"
    )
    
    local missing_tables=()
    
    for table in "${required_tables[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        log "✅ All required tables exist"
        return 0
    else
        log "❌ Missing tables: ${missing_tables[*]}"
        return 1
    fi
}

# Function to check if required functions exist
check_functions() {
    log "🔍 Checking required functions..."
    
    local required_functions=(
        "is_admin"
        "get_current_user_profile"
        "generate_loyalty_number"
        "get_valid_subscription_plans"
        "search_cities"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM pg_proc WHERE proname = '$func';" | grep -q "1 row"; then
            missing_functions+=("$func")
        fi
    done
    
    if [ ${#missing_functions[@]} -eq 0 ]; then
        log "✅ All required functions exist"
        return 0
    else
        log "❌ Missing functions: ${missing_functions[*]}"
        return 1
    fi
}

# Function to check database performance
check_performance() {
    log "🔍 Checking database performance..."
    
    # Check active connections
    local active_connections=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$active_connections" ] && [ "$active_connections" -lt 100 ]; then
        log "✅ Active connections: $active_connections (healthy)"
    else
        log "⚠️  High number of active connections: $active_connections"
    fi
    
    # Check database size
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
    log "📊 Database size: $db_size"
    
    return 0
}

# Function to run comprehensive health check
run_health_check() {
    log "🏥 Starting comprehensive health check..."
    
    local exit_code=0
    
    # Run all checks
    check_connection || exit_code=1
    check_database || exit_code=1
    check_tables || exit_code=1
    check_functions || exit_code=1
    check_performance || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log "🎉 All health checks passed!"
    else
        log "💥 Some health checks failed!"
    fi
    
    return $exit_code
}

# Main execution
main() {
    log "🚀 RAC Rewards PostgreSQL Health Check"
    log "Host: $DB_HOST"
    log "Port: $DB_PORT"
    log "User: $DB_USER"
    log "Database: $DB_NAME"
    
    run_health_check
}

# Execute main function
main "$@"
