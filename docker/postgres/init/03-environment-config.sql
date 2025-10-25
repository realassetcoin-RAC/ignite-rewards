-- Environment-specific configuration for RAC Rewards Database
-- This script sets up environment-specific settings and optimizations

-- Create environment-specific schemas
CREATE SCHEMA IF NOT EXISTS dev;
CREATE SCHEMA IF NOT EXISTS uat;
CREATE SCHEMA IF NOT EXISTS prod;

-- Create environment detection function
CREATE OR REPLACE FUNCTION get_environment()
RETURNS TEXT AS $$
DECLARE
    env_name TEXT;
BEGIN
    -- Check current database name to determine environment
    SELECT CASE 
        WHEN current_database() LIKE '%_dev' THEN 'development'
        WHEN current_database() LIKE '%_uat' THEN 'uat'
        WHEN current_database() LIKE '%_prod' THEN 'production'
        ELSE 'development'
    END INTO env_name;
    
    RETURN env_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create environment-specific configuration table
CREATE TABLE IF NOT EXISTS environment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment TEXT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(environment, config_key)
);

-- Insert environment-specific configurations
INSERT INTO environment_config (environment, config_key, config_value, description) VALUES
-- Development Environment
('development', 'debug_mode', 'true', 'Enable debug logging'),
('development', 'log_level', 'debug', 'Logging level for development'),
('development', 'cache_ttl', '300', 'Cache TTL in seconds'),
('development', 'rate_limit', '1000', 'Rate limit per minute'),
('development', 'session_timeout', '3600', 'Session timeout in seconds'),
('development', 'max_connections', '50', 'Maximum database connections'),
('development', 'backup_frequency', 'daily', 'Backup frequency'),
('development', 'monitoring_enabled', 'true', 'Enable monitoring and metrics'),

-- UAT Environment
('uat', 'debug_mode', 'false', 'Disable debug logging'),
('uat', 'log_level', 'info', 'Logging level for UAT'),
('uat', 'cache_ttl', '600', 'Cache TTL in seconds'),
('uat', 'rate_limit', '500', 'Rate limit per minute'),
('uat', 'session_timeout', '1800', 'Session timeout in seconds'),
('uat', 'max_connections', '100', 'Maximum database connections'),
('uat', 'backup_frequency', 'daily', 'Backup frequency'),
('uat', 'monitoring_enabled', 'true', 'Enable monitoring and metrics'),

