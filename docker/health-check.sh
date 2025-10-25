#!/bin/bash

# Health check script for RAC Rewards Application
# This script checks if the application is healthy and responding

set -e

# Configuration
APP_HOST="${HOSTNAME:-localhost}"
APP_PORT="${PORT:-3000}"
HEALTH_ENDPOINT="/api/health"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] HEALTH CHECK: $1"
}

# Function to check if application is responding
check_http_response() {
    log "🔍 Checking HTTP response..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$APP_HOST:$APP_PORT$HEALTH_ENDPOINT" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log "✅ Application is responding (HTTP 200)"
        return 0
    else
        log "❌ Application is not responding (HTTP $response_code)"
        return 1
    fi
}

# Function to check if application is listening on port
check_port_listening() {
    log "🔍 Checking if port $APP_PORT is listening..."
    
    if netstat -tuln | grep -q ":$APP_PORT "; then
        log "✅ Port $APP_PORT is listening"
        return 0
    else
        log "❌ Port $APP_PORT is not listening"
        return 1
    fi
}

# Function to check application process
check_process() {
    log "🔍 Checking application process..."
    
    if pgrep -f "node.*server.js" > /dev/null; then
        log "✅ Application process is running"
        return 0
    else
        log "❌ Application process is not running"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    log "🔍 Checking memory usage..."
    
    local memory_usage
    memory_usage=$(ps -o pid,vsz,rss,comm -p $(pgrep -f "node.*server.js") 2>/dev/null | tail -n +2 | awk '{print $3}' || echo "0")
    
    if [ "$memory_usage" -gt 0 ]; then
        log "📊 Memory usage: ${memory_usage}KB"
        if [ "$memory_usage" -lt 1000000 ]; then  # Less than 1GB
            log "✅ Memory usage is healthy"
            return 0
        else
            log "⚠️  High memory usage detected"
            return 1
        fi
    else
        log "❌ Could not determine memory usage"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log "🔍 Checking disk space..."
    
    local disk_usage
    disk_usage=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        log "✅ Disk usage: ${disk_usage}% (healthy)"
        return 0
    else
        log "⚠️  High disk usage: ${disk_usage}%"
        return 1
    fi
}

# Function to check environment variables
check_environment() {
    log "🔍 Checking environment variables..."
    
    local required_vars=("NODE_ENV" "PORT")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log "✅ All required environment variables are set"
        return 0
    else
        log "❌ Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to run comprehensive health check
run_health_check() {
    log "🏥 Starting comprehensive health check..."
    
    local exit_code=0
    
    # Run all checks
    check_process || exit_code=1
    check_port_listening || exit_code=1
    check_http_response || exit_code=1
    check_memory || exit_code=1
    check_disk_space || exit_code=1
    check_environment || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log "🎉 All health checks passed!"
    else
        log "💥 Some health checks failed!"
    fi
    
    return $exit_code
}

# Main execution
main() {
    log "🚀 RAC Rewards Application Health Check"
    log "Host: $APP_HOST"
    log "Port: $APP_PORT"
    log "Environment: ${NODE_ENV:-development}"
    
    run_health_check
}

# Execute main function
main "$@"
