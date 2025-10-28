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

CREATE INDEX IF NOT EXISTS idx_user_migrations_user_id ON user_points_migrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_migrations_status ON user_points_migrations(status);
CREATE INDEX IF NOT EXISTS idx_user_migrations_created_at ON user_points_migrations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_migrations_migration_id ON user_points_migrations(migration_id);

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
