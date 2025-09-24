// Local Database Service for PostgreSQL
// This service provides database operations for local development

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class LocalDatabaseService {
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
      database: import.meta.env.VITE_DB_NAME || 'ignite_rewards',
      user: import.meta.env.VITE_DB_USER || 'postgres',
      password: import.meta.env.VITE_DB_PASSWORD || 'your_password'
    };
  }

  // Mock Supabase-like interface for compatibility
  async from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            console.log(`Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`);
            return { data: null, error: null };
          },
          then: async (callback: any) => {
            const result = { data: null, error: null };
            return callback(result);
          }
        }),
        then: async (callback: any) => {
          const result = { data: [], error: null };
          return callback(result);
        }
      }),
      insert: (data: any) => ({
        then: async (callback: any) => {
          console.log(`Mock insert: INSERT INTO ${table}`, data);
          const result = { data: null, error: null };
          return callback(result);
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            console.log(`Mock update: UPDATE ${table} SET`, data, `WHERE ${column} = ${value}`);
            const result = { data: null, error: null };
            return callback(result);
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            console.log(`Mock delete: DELETE FROM ${table} WHERE ${column} = ${value}`);
            const result = { data: null, error: null };
            return callback(result);
          }
        })
      })
    };
  }

  // Auth methods for compatibility
  get auth() {
    return {
      getUser: async () => {
        console.log('Mock auth.getUser()');
        return { data: { user: null }, error: null };
      },
      signInWithPassword: async (credentials: any) => {
        console.log('Mock auth.signInWithPassword()', credentials);
        return { data: { user: null, session: null }, error: null };
      },
      signUp: async (credentials: any) => {
        console.log('Mock auth.signUp()', credentials);
        return { data: { user: null, session: null }, error: null };
      },
      signOut: async () => {
        console.log('Mock auth.signOut()');
        return { error: null };
      }
    };
  }
}

// Create singleton instance
export const localDb = new LocalDatabaseService();

// Export as supabase for compatibility
export const supabase = localDb;
export default supabase;
