// Database Client - Auto-switches between Local PostgreSQL and Supabase
// Development: Uses local PostgreSQL
// UAT/Production: Uses Supabase

import { databaseAdapter } from '@/lib/databaseAdapter';

// Export the database adapter as supabase for compatibility
export const supabase = databaseAdapter;
export default supabase;