// Local Database API
// This API provides access to the local PostgreSQL database from the browser

import { environment } from '@/config/environment';

export interface LocalDatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export class LocalDatabaseAPI {
  private static baseUrl = 'http://localhost:3001/api/local-db';

  static async query<T = any>(
    table: string,
    columns: string = '*',
    whereColumn?: string,
    whereValue?: any,
    orderColumn?: string,
    ascending: boolean = true,
    limit?: number
  ): Promise<LocalDatabaseResponse<T>> {
    try {
      const params = new URLSearchParams({
        table,
        columns,
        ...(whereColumn && whereValue !== undefined && { whereColumn, whereValue: String(whereValue) }),
        ...(orderColumn && { orderColumn, ascending: String(ascending) }),
        ...(limit && { limit: String(limit) })
      });

      const response = await fetch(`${this.baseUrl}/query?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Local database query error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async insert<T = any>(
    table: string,
    data: any,
    columns: string = '*'
  ): Promise<LocalDatabaseResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table, data, columns })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Local database insert error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async update<T = any>(
    table: string,
    data: any,
    whereColumn: string,
    whereValue: any,
    columns: string = '*'
  ): Promise<LocalDatabaseResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table, data, whereColumn, whereValue, columns })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Local database update error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async delete(
    table: string,
    whereColumn: string,
    whereValue: any
  ): Promise<LocalDatabaseResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table, whereColumn, whereValue })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Local database delete error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
