// Supabase Cloud Client - No Fallback
// This client connects directly to the Supabase cloud database only
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Cloud Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_DEV_SUPABASE_URL || "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create cloud client directly
const cloudClient: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
});

// Export the cloud client directly
export const supabase = cloudClient;

// Export environment info
export const clientInfo = {
  isLocal: false,
  environment: 'cloud-only',
  clientType: 'cloud-client',
  databaseUrl: SUPABASE_URL,
  currentMode: () => 'cloud'
};

console.log(`🚀 Supabase cloud client initialized: ${clientInfo.clientType}`);
console.log('☁️ CLOUD ONLY - Connected to Supabase cloud database!');
