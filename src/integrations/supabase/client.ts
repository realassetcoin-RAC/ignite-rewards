/**
 * CENTRALIZED DATABASE CLIENT - Single Source of Truth
 * 
 * This file uses the DatabaseAdapter as the ONLY database connection manager.
 * All database connections are handled through the DatabaseAdapter singleton.
 * 
 * ✅ Benefits:
 * - Single connection pool
 * - Consistent error handling
 * - Better monitoring and logging
 * - No connection conflicts
 * 
 * Usage:
 * import { supabase } from '@/integrations/supabase/client'
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

// Export the Supabase client from DatabaseAdapter
export const supabase = databaseAdapter.supabase;

// Export the adapter for advanced usage
export { databaseAdapter };

// Export as default for backward compatibility
export default supabase;

// Logging disabled - enable VITE_APP_DEBUG=true in env.local to see logs
