# Console.log Migration Guide

## Overview
This guide helps migrate from `console.log` statements to the new structured logging service for better production readiness and debugging.

## Quick Migration

### 1. Import the Logger
```typescript
// Replace this:
console.log('Debug message');

// With this:
import { log } from '@/lib/logger';
log.info('Debug message');
```

### 2. Use Context-Aware Logging
```typescript
// For component-specific logging:
import { createModuleLogger } from '@/utils/consoleReplacer';
const logger = createModuleLogger('ComponentName');

logger.info('Component initialized');
logger.error('Component error', error);
```

### 3. Migration Examples

#### Basic Logging
```typescript
// Before:
console.log('User logged in:', user);

// After:
log.info('User logged in', user);
```

#### Error Logging
```typescript
// Before:
console.error('API Error:', error);

// After:
log.error('API Error', error);
```

#### Debug Logging
```typescript
// Before:
console.log('Debug info:', data);

// After:
log.debug('Debug info', data);
```

#### Warning Logging
```typescript
// Before:
console.warn('Deprecated function used');

// After:
log.warn('Deprecated function used');
```

### 4. Context-Specific Logging
```typescript
// For authentication:
const authLogger = log.withContext('Auth');
authLogger.info('User authenticated', { userId: user.id });

// For API calls:
const apiLogger = log.withContext('API');
apiLogger.info('API request', { endpoint, method });
apiLogger.error('API error', error, { endpoint, status });
```

### 5. Gradual Migration
Use the console replacer for gradual migration:
```typescript
import { consoleReplacer } from '@/utils/consoleReplacer';

// Replace console.log with consoleReplacer.log
consoleReplacer.log('Message', data);
```

## Log Levels

- **DEBUG**: Development debugging information
- **INFO**: General information about application flow
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures

## Production Considerations

- Debug logs are automatically filtered out in production
- Error logs can be sent to remote monitoring services
- All logs include timestamps and context information
- Log levels can be configured per environment

## Benefits

1. **Structured Logging**: Consistent format across the application
2. **Log Levels**: Proper filtering based on environment
3. **Context Information**: Better debugging with component/module context
4. **Production Ready**: Automatic filtering and remote logging support
5. **Type Safety**: TypeScript support for log data

## Migration Checklist

- [ ] Replace `console.log` with `log.info`
- [ ] Replace `console.error` with `log.error`
- [ ] Replace `console.warn` with `log.warn`
- [ ] Replace `console.debug` with `log.debug`
- [ ] Add context to component-specific logging
- [ ] Test logging in development and production environments
- [ ] Configure log levels for different environments
