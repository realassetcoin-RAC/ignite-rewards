/**
 * Enhanced Error Tracking for Virtual Card Operations
 * 
 * This module provides detailed error tracking and diagnostics specifically
 * for virtual card creation and management operations in the admin dashboard.
 */

import { logger, log } from './logger';

export interface VirtualCardError {
  id: string;
  timestamp: string;
  operation: 'create' | 'update' | 'delete' | 'load';
  errorType: 'permission' | 'validation' | 'network' | 'database' | 'unknown';
  errorCode?: string;
  errorMessage: string;
  originalError: any;
  cardData?: any;
  userId?: string;
  adminUserId?: string;
  context: {
    component: string;
    function: string;
    stackTrace?: string;
    userAgent: string;
    url: string;
    sessionId: string;
  };
  resolution?: {
    attempted: string[];
    successful?: string;
    timestamp?: string;
  };
}

class VirtualCardErrorTracker {
  private errors: VirtualCardError[] = [];
  private maxErrors = 100;

  constructor() {
    log.info('VIRTUAL_CARD_ERROR_TRACKER', 'Virtual Card Error Tracker initialized');
  }

  /**
   * Track a virtual card operation error with detailed context
   */
  trackError(
    operation: VirtualCardError['operation'],
    error: any,
    cardData?: any,
    context?: Partial<VirtualCardError['context']>
  ): string {
    const errorId = `vc_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const virtualCardError: VirtualCardError = {
      id: errorId,
      timestamp: new Date().toISOString(),
      operation,
      errorType: this.categorizeError(error),
      errorCode: this.extractErrorCode(error),
      errorMessage: this.extractErrorMessage(error),
      originalError: this.sanitizeError(error),
      cardData: this.sanitizeCardData(cardData),
      userId: this.getCurrentUserId(),
      adminUserId: this.getAdminUserId(),
      context: {
        component: context?.component || 'Unknown',
        function: context?.function || 'Unknown',
        stackTrace: error?.stack || new Error().stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: logger.getSessionId(),
        ...context
      }
    };

    // Add to local storage
    this.errors.push(virtualCardError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log with appropriate level
    log.error('VIRTUAL_CARD_ERROR', `${operation} operation failed: ${virtualCardError.errorMessage}`, {
      errorId,
      errorType: virtualCardError.errorType,
      cardData: virtualCardError.cardData,
      context: virtualCardError.context
    }, error);

    // Store in localStorage for persistence
    this.persistErrors();

    // Attempt automatic diagnostics
    this.runDiagnostics(virtualCardError);

    return errorId;
  }

  /**
   * Categorize error type based on error properties
   */
  private categorizeError(error: any): VirtualCardError['errorType'] {
    if (!error) return 'unknown';

    const errorString = JSON.stringify(error).toLowerCase();
    const message = (error.message || '').toLowerCase();
    const code = error.code || error.status;

    // Permission errors
    if (
      message.includes('permission denied') ||
      message.includes('insufficient privileges') ||
      message.includes('not authorized') ||
      code === 42501 ||
      code === 403 ||
      errorString.includes('42501') ||
      errorString.includes('permission')
    ) {
      return 'permission';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('constraint') ||
      message.includes('invalid') ||
      message.includes('required') ||
      code === 23505 || // Unique constraint
      code === 23503 || // Foreign key constraint
      code === 23514 || // Check constraint
      code === 400
    ) {
      return 'validation';
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      code >= 500 ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError' && message.includes('fetch')
    ) {
      return 'network';
    }

    // Database errors
    if (
      message.includes('database') ||
      message.includes('sql') ||
      message.includes('relation') ||
      message.includes('table') ||
      message.includes('column') ||
      code?.toString().startsWith('42') // PostgreSQL syntax errors
    ) {
      return 'database';
    }

    return 'unknown';
  }

  /**
   * Extract error code from various error formats
   */
  private extractErrorCode(error: any): string | undefined {
    if (!error) return undefined;
    
    return error.code || 
           error.status || 
           error.statusCode || 
           error.error_code ||
           error.details?.code ||
           undefined;
  }

  /**
   * Extract human-readable error message
   */
  private extractErrorMessage(error: any): string {
    if (!error) return 'Unknown error occurred';

    if (typeof error === 'string') return error;
    
    return error.message || 
           error.error || 
           error.details?.message ||
           error.statusText ||
           JSON.stringify(error);
  }

  /**
   * Sanitize error object for storage (remove circular references, etc.)
   */
  private sanitizeError(error: any): any {
    if (!error) return null;

    try {
      return JSON.parse(JSON.stringify(error, (key, value) => {
        if (key.startsWith('_') || typeof value === 'function') {
          return undefined;
        }
        return value;
      }));
    } catch {
      return {
        message: error.message || 'Error serialization failed',
        name: error.name,
        code: error.code,
        stack: error.stack?.substring(0, 500) // Limit stack trace size
      };
    }
  }

  /**
   * Sanitize card data (remove sensitive information)
   */
  private sanitizeCardData(cardData: any): any {
    if (!cardData) return null;

    try {
      const sanitized = { ...cardData };
      
      // Remove potentially sensitive fields
      delete sanitized.id;
      delete sanitized.user_id;
      delete sanitized.created_at;
      delete sanitized.updated_at;
      
      // Truncate long strings
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
          sanitized[key] = sanitized[key].substring(0, 200) + '...';
        }
      });

      return sanitized;
    } catch {
      return { error: 'Card data sanitization failed' };
    }
  }

  /**
   * Get current user ID from auth
   */
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('sb-wndswqvqogeblksrujpg-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  /**
   * Get admin user ID (if current user is admin)
   */
  private getAdminUserId(): string | undefined {
    // For now, same as current user ID
    // Could be enhanced to track which admin is performing the action
    return this.getCurrentUserId();
  }

  /**
   * Persist errors to localStorage
   */
  private persistErrors(): void {
    try {
      localStorage.setItem('pointbridge_virtual_card_errors', JSON.stringify(this.errors));
    } catch (e) {
      log.warn('VIRTUAL_CARD_ERROR_TRACKER', 'Failed to persist errors to localStorage', { error: e });
    }
  }

  /**
   * Load persisted errors from localStorage
   */
  private loadPersistedErrors(): void {
    try {
      const stored = localStorage.getItem('pointbridge_virtual_card_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
        log.info('VIRTUAL_CARD_ERROR_TRACKER', `Loaded ${this.errors.length} persisted errors`);
      }
    } catch (e) {
      log.warn('VIRTUAL_CARD_ERROR_TRACKER', 'Failed to load persisted errors', { error: e });
    }
  }

  /**
   * Run automatic diagnostics for the error
   */
  private async runDiagnostics(error: VirtualCardError): Promise<void> {
    log.debug('VIRTUAL_CARD_ERROR_TRACKER', `Running diagnostics for error ${error.id}`);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      errorId: error.id,
      checks: [] as Array<{ name: string; result: string; success: boolean }>
    };

    // Check 1: Database connection
    try {
      const { error: dbError } = await supabase.from('virtual_cards').select('count').limit(1);
      diagnostics.checks.push({
        name: 'Database Connection',
        result: dbError ? `Failed: ${dbError.message}` : 'Success',
        success: !dbError
      });
    } catch (e) {
      diagnostics.checks.push({
        name: 'Database Connection',
        result: `Failed: ${e}`,
        success: false
      });
    }

    // Check 2: Table access
    try {
      const { error: tableError } = await supabase
        .from('virtual_cards')
        .select('id')
        .limit(1);
      
      diagnostics.checks.push({
        name: 'Virtual Cards Table Access',
        result: tableError ? `Failed: ${tableError.message}` : 'Success',
        success: !tableError
      });
    } catch (e) {
      diagnostics.checks.push({
        name: 'Virtual Cards Table Access',
        result: `Failed: ${e}`,
        success: false
      });
    }

    // Check 3: User authentication
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      diagnostics.checks.push({
        name: 'User Authentication',
        result: authError ? `Failed: ${authError.message}` : user ? 'Authenticated' : 'Not authenticated',
        success: !authError && !!user
      });
    } catch (e) {
      diagnostics.checks.push({
        name: 'User Authentication',
        result: `Failed: ${e}`,
        success: false
      });
    }

    // Check 4: Admin permissions (if applicable)
    if (error.operation === 'create' || error.operation === 'update') {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .single();

        diagnostics.checks.push({
          name: 'Admin Role Check',
          result: profileError ? `Failed: ${profileError.message}` : `Role: ${profile?.role || 'unknown'}`,
          success: !profileError && profile?.role === 'admin'
        });
      } catch (e) {
        diagnostics.checks.push({
          name: 'Admin Role Check',
          result: `Failed: ${e}`,
          success: false
        });
      }
    }

    log.info('VIRTUAL_CARD_ERROR_TRACKER', `Diagnostics completed for error ${error.id}`, diagnostics);

    // Store diagnostics with the error
    const errorIndex = this.errors.findIndex(e => e.id === error.id);
    if (errorIndex >= 0) {
      this.errors[errorIndex].resolution = {
        attempted: ['automatic_diagnostics'],
        timestamp: new Date().toISOString()
      };
      this.persistErrors();
    }
  }

  /**
   * Get all tracked errors
   */
  getErrors(filter?: {
    operation?: VirtualCardError['operation'];
    errorType?: VirtualCardError['errorType'];
    since?: Date;
  }): VirtualCardError[] {
    let filtered = [...this.errors];

    if (filter?.operation) {
      filtered = filtered.filter(e => e.operation === filter.operation);
    }

    if (filter?.errorType) {
      filtered = filtered.filter(e => e.errorType === filter.errorType);
    }

    if (filter?.since) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= filter.since!);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byOperation: Record<string, number>;
    byType: Record<string, number>;
    recent: number; // Last hour
    resolved: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stats = {
      total: this.errors.length,
      byOperation: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      recent: 0,
      resolved: 0
    };

    this.errors.forEach(error => {
      // By operation
      stats.byOperation[error.operation] = (stats.byOperation[error.operation] || 0) + 1;
      
      // By type
      stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1;
      
      // Recent
      if (new Date(error.timestamp) >= oneHourAgo) {
        stats.recent++;
      }
      
      // Resolved
      if (error.resolution?.successful) {
        stats.resolved++;
      }
    });

    return stats;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem('pointbridge_virtual_card_errors');
    log.info('VIRTUAL_CARD_ERROR_TRACKER', 'All virtual card errors cleared');
  }

  /**
   * Export errors for analysis
   */
  exportErrors(): string {
    return JSON.stringify({
      exported: new Date().toISOString(),
      sessionId: logger.getSessionId(),
      stats: this.getErrorStats(),
      errors: this.errors
    }, null, 2);
  }

  /**
   * Get the most recent error
   */
  getLastError(): VirtualCardError | null {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }

  /**
   * Mark an error as resolved
   */
  markResolved(errorId: string, resolution: string): void {
    const errorIndex = this.errors.findIndex(e => e.id === errorId);
    if (errorIndex >= 0) {
      if (!this.errors[errorIndex].resolution) {
        this.errors[errorIndex].resolution = { attempted: [] };
      }
      this.errors[errorIndex].resolution!.successful = resolution;
      this.errors[errorIndex].resolution!.timestamp = new Date().toISOString();
      this.persistErrors();
      
      log.info('VIRTUAL_CARD_ERROR_TRACKER', `Error ${errorId} marked as resolved: ${resolution}`);
    }
  }
}

// Create singleton instance
export const virtualCardErrorTracker = new VirtualCardErrorTracker();

// Export convenience functions
export const trackVirtualCardError = (
  operation: VirtualCardError['operation'],
  error: any,
  cardData?: any,
  context?: Partial<VirtualCardError['context']>
): string => {
  return virtualCardErrorTracker.trackError(operation, error, cardData, context);
};

export const getVirtualCardErrors = (filter?: Parameters<typeof virtualCardErrorTracker.getErrors>[0]) => {
  return virtualCardErrorTracker.getErrors(filter);
};

export const getVirtualCardErrorStats = () => {
  return virtualCardErrorTracker.getErrorStats();
};

export default virtualCardErrorTracker;