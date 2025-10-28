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
