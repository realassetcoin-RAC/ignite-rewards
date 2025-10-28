-- Migration: Create user_points_migrations table for tracking user-initiated points migrations
-- Created: 2024-12-20
-- Purpose: Track points migration from third-party platforms to PointBridge

-- Create user_points_migrations table
CREATE TABLE IF NOT EXISTS user_points_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_phone VARCHAR(20) NOT NULL,
    source_platform VARCHAR(100) NOT NULL,
    source_platform_username VARCHAR(255),
    points_amount DECIMAL(15,2) NOT NULL CHECK (points_amount > 0),
    verification_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN (
        'pending_verification', 
        'verified', 
        'completed', 
        'failed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_migrations_user_id ON user_points_migrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_migrations_status ON user_points_migrations(status);
CREATE INDEX IF NOT EXISTS idx_user_migrations_created_at ON user_points_migrations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_migrations_migration_id ON user_points_migrations(migration_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_points_migrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_points_migrations_updated_at
    BEFORE UPDATE ON user_points_migrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_migrations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_points_migrations IS 'Tracks user-initiated points migrations from third-party platforms to PointBridge';
COMMENT ON COLUMN user_points_migrations.migration_id IS 'Unique identifier for the migration process';
COMMENT ON COLUMN user_points_migrations.user_id IS 'Reference to the user performing the migration';
COMMENT ON COLUMN user_points_migrations.user_phone IS 'Phone number used for OTP verification';
COMMENT ON COLUMN user_points_migrations.source_platform IS 'Name of the third-party platform (e.g., "Loyalty Program A")';
COMMENT ON COLUMN user_points_migrations.source_platform_username IS 'Username on the source platform';
COMMENT ON COLUMN user_points_migrations.points_amount IS 'Number of points to migrate';
COMMENT ON COLUMN user_points_migrations.verification_id IS 'Firebase verification ID for OTP';
COMMENT ON COLUMN user_points_migrations.status IS 'Current status of the migration process';
COMMENT ON COLUMN user_points_migrations.failure_reason IS 'Reason for migration failure if status is failed';

-- Insert sample data for testing (optional)
-- INSERT INTO user_points_migrations (
--     migration_id,
--     user_id,
--     user_phone,
--     source_platform,
--     source_platform_username,
--     points_amount,
--     status
-- ) VALUES (
--     'mig_123456789',
--     (SELECT id FROM users LIMIT 1),
--     '+1234567890',
--     'Loyalty Program A',
--     'testuser123',
--     1000.00,
--     'pending_verification'
-- );
