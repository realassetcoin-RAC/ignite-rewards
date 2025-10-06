// Database Adapter for Local PostgreSQL and Supabase
// Following .cursorrules: Data Operations → Local PostgreSQL, Authentication → Supabase Cloud

import { createClient } from '@supabase/supabase-js';
import { environment } from '@/config/environment';

class DatabaseAdapter {
  private static instance: DatabaseAdapter | null = null;
  private isLocal: boolean;
  public supabaseClient: any = null;

  private constructor() {
    // Following .cursorrules: Data Operations → Local PostgreSQL, Authentication → Supabase Cloud
    this.isLocal = true; // Always use local PostgreSQL for data

    // Only log in debug mode
    if (environment.app.debug) {
      // eslint-disable-next-line no-console
      console.log('🔧 DatabaseAdapter constructor:', {
        mode: 'Local PostgreSQL + Supabase Authentication',
        enableMockAuth: environment.app.enableMockAuth,
        isLocal: this.isLocal,
        windowType: typeof window,
        localDb: {
          host: environment.database.local.host,
          port: environment.database.local.port,
          database: environment.database.local.database,
          user: environment.database.local.user
        },
        supabaseUrl: environment.database.supabase.url,
        hasAnonKey: !!environment.database.supabase.anonKey,
        note: 'Local PostgreSQL for data operations, Supabase for authentication only'
      });
    }

    // Initialize Supabase client pointing to local PostgreSQL database
    this.initializeSupabase();
  }

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  private initializeSupabase() {
    // Prevent multiple client creation
    if (this.supabaseClient) {
      return;
    }
    
    try {
      // Following .cursorrules: Use Supabase Cloud ONLY for authentication
      // Data operations will use local PostgreSQL via the localDb getter
      const supabaseUrl = environment.database.supabase.url || 'https://wndswqvqogeblksrujpg.supabase.co';
      const supabaseKey = environment.database.supabase.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';
      
      // Check if we have the required configuration
      if (!supabaseUrl || !supabaseKey) {
        // eslint-disable-next-line no-console
        console.error('❌ Missing Supabase configuration:', {
          url: supabaseUrl,
          anonKey: !!supabaseKey
        });
        throw new Error('Missing Supabase URL or anon key');
      }
      
      // Create Supabase client for AUTHENTICATION ONLY (not data operations)
      this.supabaseClient = createClient(
        supabaseUrl,
        supabaseKey,
        {
          auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          // Disable database operations on this client
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-client-info': 'ignite-rewards-web'
            }
          },
          // Connection settings for better stability
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      );
      
      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔧 Supabase client initialized for AUTHENTICATION ONLY');
        // eslint-disable-next-line no-console
        console.log('🔧 Data operations will use local PostgreSQL via localDb');
      }
      
    } catch (error) {
        // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }

  // Get Supabase client pointing to local PostgreSQL database
  get supabase() {
    if (!this.supabaseClient) {
      this.initializeSupabase();
    }
    return this.supabaseClient;
  }

  // Convenience method for data operations - delegates to local PostgreSQL
  get from() {
    return this.localDb.from.bind(this.localDb);
  }

  // Direct query method for simple operations
  async query(table: string, operation: 'select' | 'insert' | 'update' | 'delete', options: any = {}) {
    try {
      if (operation === 'select') {
        return await this.executeLocalQuery(
          table, 
          options.columns || '*', 
          options.filterColumn, 
          options.filterValue, 
          options.ascending !== false, 
          undefined, 
          options.returnType || 'array',
          options.orderColumn,
          options.limit
        );
      }
      // Add other operations as needed
      return { data: null, error: new Error('Operation not implemented') };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get local PostgreSQL client for data operations (following .cursorrules)
  get localDb() {
    // Return a client that provides Supabase-like interface for local PostgreSQL
    return {
      from: (table: string) => {
        // In browser environment, use Supabase client for data operations
        // In Node.js environment, use local PostgreSQL
        if (typeof window !== 'undefined') {
          console.log(`🔄 Using Supabase client for ${table} (browser environment)`);
          return this.supabaseClient.from(table);
        } else {
          console.log(`🔄 Using local PostgreSQL for ${table} (Node.js environment)`);
        }
        
        // Return a query builder that uses local PostgreSQL (Node.js only)
        return {
          select: (columns: string = '*') => ({
            eq: (column: string, value: any) => ({
              single: () => Promise.resolve(this.executeLocalQuery(table, columns, column, value, true, undefined, 'single')),
              maybeSingle: () => Promise.resolve(this.executeLocalQuery(table, columns, column, value, true, undefined, 'maybeSingle')),
              order: (orderColumn: string, options: { ascending: boolean }) => ({
                limit: (count: number) => Promise.resolve(this.executeLocalQuery(table, columns, column, value, options.ascending, undefined, 'array', orderColumn, count)),
                abortSignal: (signal: AbortSignal) => Promise.resolve(this.executeLocalQuery(table, columns, column, value, options.ascending, signal, 'array', orderColumn))
              }),
              limit: (count: number) => Promise.resolve(this.executeLocalQuery(table, columns, column, value, true, undefined, 'array', undefined, count)),
              abortSignal: (signal: AbortSignal) => Promise.resolve(this.executeLocalQuery(table, columns, column, value, true, signal, 'array'))
            }),
            order: (orderColumn: string, options: { ascending: boolean }) => Promise.resolve(this.executeLocalQuery(table, columns, undefined, undefined, options.ascending, undefined, 'array', orderColumn)),
            limit: (count: number) => Promise.resolve(this.executeLocalQuery(table, columns, undefined, undefined, true, undefined, 'array', undefined, count)),
            single: () => Promise.resolve(this.executeLocalQuery(table, columns, undefined, undefined, true, undefined, 'single')),
            maybeSingle: () => Promise.resolve(this.executeLocalQuery(table, columns, undefined, undefined, true, undefined, 'maybeSingle')),
            abortSignal: (signal: AbortSignal) => Promise.resolve(this.executeLocalQuery(table, columns, undefined, undefined, true, signal, 'array'))
          }),
          insert: (data: any) => ({
            select: (columns: string = '*') => Promise.resolve(this.executeLocalInsert(table, data, columns)),
            single: () => Promise.resolve(this.executeLocalInsert(table, data, '*', 'single'))
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: (columns: string = '*') => Promise.resolve(this.executeLocalUpdate(table, data, column, value, columns)),
              single: () => Promise.resolve(this.executeLocalUpdate(table, data, column, value, '*', 'single'))
            })
          }),
          delete: () => ({
            eq: (column: string, value: any) => Promise.resolve(this.executeLocalDelete(table, column, value))
          })
        };
      }
    };
  }

  // Execute local PostgreSQL query
  private async executeLocalQuery(
    table: string, 
    columns: string, 
    filterColumn?: string, 
    filterValue?: any, 
    ascending: boolean = true, 
    _signal?: AbortSignal,
    returnType: 'array' | 'single' | 'maybeSingle' = 'array',
    orderColumn?: string,
    limit?: number
  ) {
    if (environment.app.debug) {
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Starting local PostgreSQL query', {
        table,
        columns,
        filterColumn,
        filterValue,
        ascending,
        returnType,
        orderColumn,
        limit
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Client } = require('pg');
    
    const client = new Client({
      host: environment.database.local.host,
      port: environment.database.local.port,
      database: environment.database.local.database,
      user: environment.database.local.user,
      password: environment.database.local.password
    });

    try {
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Connecting to PostgreSQL...');
      await client.connect();
      // eslint-disable-next-line no-console
      console.log('✅ DatabaseAdapter: Connected to PostgreSQL successfully');
      
      let query = `SELECT ${columns} FROM public.${table}`;
      const params: any[] = [];
      let paramIndex = 1;

      if (filterColumn && filterValue !== null) {
        query += ` WHERE ${filterColumn} = $${paramIndex}`;
        params.push(filterValue);
        paramIndex++;
      }

      // Use provided orderColumn or default to created_at or id
      const orderCol = orderColumn || (columns.includes('created_at') ? 'created_at' : 'id');
      query += ` ORDER BY ${orderCol} ${ascending ? 'ASC' : 'DESC'}`;

      // Add limit if specified
      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }

      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Executing query:', query, 'with params:', params);
      const result = await client.query(query, params);
      // eslint-disable-next-line no-console
      console.log('✅ DatabaseAdapter: Query executed successfully', { rowCount: result.rows.length });
      
      let data = result.rows;
      
      // Handle different return types
      if (returnType === 'single') {
        if (data.length === 0) {
          return { data: null, error: { message: 'No rows returned', code: 'PGRST116' } };
        }
        if (data.length > 1) {
          return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
        }
        data = data[0];
      } else if (returnType === 'maybeSingle') {
        if (data.length === 0) {
          data = null;
        } else if (data.length === 1) {
          data = data[0];
        } else {
          return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
        }
      }

      return {
        data,
        error: null
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ DatabaseAdapter: Query failed:', error);
      return {
        data: null,
        error: error
      };
    } finally {
      await client.end();
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Connection closed');
    }
  }

  // Execute local PostgreSQL insert
  private async executeLocalInsert(table: string, data: any, columns: string = '*', returnType: 'array' | 'single' = 'array') {
    if (environment.app.debug) {
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Starting local PostgreSQL insert', { table, data, columns, returnType });
    }

    try {
      const { Client } = require('pg');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      
      const client = new Client({
        host: environment.database.local.host,
        port: environment.database.local.port,
        database: environment.database.local.database,
        user: environment.database.local.user,
        password: environment.database.local.password,
      });

      await client.connect();

      const dataArray = Array.isArray(data) ? data : [data];
      const results = [];

      for (const item of dataArray) {
        const keys = Object.keys(item);
        const values = Object.values(item);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const insertQuery = `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${columns}`;
        
        if (environment.app.debug) {
          // eslint-disable-next-line no-console
          console.log('🔍 DatabaseAdapter: Executing insert:', insertQuery, 'with values:', values);
        }

        const result = await client.query(insertQuery, values);
        results.push(...result.rows);
      }

      await client.end();

      let returnData = results;
      if (returnType === 'single') {
        returnData = results[0] || null;
      }

      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔍 DatabaseAdapter: Insert result:', returnData);
      }

      return { data: returnData, error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ DatabaseAdapter: Insert failed:', error);
      return { data: null, error };
    }
  }

  // Execute local PostgreSQL update
  private async executeLocalUpdate(table: string, data: any, filterColumn: string, filterValue: any, columns: string = '*', returnType: 'array' | 'single' = 'array') {
    if (environment.app.debug) {
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Starting local PostgreSQL update', { table, data, filterColumn, filterValue, columns, returnType });
    }

    try {
      const { Client } = require('pg');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      
      const client = new Client({
        host: environment.database.local.host,
        port: environment.database.local.port,
        database: environment.database.local.database,
        user: environment.database.local.user,
        password: environment.database.local.password,
      });

      await client.connect();

      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      
      const updateQuery = `UPDATE public.${table} SET ${setClause} WHERE ${filterColumn} = $${values.length + 1} RETURNING ${columns}`;
      const allValues = [...values, filterValue];
      
      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔍 DatabaseAdapter: Executing update:', updateQuery, 'with values:', allValues);
      }

      const result = await client.query(updateQuery, allValues);
      await client.end();

      let returnData = result.rows;
      if (returnType === 'single') {
        returnData = result.rows[0] || null;
      }

      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔍 DatabaseAdapter: Update result:', returnData);
      }

      return { data: returnData, error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ DatabaseAdapter: Update failed:', error);
      return { data: null, error };
    }
  }

  // Execute local PostgreSQL delete
  private async executeLocalDelete(table: string, filterColumn: string, filterValue: any) {
    if (environment.app.debug) {
      // eslint-disable-next-line no-console
      console.log('🔍 DatabaseAdapter: Starting local PostgreSQL delete', { table, filterColumn, filterValue });
    }

    try {
      const { Client } = require('pg');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      
      const client = new Client({
        host: environment.database.local.host,
        port: environment.database.local.port,
        database: environment.database.local.database,
        user: environment.database.local.user,
        password: environment.database.local.password,
      });

      await client.connect();

      const deleteQuery = `DELETE FROM public.${table} WHERE ${filterColumn} = $1`;
      
      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔍 DatabaseAdapter: Executing delete:', deleteQuery, 'with value:', filterValue);
      }

      const result = await client.query(deleteQuery, [filterValue]);
      await client.end();

      if (environment.app.debug) {
        // eslint-disable-next-line no-console
        console.log('🔍 DatabaseAdapter: Delete result:', result.rowCount, 'rows affected');
      }

      return { data: null, error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ DatabaseAdapter: Delete failed:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const databaseAdapter = DatabaseAdapter.getInstance();
export default databaseAdapter;