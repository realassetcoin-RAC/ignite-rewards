/**
 * Tests for console replacer utility
 */

import { enhancedConsole, createModuleLogger } from '../consoleReplacer';
import { vi } from 'vitest';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

describe('Enhanced Console', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log method', () => {
    it('should call logger.info with message only', async () => {
      const { log } = await import('@/lib/logger');
      enhancedConsole.log('Test message');
      expect(log.info).toHaveBeenCalledWith('Test message');
    });

    it('should call logger.info with message and single argument', () => {
      const { log } = await import('@/lib/logger');
      const testData = { key: 'value' };
      enhancedConsole.log('Test message', testData);
      expect(log.info).toHaveBeenCalledWith('Test message', testData);
    });

    it('should call logger.info with message and multiple arguments', () => {
      const { log } = await import('@/lib/logger');
      const arg1 = { key: 'value' };
      const arg2 = 'string';
      const arg3 = 42;
      enhancedConsole.log('Test message', arg1, arg2, arg3);
      expect(log.info).toHaveBeenCalledWith('Test message', [arg1, arg2, arg3]);
    });
  });

  describe('error method', () => {
    it('should call logger.error with message and Error object', () => {
      const { log } = await import('@/lib/logger');
      const testError = new Error('Test error');
      enhancedConsole.error('Error message', testError);
      expect(log.error).toHaveBeenCalledWith('Error message', testError, undefined);
    });

    it('should call logger.error with message and additional arguments', () => {
      const { log } = await import('@/lib/logger');
      const testError = new Error('Test error');
      const additionalData = { context: 'test' };
      enhancedConsole.error('Error message', testError, additionalData);
      expect(log.error).toHaveBeenCalledWith('Error message', testError, additionalData);
    });

    it('should call logger.error with message and non-Error arguments', () => {
      const { log } = await import('@/lib/logger');
      const nonError = 'not an error';
      enhancedConsole.error('Error message', nonError);
      expect(log.error).toHaveBeenCalledWith('Error message', undefined, nonError);
    });
  });

  describe('warn method', () => {
    it('should call logger.warn with message only', () => {
      const { log } = await import('@/lib/logger');
      enhancedConsole.warn('Warning message');
      expect(log.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should call logger.warn with message and arguments', () => {
      const { log } = await import('@/lib/logger');
      const testData = { warning: 'data' };
      enhancedConsole.warn('Warning message', testData);
      expect(log.warn).toHaveBeenCalledWith('Warning message', testData);
    });
  });

  describe('info method', () => {
    it('should call logger.info with message only', () => {
      const { log } = await import('@/lib/logger');
      enhancedConsole.info('Info message');
      expect(log.info).toHaveBeenCalledWith('Info message');
    });

    it('should call logger.info with message and arguments', () => {
      const { log } = await import('@/lib/logger');
      const testData = { info: 'data' };
      enhancedConsole.info('Info message', testData);
      expect(log.info).toHaveBeenCalledWith('Info message', testData);
    });
  });

  describe('debug method', () => {
    it('should call logger.debug with message only', () => {
      const { log } = await import('@/lib/logger');
      enhancedConsole.debug('Debug message');
      expect(log.debug).toHaveBeenCalledWith('Debug message');
    });

    it('should call logger.debug with message and arguments', () => {
      const { log } = await import('@/lib/logger');
      const testData = { debug: 'data' };
      enhancedConsole.debug('Debug message', testData);
      expect(log.debug).toHaveBeenCalledWith('Debug message', testData);
    });
  });

  describe('group method', () => {
    it('should return an object with end method', () => {
      // const { log } = await import('@/lib/logger');
      const group = enhancedConsole.group('Test Group');
      expect(group).toHaveProperty('end');
      expect(typeof group.end).toBe('function');
    });

    it('should log start message when group is created', () => {
      const { log } = await import('@/lib/logger');
      enhancedConsole.group('Test Group');
      expect(log.info).toHaveBeenCalledWith('🔍 Test Group - Starting');
    });

    it('should log end message when end is called', () => {
      const { log } = await import('@/lib/logger');
      const group = enhancedConsole.group('Test Group');
      group.end();
      expect(log.info).toHaveBeenCalledWith('✅ Test Group - Completed');
    });
  });
});

describe('createModuleLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a logger with context', () => {
    const { log } = await import('@/lib/logger');
    const moduleLogger = createModuleLogger('TestModule');
    
    moduleLogger.info('Test message', { data: 'test' });
    expect(log.info).toHaveBeenCalledWith('Test message', { data: 'test' }, 'TestModule');
  });

  it('should create a logger with error context', () => {
    const { log } = await import('@/lib/logger');
    const moduleLogger = createModuleLogger('TestModule');
    const testError = new Error('Test error');
    
    moduleLogger.error('Error message', testError, { context: 'test' });
    expect(log.error).toHaveBeenCalledWith('Error message', testError, { context: 'test' }, 'TestModule');
  });

  it('should create a logger with warn context', () => {
    const { log } = await import('@/lib/logger');
    const moduleLogger = createModuleLogger('TestModule');
    
    moduleLogger.warn('Warning message', { warning: 'data' });
    expect(log.warn).toHaveBeenCalledWith('Warning message', { warning: 'data' }, 'TestModule');
  });

  it('should create a logger with debug context', () => {
    const { log } = await import('@/lib/logger');
    const moduleLogger = createModuleLogger('TestModule');
    
    moduleLogger.debug('Debug message', { debug: 'data' });
    expect(log.debug).toHaveBeenCalledWith('Debug message', { debug: 'data' }, 'TestModule');
  });
});
