// Smart Supabase Client that switches between local and remote based on environment
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { LocalSupabaseClient } from './localSupabaseClient';

// Force local development mode
// const isLocalDevelopment = true;

console.log(' Environment check:', {
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  DEV: import.meta.env.DEV,
  hostname: window.location.hostname,
  isLocalDevelopment: true
});

// Remote Supabase configuration (not used in local mode)
// const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
// const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create the appropriate client based on environment
const supabaseClient: SupabaseClient<Database> | LocalSupabaseClient = new LocalSupabaseClient();

// Add a test method to verify the client is working
console.log(' Testing client type:', typeof supabaseClient);
console.log('🧪 Client has from method:', typeof supabaseClient.from);
console.log('🧪 Client has rpc method:', typeof supabaseClient.rpc);

// Export the appropriate client
export const supabase = supabaseClient;

// Export environment info
export const clientInfo = {
  isLocal: true,
  environment: 'development',
  clientType: 'local'
};

console.log(`🚀 Supabase client initialized: ${clientInfo.clientType} (${clientInfo.environment})`);
console.log('🔥 FORCE LOG - This should definitely appear in console!');
