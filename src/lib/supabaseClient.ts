// Supabase Client - Uses Database Adapter for Cloud Supabase
// This client now uses the cloud Supabase database

// Re-export from database adapter for cloud Supabase
export { supabase, databaseAdapter as clientInfo } from './databaseAdapter';

console.log('🌐 CLOUD SUPABASE MODE - Using cloud database');
