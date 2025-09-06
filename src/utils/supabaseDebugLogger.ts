// Supabase Debug Logger - Comprehensive logging for all Supabase operations

interface LogEntry {
  timestamp: string;
  operation: string;
  table?: string;
  query?: any;
  result?: any;
  error?: any;
  duration?: number;
  userInfo?: any;
}

class SupabaseDebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console with formatting
    const emoji = entry.error ? '❌' : '✅';
    const operation = entry.operation;
    const table = entry.table ? ` [${entry.table}]` : '';
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    
    console.group(`${emoji} SUPABASE${table}: ${operation}${duration}`);
    
    if (entry.query) {
      console.log('📤 Query:', entry.query);
    }
    
    if (entry.result) {
      console.log('📥 Result:', entry.result);
    }
    
    if (entry.error) {
      console.error('💥 Error:', entry.error);
    }
    
    if (entry.userInfo) {
      console.log('👤 User Info:', entry.userInfo);
    }
    
    console.groupEnd();

    // Store in window for debugging
    (window as any).supabaseDebugLogs = this.logs;
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    (window as any).supabaseDebugLogs = [];
  }

  exportLogs() {
    const logData = {
      timestamp: new Date().toISOString(),
      logs: this.logs,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const supabaseLogger = new SupabaseDebugLogger();

// Enhanced Supabase client wrapper with logging
export const createLoggedSupabaseClient = (originalClient: any) => {
  return new Proxy(originalClient, {
    get(target, prop) {
      if (prop === 'from') {
        return (tableName: string) => {
          const table = target.from(tableName);
          
          return new Proxy(table, {
            get(tableTarget, tableProp) {
              const originalMethod = tableTarget[tableProp];
              
              if (typeof originalMethod === 'function' && 
                  ['select', 'insert', 'update', 'delete', 'upsert'].includes(tableProp as string)) {
                
                return async function(...args: any[]) {
                  const startTime = Date.now();
                  
                  try {
                    supabaseLogger.log({
                      operation: `${tableProp.toString().toUpperCase()} START`,
                      table: tableName,
                      query: args
                    });

                    const result = await originalMethod.apply(this, args);
                    const duration = Date.now() - startTime;

                    supabaseLogger.log({
                      operation: `${tableProp.toString().toUpperCase()} SUCCESS`,
                      table: tableName,
                      query: args,
                      result: {
                        data: result.data,
                        error: result.error,
                        count: result.count,
                        status: result.status,
                        statusText: result.statusText
                      },
                      duration
                    });

                    return result;
                  } catch (error) {
                    const duration = Date.now() - startTime;
                    
                    supabaseLogger.log({
                      operation: `${tableProp.toString().toUpperCase()} ERROR`,
                      table: tableName,
                      query: args,
                      error: {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                      },
                      duration
                    });

                    throw error;
                  }
                };
              }
              
              return originalMethod;
            }
          });
        };
      }
      
      if (prop === 'auth') {
        const auth = target.auth;
        
        return new Proxy(auth, {
          get(authTarget, authProp) {
            const originalAuthMethod = authTarget[authProp];
            
            if (typeof originalAuthMethod === 'function' && 
                ['getUser', 'getSession', 'signIn', 'signOut', 'signUp'].includes(authProp as string)) {
              
              return async function(...args: any[]) {
                const startTime = Date.now();
                
                try {
                  supabaseLogger.log({
                    operation: `AUTH.${authProp.toString().toUpperCase()} START`,
                    query: authProp === 'getUser' || authProp === 'getSession' ? undefined : args
                  });

                  const result = await originalAuthMethod.apply(this, args);
                  const duration = Date.now() - startTime;

                  supabaseLogger.log({
                    operation: `AUTH.${authProp.toString().toUpperCase()} SUCCESS`,
                    result: {
                      data: result.data,
                      error: result.error
                    },
                    userInfo: result.data?.user ? {
                      id: result.data.user.id,
                      email: result.data.user.email,
                      role: result.data.user.role
                    } : undefined,
                    duration
                  });

                  return result;
                } catch (error) {
                  const duration = Date.now() - startTime;
                  
                  supabaseLogger.log({
                    operation: `AUTH.${authProp.toString().toUpperCase()} ERROR`,
                    error: {
                      message: error.message,
                      stack: error.stack,
                      name: error.name
                    },
                    duration
                  });

                  throw error;
                }
              };
            }
            
            return originalAuthMethod;
          }
        });
      }
      
      return target[prop];
    }
  });
};

// Add global debugging functions
(window as any).supabaseDebugLogger = supabaseLogger;
(window as any).exportSupabaseLogs = () => supabaseLogger.exportLogs();
(window as any).clearSupabaseLogs = () => supabaseLogger.clearLogs();

console.log('🐛 Supabase Debug Logger initialized');
console.log('🔧 Available commands:');
console.log('  - window.supabaseDebugLogs: View all logs');
console.log('  - window.exportSupabaseLogs(): Download logs as JSON');
console.log('  - window.clearSupabaseLogs(): Clear all logs');