-- Production Environment
('production', 'debug_mode', 'false', 'Disable debug logging'),
('production', 'log_level', 'warn', 'Logging level for production'),
('production', 'cache_ttl', '1800', 'Cache TTL in seconds'),
('production', 'rate_limit', '100', 'Rate limit per minute'),
('production', 'session_timeout', '900', 'Session timeout in seconds'),
('production', 'max_connections', '200', 'Maximum database connections'),
('production', 'backup_frequency', 'hourly', 'Backup frequency'),
('production', 'monitoring_enabled', 'true', 'Enable monitoring and metrics')
ON CONFLICT (environment, config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create function to get environment configuration
CREATE OR REPLACE FUNCTION get_config(config_key_param VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
    current_env TEXT;
BEGIN
    current_env := get_environment();
    
    SELECT ec.config_value INTO config_value
    FROM environment_config ec
    WHERE ec.environment = current_env AND ec.config_key = config_key_param;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set environment configuration
CREATE OR REPLACE FUNCTION set_config(config_key_param VARCHAR(100), config_value_param TEXT, description_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    current_env TEXT;
BEGIN
    current_env := get_environment();
    
    INSERT INTO environment_config (environment, config_key, config_value, description)
    VALUES (current_env, config_key_param, config_value_param, description_param)
    ON CONFLICT (environment, config_key) DO UPDATE SET
        config_value = EXCLUDED.config_value,
        description = COALESCE(EXCLUDED.description, environment_config.description),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create environment-specific user roles
DO $$
DECLARE
    current_env TEXT;
BEGIN
    current_env := get_environment();
    
    -- Create environment-specific roles
    IF current_env = 'development' THEN
        -- Development: More permissive roles
        CREATE ROLE IF NOT EXISTS dev_readonly;
        CREATE ROLE IF NOT EXISTS dev_readwrite;
        CREATE ROLE IF NOT EXISTS dev_admin;
        
        GRANT CONNECT ON DATABASE current_database() TO dev_readonly, dev_readwrite, dev_admin;
        GRANT USAGE ON SCHEMA public TO dev_readonly, dev_readwrite, dev_admin;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO dev_readonly;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dev_readwrite;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_admin;
        
    ELSIF current_env = 'uat' THEN
        -- UAT: Moderate permissions
        CREATE ROLE IF NOT EXISTS uat_readonly;
        CREATE ROLE IF NOT EXISTS uat_readwrite;
        CREATE ROLE IF NOT EXISTS uat_admin;
        
        GRANT CONNECT ON DATABASE current_database() TO uat_readonly, uat_readwrite, uat_admin;
        GRANT USAGE ON SCHEMA public TO uat_readonly, uat_readwrite, uat_admin;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO uat_readonly;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO uat_readwrite;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uat_admin;
        
    ELSIF current_env = 'production' THEN
        -- Production: Restrictive permissions
        CREATE ROLE IF NOT EXISTS prod_readonly;
        CREATE ROLE IF NOT EXISTS prod_readwrite;
        CREATE ROLE IF NOT EXISTS prod_admin;
        
        GRANT CONNECT ON DATABASE current_database() TO prod_readonly, prod_readwrite, prod_admin;
        GRANT USAGE ON SCHEMA public TO prod_readonly, prod_readwrite, prod_admin;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO prod_readonly;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prod_readwrite;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prod_admin;
    END IF;
END $$;

-- Create environment-specific monitoring functions
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    environment TEXT,
    database_name TEXT,
    total_tables INTEGER,
    total_indexes INTEGER,
    total_functions INTEGER,
    total_size TEXT,
    active_connections INTEGER,
    max_connections INTEGER
) AS $$
DECLARE
    current_env TEXT;
    db_name TEXT;
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    db_size TEXT;
    active_conn INTEGER;
    max_conn INTEGER;
BEGIN
    current_env := get_environment();
    db_name := current_database();
    
    -- Get table count
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Get index count
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Get function count
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public';
    
    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    -- Get connection stats
    SELECT COUNT(*) INTO active_conn FROM pg_stat_activity WHERE state = 'active';
    SELECT setting::INTEGER INTO max_conn FROM pg_settings WHERE name = 'max_connections';
    
    RETURN QUERY SELECT 
        current_env, db_name, table_count, index_count, function_count, 
        db_size, active_conn, max_conn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create environment-specific backup function
CREATE OR REPLACE FUNCTION schedule_backup()
RETURNS TEXT AS $$
DECLARE
    current_env TEXT;
    backup_freq TEXT;
    result TEXT;
BEGIN
    current_env := get_environment();
    backup_freq := get_config('backup_frequency');
    
    result := 'Backup scheduled for ' || current_env || ' environment with frequency: ' || backup_freq;
    
    -- In a real implementation, this would trigger actual backup processes
    -- For now, just log the action
    RAISE NOTICE 'Backup scheduled: %', result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create environment-specific cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
    current_env TEXT;
    cleanup_days INTEGER;
    result TEXT;
BEGIN
    current_env := get_environment();
    
    -- Set cleanup period based on environment
    cleanup_days := CASE current_env
        WHEN 'development' THEN 7
        WHEN 'uat' THEN 30
        WHEN 'production' THEN 90
        ELSE 30
    END;
    
    -- Clean up old logs, sessions, etc.
    -- This is a placeholder - implement actual cleanup logic as needed
    result := 'Cleanup completed for ' || current_env || ' environment (older than ' || cleanup_days || ' days)';
    
    RAISE NOTICE 'Cleanup completed: %', result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create environment-specific performance monitoring
CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE (
    environment TEXT,
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_env TEXT;
BEGIN
    current_env := get_environment();
    
    RETURN QUERY
    SELECT 
        current_env as environment,
        'database_size' as metric_name,
        pg_database_size(current_database()) as metric_value,
        'bytes' as metric_unit,
        NOW() as timestamp
    UNION ALL
    SELECT 
        current_env as environment,
        'active_connections' as metric_name,
        COUNT(*)::NUMERIC as metric_value,
        'connections' as metric_unit,
        NOW() as timestamp
    FROM pg_stat_activity WHERE state = 'active'
    UNION ALL
    SELECT 
        current_env as environment,
        'cache_hit_ratio' as metric_name,
        ROUND(
            (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::NUMERIC, 2
        ) as metric_value,
        'percentage' as metric_unit,
        NOW() as timestamp
    FROM pg_stat_database WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION get_environment() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_config(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_config(VARCHAR, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_database_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION schedule_backup() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_performance_metrics() TO anon, authenticated;

-- Grant permissions on environment_config table
GRANT SELECT, INSERT, UPDATE, DELETE ON environment_config TO anon, authenticated;

-- Create indexes for environment_config
CREATE INDEX IF NOT EXISTS idx_environment_config_env_key ON environment_config(environment, config_key);
CREATE INDEX IF NOT EXISTS idx_environment_config_env ON environment_config(environment);

-- Create trigger for environment_config updated_at
CREATE TRIGGER update_environment_config_updated_at 
    BEFORE UPDATE ON environment_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert environment-specific initial data
DO $$
DECLARE
    current_env TEXT;
BEGIN
    current_env := get_environment();
    
    -- Log environment initialization
    RAISE NOTICE 'Initializing % environment...', current_env;
    
    -- Set environment-specific settings
    IF current_env = 'development' THEN
        -- Development: Enable all debugging
        PERFORM set_config('debug_mode', 'true', 'Enable debug mode for development');
        PERFORM set_config('log_level', 'debug', 'Set debug logging level');
        PERFORM set_config('enable_test_data', 'true', 'Enable test data generation');
        
    ELSIF current_env = 'uat' THEN
        -- UAT: Moderate debugging
        PERFORM set_config('debug_mode', 'false', 'Disable debug mode for UAT');
        PERFORM set_config('log_level', 'info', 'Set info logging level');
        PERFORM set_config('enable_test_data', 'false', 'Disable test data generation');
        
    ELSIF current_env = 'production' THEN
        -- Production: Minimal logging
        PERFORM set_config('debug_mode', 'false', 'Disable debug mode for production');
        PERFORM set_config('log_level', 'warn', 'Set warning logging level');
        PERFORM set_config('enable_test_data', 'false', 'Disable test data generation');
    END IF;
    
    RAISE NOTICE 'Environment % initialized successfully!', current_env;
END $$;

-- Create environment-specific views
CREATE OR REPLACE VIEW environment_info AS
SELECT 
    get_environment() as environment,
    current_database() as database_name,
    version() as postgres_version,
    NOW() as initialized_at,
    get_config('debug_mode') as debug_mode,
    get_config('log_level') as log_level,
    get_config('cache_ttl') as cache_ttl,
    get_config('rate_limit') as rate_limit,
    get_config('session_timeout') as session_timeout,
    get_config('max_connections') as max_connections,
    get_config('backup_frequency') as backup_frequency,
    get_config('monitoring_enabled') as monitoring_enabled;

-- Grant select permission on the view
GRANT SELECT ON environment_info TO anon, authenticated;

-- Final environment setup
DO $$
DECLARE
    current_env TEXT;
    config_count INTEGER;
BEGIN
    current_env := get_environment();
    
    SELECT COUNT(*) INTO config_count 
    FROM environment_config 
    WHERE environment = current_env;
    
    RAISE NOTICE 'Environment setup complete for %!', current_env;
    RAISE NOTICE 'Configuration entries: %', config_count;
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'PostgreSQL version: %', version();
END $$;
