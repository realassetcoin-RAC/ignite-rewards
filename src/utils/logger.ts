/**
 * Comprehensive Logging System for PointBridge Application
 * 
 * This logger provides detailed error tracking, debugging information,
 * and performance monitoring for the admin dashboard and virtual card functionality.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stackTrace?: string;
}

class Logger {
  private logLevel: LogLevel = LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    // Generate unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.TRACE;
    } else if (import.meta.env.PROD) {
      this.logLevel = LogLevel.ERROR;
    }

    // Enable console debugging in development
    if (import.meta.env.DEV) {
      console.log(`🚀 Logger initialized with level: ${LogLevel[this.logLevel]} (Session: ${this.sessionId})`);
    }

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('UNHANDLED_ERROR', 'Unhandled JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UNHANDLED_PROMISE_REJECTION', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (data) {
      entry.data = data;
    }

    if (error) {
      entry.error = error;
      entry.stackTrace = error.stack;
    }

    // Add user ID if available
    try {
      const user = JSON.parse(localStorage.getItem('sb-wndswqvqogeblksrujpg-auth-token') || '{}');
      if (user?.user?.id) {
        entry.userId = user.user.id;
      }
    } catch {
      // Ignore errors when getting user ID
    }

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const levelName = LogLevel[entry.level];
      const emoji = this.getLogEmoji(entry.level);
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      
      console.group(`${emoji} [${levelName}] ${entry.category} - ${timestamp}`);
      console.log(`Message: ${entry.message}`);
      
      if (entry.data) {
        console.log('Data:', entry.data);
      }
      
      if (entry.error) {
        console.error('Error:', entry.error);
      }
      
      if (entry.stackTrace) {
        console.log('Stack Trace:', entry.stackTrace);
      }
      
      console.groupEnd();
    }
  }

  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🐛';
      case LogLevel.TRACE: return '🔍';
      default: return '📝';
    }
  }

  // Public logging methods
  error(category: string, message: string, data?: any, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, category, message, data, error);
      this.addLog(entry);
    }
  }

  warn(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, category, message, data);
      this.addLog(entry);
    }
  }

  info(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, category, message, data);
      this.addLog(entry);
    }
  }

  debug(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data);
      this.addLog(entry);
    }
  }

  trace(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      const entry = this.createLogEntry(LogLevel.TRACE, category, message, data);
      this.addLog(entry);
    }
  }

  // Specialized logging methods for common scenarios
  apiCall(method: string, url: string, data?: any, response?: any, error?: Error): void {
    const category = 'API_CALL';
    const message = `${method} ${url}`;
    
    if (error) {
      this.error(category, `${message} - Failed`, { data, response }, error);
    } else {
      this.debug(category, `${message} - Success`, { data, response });
    }
  }

  supabaseOperation(operation: string, table: string, data?: any, result?: any, error?: Error): void {
    const category = 'SUPABASE';
    const message = `${operation} on ${table}`;
    
    if (error) {
      this.error(category, `${message} - Failed`, { data, result }, error);
    } else {
      this.debug(category, `${message} - Success`, { data, result });
    }
  }

  userAction(action: string, component: string, data?: any, error?: Error): void {
    const category = 'USER_ACTION';
    const message = `${action} in ${component}`;
    
    if (error) {
      this.error(category, `${message} - Failed`, data, error);
    } else {
      this.info(category, `${message} - Success`, data);
    }
  }

  virtualCardOperation(operation: string, cardData?: any, error?: Error): void {
    const category = 'VIRTUAL_CARD';
    const message = `Virtual card ${operation}`;
    
    if (error) {
      this.error(category, `${message} - Failed`, cardData, error);
    } else {
      this.info(category, `${message} - Success`, cardData);
    }
  }

  adminOperation(operation: string, adminData?: any, error?: Error): void {
    const category = 'ADMIN';
    const message = `Admin ${operation}`;
    
    if (error) {
      this.error(category, `${message} - Failed`, adminData, error);
    } else {
      this.info(category, `${message} - Success`, adminData);
    }
  }

  // Utility methods
  getLogs(level?: LogLevel, category?: string, limit?: number): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogs(LogLevel.ERROR);
  }

  clearLogs(): void {
    this.logs = [];
    this.info('LOGGER', 'Log history cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getLogSummary(): { total: number; errors: number; warnings: number; infos: number; debugs: number; traces: number } {
    const summary = {
      total: this.logs.length,
      errors: 0,
      warnings: 0,
      infos: 0,
      debugs: 0,
      traces: 0
    };

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.ERROR: summary.errors++; break;
        case LogLevel.WARN: summary.warnings++; break;
        case LogLevel.INFO: summary.infos++; break;
        case LogLevel.DEBUG: summary.debugs++; break;
        case LogLevel.TRACE: summary.traces++; break;
      }
    });

    return summary;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('LOGGER', `Log level changed to ${LogLevel[level]}`);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Performance monitoring
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    this.trace('PERFORMANCE', `Started timer for ${operation}`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.debug('PERFORMANCE', `${operation} completed in ${duration.toFixed(2)}ms`, { duration });
    };
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  error: (category: string, message: string, data?: any, error?: Error) => logger.error(category, message, data, error),
  warn: (category: string, message: string, data?: any) => logger.warn(category, message, data),
  info: (category: string, message: string, data?: any) => logger.info(category, message, data),
  debug: (category: string, message: string, data?: any) => logger.debug(category, message, data),
  trace: (category: string, message: string, data?: any) => logger.trace(category, message, data),
  
  // Specialized loggers
  api: (method: string, url: string, data?: any, response?: any, error?: Error) => logger.apiCall(method, url, data, response, error),
  supabase: (operation: string, table: string, data?: any, result?: any, error?: Error) => logger.supabaseOperation(operation, table, data, result, error),
  user: (action: string, component: string, data?: any, error?: Error) => logger.userAction(action, component, data, error),
  virtualCard: (operation: string, cardData?: any, error?: Error) => logger.virtualCardOperation(operation, cardData, error),
  admin: (operation: string, adminData?: any, error?: Error) => logger.adminOperation(operation, adminData, error),
  
  // Utilities
  timer: (operation: string) => logger.startTimer(operation),
  summary: () => logger.getLogSummary(),
  export: () => logger.exportLogs(),
  clear: () => logger.clearLogs(),
  setLevel: (level: LogLevel) => logger.setLogLevel(level)
};

export default logger;