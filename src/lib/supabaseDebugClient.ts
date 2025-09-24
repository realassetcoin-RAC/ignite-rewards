// Enhanced Supabase Client with Comprehensive Debugging
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { DebugLogger } from './debugLogger';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create the base client
const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

// Enhanced client with debugging
class DebugSupabaseClient {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = baseClient;
    this.setupAuthListener();
    this.setupRequestInterceptor();
  }

  private setupAuthListener() {
    this.client.auth.onAuthStateChange((event, session) => {
      DebugLogger.logAuthState(`Auth state changed: ${event}`, session?.user);
    });
  }

  private setupRequestInterceptor() {
    // Override the fetch method to intercept requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Only intercept Supabase requests
      if (url.includes('wndswqvqogeblksrujpg.supabase.co')) {
        const method = init?.method || 'GET';
        DebugLogger.logSupabaseRequest(method, url, init?.body);
        
        try {
          const response = await originalFetch(input, init);
          
          // Clone response to read body without consuming it
          const responseClone = response.clone();
          let responseData;
          
          try {
            responseData = await responseClone.json();
          } catch {
            responseData = await responseClone.text();
          }
          
          if (!response.ok) {
            DebugLogger.logSupabaseResponse(method, url, responseData, {
              message: `HTTP ${response.status}: ${response.statusText}`,
              code: responseData?.code || 'HTTP_ERROR',
              details: responseData?.details,
              hint: responseData?.hint
            });
          } else {
            DebugLogger.logSupabaseResponse(method, url, responseData);
          }
          
          return response;
        } catch (error) {
          DebugLogger.logSupabaseResponse(method, url, null, error);
          throw error;
        }
      }
      
      return originalFetch(input, init);
    };
  }

  // Proxy all Supabase methods with debugging
  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get realtime() {
    return this.client.realtime;
  }

  from(table: string) {
    const query = this.client.from(table);
    
    // Add debugging to common operations
    const originalSelect = query.select.bind(query);
    const originalInsert = query.insert.bind(query);
    const originalUpdate = query.update.bind(query);
    const originalDelete = query.delete.bind(query);
    const originalUpsert = query.upsert.bind(query);

    query.select = (...args) => {
      DebugLogger.info('SUPABASE_QUERY', `SELECT from ${table}`, args);
      return originalSelect(...args);
    };

    query.insert = (...args) => {
      DebugLogger.info('SUPABASE_QUERY', `INSERT into ${table}`, args);
      return originalInsert(...args);
    };

    query.update = (...args) => {
      DebugLogger.info('SUPABASE_QUERY', `UPDATE ${table}`, args);
      return originalUpdate(...args);
    };

    query.delete = (...args) => {
      DebugLogger.info('SUPABASE_QUERY', `DELETE from ${table}`, args);
      return originalDelete(...args);
    };

    query.upsert = (...args) => {
      DebugLogger.info('SUPABASE_QUERY', `UPSERT into ${table}`, args);
      return originalUpsert(...args);
    };

    return query;
  }

  rpc(fn: string, args?: any) {
    DebugLogger.info('SUPABASE_RPC', `RPC call: ${fn}`, args);
    return this.client.rpc(fn, args);
  }

  // Test connection method
  async testConnection() {
    DebugLogger.info('CONNECTION_TEST', 'Testing Supabase connection...');
    
    try {
      // Test 1: Basic connectivity
      const { data: healthCheck, error: healthError } = await this.client
        .from('dao_organizations')
        .select('id')
        .limit(1);
      
      if (healthError) {
        DebugLogger.error('CONNECTION_TEST', 'Health check failed', healthError);
        return { success: false, error: healthError };
      }
      
      DebugLogger.info('CONNECTION_TEST', 'Health check passed', healthCheck);
      
      // Test 2: Auth status
      const { data: { user }, error: authError } = await this.client.auth.getUser();
      DebugLogger.info('CONNECTION_TEST', 'Auth status', { user: user?.id, error: authError });
      
      // Test 3: RPC functions
      try {
        const { data: rpcTest, error: rpcError } = await this.client.rpc('is_admin');
        DebugLogger.info('CONNECTION_TEST', 'RPC test', { data: rpcTest, error: rpcError });
      } catch (rpcError) {
        DebugLogger.error('CONNECTION_TEST', 'RPC test failed', rpcError);
      }
      
      return { success: true, data: { healthCheck, user } };
    } catch (error) {
      DebugLogger.error('CONNECTION_TEST', 'Connection test failed', error);
      return { success: false, error };
    }
  }
}

// Export the debug client
export const supabase = new DebugSupabaseClient();

// Export debug utilities
export { DebugLogger };



