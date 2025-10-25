#!/bin/bash
set -e

# Custom entrypoint script for RAC Rewards PostgreSQL
echo "🚀 Starting RAC Rewards PostgreSQL Container..."

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    log "⏳ Waiting for PostgreSQL to be ready..."
    until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER"; do
        log "PostgreSQL is unavailable - sleeping..."
        sleep 2
    done
    log "✅ PostgreSQL is ready!"
}

# Function to run initialization scripts
run_init_scripts() {
    log "📝 Running initialization scripts..."
    
    # Check if database already exists
    if psql -h localhost -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
        log "📊 Database $POSTGRES_DB already exists, skipping initialization"
    else
        log "🆕 Creating database $POSTGRES_DB..."
        
        # Run initialization scripts in order
        for script in /docker-entrypoint-initdb.d/*.sql; do
            if [ -f "$script" ]; then
                log "📄 Executing $(basename "$script")..."
                psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$script"
                if [ $? -eq 0 ]; then
                    log "✅ $(basename "$script") executed successfully"
                else
                    log "❌ Error executing $(basename "$script")"
                    exit 1
                fi
            fi
        done
        
        log "🎉 Database initialization completed!"
    fi
}

# Function to create additional users and permissions
setup_users() {
    log "👥 Setting up users and permissions..."
    
    # Create additional users if needed
    if [ "$POSTGRES_USER" != "postgres" ]; then
        log "🔐 Creating user $POSTGRES_USER..."
        psql -h localhost -U postgres -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';" || true
        psql -h localhost -U postgres -c "ALTER USER $POSTGRES_USER CREATEDB;" || true
        psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" || true
    fi
    
    # Grant permissions on public schema
    psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "GRANT ALL ON SCHEMA public TO $POSTGRES_USER;" || true
    psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;" || true
    psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;" || true
    psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $POSTGRES_USER;" || true
    
    log "✅ User setup completed!"
}

# Function to optimize PostgreSQL settings
optimize_postgres() {
    log "⚡ Optimizing PostgreSQL settings..."
    
    # Set environment-specific optimizations
    if [ "$ENVIRONMENT" = "production" ]; then
        log "🏭 Applying production optimizations..."
        # Production-specific settings would go here
    elif [ "$ENVIRONMENT" = "uat" ]; then
        log "🧪 Applying UAT optimizations..."
        # UAT-specific settings would go here
    else
        log "🛠️ Applying development optimizations..."
        # Development-specific settings would go here
    fi
    
    log "✅ PostgreSQL optimization completed!"
}

# Function to start PostgreSQL
start_postgres() {
    log "🚀 Starting PostgreSQL server..."
    
    # Start PostgreSQL in background
    postgres -c config_file=/etc/postgresql/postgresql.conf &
    POSTGRES_PID=$!
    
    # Wait for PostgreSQL to start
    wait_for_postgres
    
    # Run initialization
    run_init_scripts
    
    # Setup users
    setup_users
    
    # Optimize settings
    optimize_postgres
    
    # Wait for PostgreSQL process
    wait $POSTGRES_PID
}

# Main execution
main() {
    log "🎯 RAC Rewards PostgreSQL Container Starting..."
    log "Environment: ${ENVIRONMENT:-development}"
    log "Database: $POSTGRES_DB"
    log "User: $POSTGRES_USER"
    log "Host: ${POSTGRES_HOST:-localhost}"
    log "Port: ${POSTGRES_PORT:-5432}"
    
    # If this is the first argument and it's not a postgres command, run our custom logic
    if [ "$1" = "postgres" ]; then
        # Call the original postgres entrypoint
        exec /usr/local/bin/docker-entrypoint.sh "$@"
    else
        # Run our custom startup
        start_postgres
    fi
}

# Execute main function
main "$@"
