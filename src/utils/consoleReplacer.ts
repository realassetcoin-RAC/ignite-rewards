/**
 * Utility to help replace console.log statements with proper logging
 * This provides a migration path from console.log to the logger service
 */

import { log } from '@/lib/logger';

/**
 * Enhanced console replacement that provides better logging
 */
export const enhancedConsole = {
  /**
   * Replace console.log with structured logging
   */
  log: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      log.info(message, args.length === 1 ? args[0] : args);
    } else {
      log.info(message);
    }
  },

  /**
   * Replace console.error with structured error logging
   */
  error: (message: string, error?: Error, ...args: unknown[]) => {
    if (error instanceof Error) {
      log.error(message, error, args.length > 0 ? args : undefined);
    } else {
      log.error(message, undefined, args.length > 0 ? args : undefined);
    }
  },

  /**
   * Replace console.warn with structured warning logging
   */
  warn: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      log.warn(message, args.length === 1 ? args[0] : args);
    } else {
      log.warn(message);
    }
  },

  /**
   * Replace console.info with structured info logging
   */
  info: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      log.info(message, args.length === 1 ? args[0] : args);
    } else {
      log.info(message);
    }
  },

  /**
   * Replace console.debug with structured debug logging
   */
  debug: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      log.debug(message, args.length === 1 ? args[0] : args);
    } else {
      log.debug(message);
    }
  },

  /**
   * Group logging for related operations
   */
  group: (label: string) => {
    log.info(`🔍 ${label} - Starting`);
    return {
      end: () => log.info(`✅ ${label} - Completed`)
    };
  },

  /**
   * Group error logging
   */
  groupEnd: () => {
    // This is handled by the group return object
  }
};

/**
 * Migration helper to gradually replace console statements
 * Usage: Replace `console.log` with `consoleReplacer.log`
 */
export const consoleReplacer = enhancedConsole;

/**
 * Context-aware logging for specific modules
 */
export const createModuleLogger = (moduleName: string) => {
  return {
    log: (message: string, data?: unknown) => log.info(message, data, moduleName),
    error: (message: string, error?: Error, data?: unknown) => log.error(message, error, data, moduleName),
    warn: (message: string, data?: unknown) => log.warn(message, data, moduleName),
    info: (message: string, data?: unknown) => log.info(message, data, moduleName),
    debug: (message: string, data?: unknown) => log.debug(message, data, moduleName),
  };
};
