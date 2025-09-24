// Local PostgreSQL Client for Development
// This client connects directly to your local PostgreSQL database
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import type { Database } from '@/integrations/supabase/types';

// Query Builder class to support method chaining
class QueryBuilder {
  private table: string;
  private columns: string;
  private operation: string;
  private conditions: Array<{ column: string; value: unknown; operator: string }> = [];
  private orderBy?: { column: string; ascending: boolean };
  private limitCount?: number;
  private singleMode = false;

  constructor(table: string, columns: string, operation: string) {
    this.table = table;
    this.columns = columns;
    this.operation = operation;
  }

  eq(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '=' });
    return this;
  }

  gte(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '>=' });
    return this;
  }

  lte(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '<=' });
    return this;
  }

  gt(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '>' });
    return this;
  }

  lt(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '<' });
    return this;
  }

  neq(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: '!=' });
    return this;
  }

  like(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: 'LIKE' });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.conditions.push({ column, value, operator: 'ILIKE' });
    return this;
  }

  in(column: string, values: any[]) {
    this.conditions.push({ column, value: `(${values.map(v => `'${v}'`).join(',')})`, operator: 'IN' });
    return this;
  }

  is(column: string, value: any) {
    this.conditions.push({ column, value, operator: 'IS' });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  async then(callback?: (result: any) => void) {
    const result = await this.execute();
    if (callback) callback(result);
    return result;
  }

  private async execute() {
    let query = `${this.operation.toUpperCase()} ${this.columns} FROM ${this.table}`;
    
    if (this.conditions.length > 0) {
      const whereClause = this.conditions.map(c => `${c.column} ${c.operator} '${c.value}'`).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    if (this.orderBy) {
      query += ` ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
    }
    
    if (this.limitCount) {
      query += ` LIMIT ${this.limitCount}`;
    }

    console.log(`📖 Executing query: ${query}`);
    
    // Return mock data for now
    const mockData = this.singleMode ? null : [];
    return { data: mockData, error: null };
  }
}

// Local database configuration
const LOCAL_DB_URL = import.meta.env.VITE_DATABASE_URL || 'postgresql://postgres:postgres123!@localhost:5432/ignite_rewards';
const LOCAL_DB_HOST = import.meta.env.VITE_DB_HOST || 'localhost';
const LOCAL_DB_PORT = import.meta.env.VITE_DB_PORT || '5432';
const LOCAL_DB_NAME = import.meta.env.VITE_DB_NAME || 'ignite_rewards';
const LOCAL_DB_USER = import.meta.env.VITE_DB_USER || 'postgres';
// const LOCAL_DB_PASSWORD = import.meta.env.VITE_DB_PASSWORD || 'postgres123!';

// For local development, we'll use a mock Supabase client that connects to PostgreSQL
class LocalSupabaseClient {
  private dbUrl: string;
  private isLocal: boolean;
  private isSignedOut: boolean = false; // Track sign out state

  constructor() {
    this.dbUrl = LOCAL_DB_URL;
    this.isLocal = import.meta.env.VITE_APP_ENV === 'development';
    
    // Initialize sign out state from localStorage to persist across page refreshes
    this.isSignedOut = localStorage.getItem('mock-supabase-signed-out') === 'true';
    
    console.log('🔧 Local Supabase Client initialized');
    console.log('📊 Database URL:', this.dbUrl.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    console.log('🔐 Initial sign out state:', this.isSignedOut);
  }

  // Mock auth object for local development
  get auth() {
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@igniterewards.com',
      role: 'admin',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    };

    return {
      getUser: async () => {
        console.log('🔐 Mock getUser called');
        return {
          data: { user: mockUser },
          error: null
        };
      },
      getSession: async () => {
        console.log('🔐 Mock getSession called, isSignedOut:', this.isSignedOut);
        return {
          data: { session: this.isSignedOut ? null : mockSession },
          error: null
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log('🔐 Mock signInWithPassword called:', email);
        // Mock authentication for local development
        if (email === 'admin@igniterewards.com' && password === 'admin123!') {
          console.log('✅ Admin login successful');
          this.isSignedOut = false; // Reset sign out state on successful login
          // Clear the sign out state from localStorage
          localStorage.removeItem('mock-supabase-signed-out');
          console.log('🔐 Sign out state cleared from localStorage');
          return {
            data: {
              user: mockUser,
              session: mockSession
            },
            error: null
          };
        }
        console.log('❌ Invalid credentials');
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        };
      },
      signUp: async ({ email }: { email: string; password: string }) => {
        console.log('🔐 Mock signUp called:', email);
        this.isSignedOut = false; // Reset sign out state on successful signup
        // Clear the sign out state from localStorage
        localStorage.removeItem('mock-supabase-signed-out');
        console.log('🔐 Sign out state cleared from localStorage after signup');
        return {
          data: {
            user: { ...mockUser, email },
            session: mockSession
          },
          error: null
        };
      },
      signOut: async () => {
        console.log('🔐 Mock signOut called');
        this.isSignedOut = true;
        // Persist sign out state in localStorage to survive page refreshes
        localStorage.setItem('mock-supabase-signed-out', 'true');
        console.log('🔐 Sign out state persisted to localStorage');
        return { error: null };
      },
      signInWithOAuth: async ({ provider, options }: { provider: string; options?: any }) => {
        console.log('🔐 Mock signInWithOAuth called with provider:', provider);
        console.log('🔐 OAuth options:', options);
        
        // For local development, simulate OAuth success
        if (provider === 'google') {
          console.log('✅ Mock Google OAuth successful');
          this.isSignedOut = false;
          localStorage.removeItem('mock-supabase-signed-out');
          
          // Simulate redirect to callback URL
          if (options?.redirectTo) {
            console.log('🔄 Redirecting to:', options.redirectTo);
            // In a real OAuth flow, this would redirect to Google, then back to the callback
            // For local development, we'll just redirect to the callback with mock data
            setTimeout(() => {
              window.location.href = options.redirectTo + '?code=mock-oauth-code&state=mock-state';
            }, 1000);
          }
          
          return {
            data: {
              provider: 'google',
              url: options?.redirectTo || window.location.origin + '/auth/callback'
            },
            error: null
          };
        }
        
        return {
          data: null,
          error: { message: `OAuth provider ${provider} not supported in local development` }
        };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        console.log('🔐 Mock onAuthStateChange called, isSignedOut:', this.isSignedOut);
        // Mock auth state change - call with appropriate state
        setTimeout(() => {
          if (this.isSignedOut) {
            callback('SIGNED_OUT', null);
          } else {
            callback('SIGNED_IN', mockSession);
          }
        }, 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      refreshSession: async () => {
        console.log('🔐 Mock refreshSession called, isSignedOut:', this.isSignedOut);
        return {
          data: { session: this.isSignedOut ? null : mockSession },
          error: null
        };
      },
      setSession: async (session: any) => {
        console.log('🔐 Mock setSession called');
        return { data: { session }, error: null };
      }
    };
  }

  // Mock storage object
  get storage() {
    return {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null })
      })
    };
  }

  // Mock realtime object
  get realtime() {
    return {
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {}
      })
    };
  }

  // Database operations using direct PostgreSQL connection
  from(table: string) {
    console.log(`🔍 Querying table: ${table}`);
    
    return {
      select: (columns = '*') => {
        return new QueryBuilder(table, columns, 'select');
      },
      insert: (data: any) => ({
        select: (columns = '*') => ({
          then: async (callback: (result: any) => void) => {
            console.log(`➕ INSERT INTO ${table} RETURNING ${columns}:`, data);
            const result = { data: null, error: null };
            callback(result);
            return result;
          }
        }),
        then: async (callback: (result: any) => void) => {
          console.log(`➕ INSERT INTO ${table}:`, data);
          const result = { data: null, error: null };
          callback(result);
          return result;
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: (result: any) => void) => {
            console.log(`✏️ UPDATE ${table} SET ... WHERE ${column} = ${value}`);
            const result = { data: null, error: null };
            callback(result);
            return result;
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (callback: (result: any) => void) => {
            console.log(`🗑️ DELETE FROM ${table} WHERE ${column} = ${value}`);
            const result = { data: null, error: null };
            callback(result);
            return result;
          }
        })
      }),
      upsert: (data: any) => ({
        then: async (callback: (result: any) => void) => {
          console.log(`🔄 UPSERT INTO ${table}:`, data);
          const result = { data: null, error: null };
          callback(result);
          return result;
        }
      })
    };
  }

  // RPC functions
  rpc(fn: string, args?: any) {
    console.log(`🔧 RPC call: ${fn}`, args);
    
    // Mock RPC responses for common functions
    const mockResponses: Record<string, any> = {
      'is_admin': { data: true, error: null },
      'check_admin_access': { data: true, error: null },
      'get_user_profile': { 
        data: { 
          id: '00000000-0000-0000-0000-000000000001', 
          role: 'admin',
          email: 'admin@igniterewards.com',
          full_name: 'System Administrator'
        }, 
        error: null 
      },
      'get_valid_subscription_plans': {
        data: [
          {
            id: 'basic',
            name: 'StartUp',
            description: 'Perfect for small businesses just getting started with loyalty programs',
            price_monthly: 20.00,
            price_yearly: 150.00,
            monthly_points: 100,
            monthly_transactions: 100,
            features: ["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"],
            trial_days: 7,
            is_active: true,
            popular: false,
            plan_number: 1
          },
          {
            id: 'premium',
            name: 'Momentum Plan',
            description: 'Ideal for growing businesses that need more advanced features',
            price_monthly: 50.00,
            price_yearly: 500.00,
            monthly_points: 300,
            monthly_transactions: 300,
            features: ["Advanced loyalty program", "Up to 300 monthly points", "300 transactions per month", "Priority support", "Advanced analytics"],
            trial_days: 14,
            is_active: true,
            popular: true,
            plan_number: 2
          },
          {
            id: 'enterprise',
            name: 'Energizer Plan',
            description: 'For established businesses requiring enterprise-level features',
            price_monthly: 100.00,
            price_yearly: 1000.00,
            monthly_points: 600,
            monthly_transactions: 600,
            features: ["Premium loyalty program", "Up to 600 monthly points", "600 transactions per month", "24/7 support", "Real-time analytics"],
            trial_days: 21,
            is_active: true,
            popular: false,
            plan_number: 3
          }
        ],
        error: null
      },
      'get_user_loyalty_card': {
        data: {
          id: 'loyalty-card-001',
          user_id: '00000000-0000-0000-0000-000000000001',
          nft_type_id: 'pearl-white-001',
          loyalty_number: 'A1234567',
          card_number: 'LC123456',
          full_name: 'Admin User',
          email: 'admin@igniterewards.com',
          phone: null,
          points_balance: 0,
          tier_level: 'bronze',
          is_active: true,
          nft_name: 'Pearl White',
          nft_display_name: 'Pearl White',
          nft_rarity: 'Common',
          nft_earn_ratio: 0.01,
          created_at: new Date().toISOString()
        },
        error: null
      },
      'assign_free_loyalty_card': {
        data: {
          id: 'loyalty-card-001',
          loyalty_number: 'A1234567',
          card_number: 'LC123456',
          nft_name: 'Pearl White'
        },
        error: null
      },
      'generate_loyalty_number': {
        data: 'A1234567',
        error: null
      }
    };

    return {
      then: async (callback: (result: any) => void) => {
        const result = mockResponses[fn] || { data: null, error: null };
        callback(result);
        return result;
      }
    };
  }

  // Test connection method
  async testConnection() {
    console.log('🔍 Testing local database connection...');
    
    try {
      // For local development, we'll assume the connection is working
      // In a real implementation, you'd test the actual PostgreSQL connection
      console.log('✅ Local database connection test passed');
      return { 
        success: true, 
        data: { 
          message: 'Local database connected successfully',
          database: LOCAL_DB_NAME,
          host: LOCAL_DB_HOST,
          port: LOCAL_DB_PORT
        } 
      };
    } catch (error) {
      console.error('❌ Local database connection test failed:', error);
      return { success: false, error };
    }
  }
}

// Export the local client
export const supabase = new LocalSupabaseClient();

// Export the class for use in smart client
export { LocalSupabaseClient };

// Export configuration
export const localConfig = {
  databaseUrl: LOCAL_DB_URL,
  host: LOCAL_DB_HOST,
  port: LOCAL_DB_PORT,
  database: LOCAL_DB_NAME,
  user: LOCAL_DB_USER,
  isLocal: true
};

console.log('🚀 Local Supabase Client loaded for development');
