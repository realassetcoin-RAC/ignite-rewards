/**
 * Tests for the logger service
 */

import { Logger, LogLevel, log } from '../logger';
import { vi } from 'vitest';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.stringContaining('Debug message')
      );
    });

    it('should not log debug messages when level is INFO', () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug('Debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Info message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Info message')
      );
    });

    it('should log error messages when level is ERROR', () => {
      logger.setLevel(LogLevel.ERROR);
      const testError = new Error('Test error');
      logger.error('Error message', testError);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Error message'),
        expect.any(String),
        testError
      );
    });
  });

  describe('Context Logging', () => {
    it('should include context in log messages', () => {
      const contextLogger = logger.withContext('TestContext');
      contextLogger.info('Test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        expect.stringContaining('Test message')
      );
    });
  });

  describe('Data Logging', () => {
    it('should include data in log messages', () => {
      const testData = { key: 'value', number: 42 };
      logger.info('Test message', testData);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
        testData
      );
    });
  });

  describe('Timestamp Formatting', () => {
    it('should include ISO timestamp in log messages', () => {
      logger.info('Test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      );
    });
  });
});

  describe('Global Logger Instance', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });

  it('should provide global log functions', () => {
    log.info('Global info message');
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('Global info message')
    );
  });

  it('should provide context-aware logging', () => {
    const contextLogger = log.withContext('GlobalContext');
    contextLogger.warn('Global warning');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[GlobalContext]'),
      expect.stringContaining('Global warning')
    );
  });
});
