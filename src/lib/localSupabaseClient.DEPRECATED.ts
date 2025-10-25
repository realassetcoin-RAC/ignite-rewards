/**
 * ⚠️ DEPRECATED - DO NOT USE
 * 
 * This file is deprecated and will be removed in a future version.
 * 
 * USE INSTEAD:
 * import { supabase } from '@/integrations/supabase/client'
 * 
 * OR:
 * import { databaseAdapter } from '@/lib/databaseAdapter'
 * 
 * Reason for deprecation:
 * - Local database development is no longer supported
 * - All environments now use Supabase Cloud
 * - Replaced by centralized DatabaseAdapter
 * 
 * Migration guide: See DATABASE_ADAPTER_CONSOLIDATION.md
 */

// Re-export from DatabaseAdapter for backward compatibility
export { supabase, databaseAdapter } from '@/lib/databaseAdapter';

// Console statement removed

