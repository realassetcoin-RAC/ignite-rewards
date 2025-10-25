// Database Client - Uses Database Adapter for Docker PostgreSQL
// This client uses Docker PostgreSQL (No Supabase)

import { databaseAdapter } from './databaseAdapter';

// Re-export for backward compatibility
export { databaseAdapter };
export const supabase = databaseAdapter;

console.log('🐘 DOCKER POSTGRESQL MODE - Using local Docker database');
