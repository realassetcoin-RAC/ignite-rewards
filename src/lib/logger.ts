/**
 * Centralized logging service for the RAC Rewards application
 * Replaces console.log statements with proper logging levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    
    return `${timestamp} ${levelName}${context}: ${entry.message}`;
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.formatEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(formatted, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(formatted, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(formatted, entry.data || '', entry.error || '');
        break;
    }

    // In production, you might want to send logs to a remote service
    if (!this.isDevelopment && entry.level >= LogLevel.ERROR) {
      this.sendToRemoteService(entry);
    }
  }

  /**
   * Send critical logs to remote service (implement as needed)
   */
  private sendToRemoteService(/* _entry: LogEntry */): void {
    // TODO: Implement remote logging service integration
    // This could be Sentry, LogRocket, or any other service
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: unknown, context?: string): void {
    this.output({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context,
      data
    });
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown, context?: string): void {
    this.output({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
      data
    });
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.output({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context,
      data
    });
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, data?: unknown, context?: string): void {
    this.output({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      data,
      error
    });
  }

  /**
   * Create a logger with a specific context
   */
  withContext(context: string): Logger {
    const contextLogger = new Logger();
    contextLogger.currentLevel = this.currentLevel;
    contextLogger.isDevelopment = this.isDevelopment;
    
    // Override methods to include context
    const originalOutput = contextLogger.output.bind(contextLogger);
    contextLogger.output = (entry: LogEntry) => {
      entry.context = context;
      originalOutput(entry);
    };
    
    return contextLogger;
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: unknown, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: unknown, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: Error, data?: unknown, context?: string) => logger.error(message, error, data, context),
  withContext: (context: string) => logger.withContext(context)
};

// Export the Logger class for custom instances
export { Logger };
