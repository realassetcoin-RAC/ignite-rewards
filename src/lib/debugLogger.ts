// Comprehensive Debug Logger for Supabase Issues
export class DebugLogger {
  private static isEnabled = true;
  private static logs: any[] = [];

  static enable() {
    this.isEnabled = true;
    console.log('🔍 Debug logging enabled');
  }

  static disable() {
    this.isEnabled = false;
  }

  static log(level: 'info' | 'warn' | 'error', category: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    // Color-coded console output
    const colors = {
      info: '#2196F3',
      warn: '#FF9800',
      error: '#F44336'
    };

    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    console.log(
      `%c${emoji[level]} [${category}] ${message}`,
      `color: ${colors[level]}; font-weight: bold;`,
      data || ''
    );

    // Also log to console.error for errors to ensure visibility
    if (level === 'error') {
      console.error(`[${category}] ${message}`, data);
    }
  }

  static info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  static warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  static error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs() {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Supabase-specific logging methods
  static logSupabaseRequest(method: string, url: string, data?: any) {
    this.info('SUPABASE_REQUEST', `${method} ${url}`, {
      method,
      url,
      data,
      timestamp: Date.now()
    });
  }

  static logSupabaseResponse(method: string, url: string, response: any, error?: any) {
    if (error) {
      this.error('SUPABASE_RESPONSE', `${method} ${url} - ERROR`, {
        method,
        url,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        response,
        timestamp: Date.now()
      });
    } else {
      this.info('SUPABASE_RESPONSE', `${method} ${url} - SUCCESS`, {
        method,
        url,
        response,
        timestamp: Date.now()
      });
    }
  }

  static logAuthState(authState: string, user?: any) {
    this.info('AUTH_STATE', authState, {
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      timestamp: Date.now()
    });
  }

  static logDAOOperation(operation: string, data?: any, error?: any) {
    if (error) {
      this.error('DAO_OPERATION', `${operation} - ERROR`, {
        operation,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        data,
        timestamp: Date.now()
      });
    } else {
      this.info('DAO_OPERATION', `${operation} - SUCCESS`, {
        operation,
        data,
        timestamp: Date.now()
      });
    }
  }
}

// Global debug object for easy access
(window as any).debugLogger = DebugLogger;








