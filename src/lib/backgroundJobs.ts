import { PointReleaseService } from './pointReleaseService';
import { EnhancedLoyaltyOtp } from './enhancedLoyaltyOtp';
import { EmailNotificationService } from './emailNotificationService';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('BackgroundJobs');

export class BackgroundJobService {
  private static _isRunning = false;
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Start all background jobs
   */
  static startAllJobs(): void {
    if (this._isRunning) {
      logger.warn('Background jobs are already running');
      return;
    }

    logger.info('Starting background jobs...');
    this._isRunning = true;

    // Point Release Processing - Every hour
    const pointReleaseInterval = setInterval(async () => {
      try {
        // Skip point release processing in browser environment
        if (typeof window !== 'undefined') {
          logger.debug('Point release processing skipped in browser environment');
          return;
        }
        
        logger.info('Running point release processing job...');
        const result = await PointReleaseService.processAllPendingReleases();
        
        if (result.success) {
          logger.info('Point release processing completed', {
            totalReleased: result.totalReleased,
            processedUsers: result.processedUsers,
            errors: result.errors.length
          });
        } else {
          logger.error('Point release processing failed', new Error(result.errors.join(', ')));
        }
      } catch (error) {
        // Don't log errors in browser environment
        if (typeof window !== 'undefined') {
          logger.debug('Point release processing error in browser environment - skipping');
          return;
        }
        logger.error('Point release processing error', error instanceof Error ? error : new Error(String(error)));
      }
    }, 60 * 60 * 1000); // Every hour

    // OTP Cleanup - Every 5 minutes
    const otpCleanupInterval = setInterval(async () => {
      try {
        // Skip OTP cleanup in browser environment
        if (typeof window !== 'undefined') {
          logger.debug('OTP cleanup skipped in browser environment');
          return;
        }
        
        logger.info('Running OTP cleanup job...');
        await EnhancedLoyaltyOtp.cleanupExpiredOTPs();
        logger.info('OTP cleanup completed');
      } catch (error) {
        // Don't log errors in browser environment
        if (typeof window !== 'undefined') {
          logger.debug('OTP cleanup error in browser environment - skipping');
          return;
        }
        logger.error('OTP cleanup error', error instanceof Error ? error : new Error(String(error)));
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Email Processing - Every minute
    const emailProcessingInterval = setInterval(async () => {
      try {
        // Skip email processing in browser environment to avoid console errors
        if (typeof window !== 'undefined') {
          logger.debug('Email processing skipped in browser environment');
          return;
        }
        
        logger.info('Running email processing job...');
        const result = await EmailNotificationService.retryFailedEmails();
        
        if (result.success) {
          logger.info('Email processing completed', {
            retried: result.retried,
            errors: result.errors.length
          });
        } else {
          // Don't log as error if it's just database connection issues in browser
          if (result.errors.length > 0 && result.errors[0] === 'Database not connected') {
            logger.debug('Email processing skipped - database not connected in browser environment');
          } else {
            logger.error('Email processing failed', new Error(result.errors.join(', ')));
          }
        }
      } catch (error) {
        // Don't log errors in browser environment
        if (typeof window !== 'undefined') {
          logger.debug('Email processing error in browser environment - skipping');
          return;
        }
        logger.error('Email processing error', error instanceof Error ? error : new Error(String(error)));
      }
    }, 60 * 1000); // Every minute

    // Store intervals for cleanup
    this.intervals = [pointReleaseInterval, otpCleanupInterval, emailProcessingInterval];

    logger.info('All background jobs started successfully');
  }

  /**
   * Check if background jobs are running
   */
  static isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Stop all background jobs
   */
  static stopAllJobs(): void {
    if (!this._isRunning) {
      logger.warn('Background jobs are not running');
      return;
    }

    logger.info('Stopping background jobs...');
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = [];
    this._isRunning = false;
    
    logger.info('All background jobs stopped');
  }

  /**
   * Run point release processing manually
   */
  static async runPointReleaseProcessing(): Promise<{
    success: boolean;
    totalReleased: number;
    processedUsers: number;
    errors: string[];
  }> {
    try {
      logger.info('Running manual point release processing...');
      const result = await PointReleaseService.processAllPendingReleases();
      logger.info('Manual point release processing completed', result);
      return result;
    } catch (error) {
      logger.error('Manual point release processing error', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        totalReleased: 0,
        processedUsers: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Run OTP cleanup manually
   */
  static async runOTPCleanup(): Promise<void> {
    try {
      logger.info('Running manual OTP cleanup...');
      await EnhancedLoyaltyOtp.cleanupExpiredOTPs();
      logger.info('Manual OTP cleanup completed');
    } catch (error) {
      logger.error('Manual OTP cleanup error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Run email processing manually
   */
  static async runEmailProcessing(): Promise<{
    success: boolean;
    retried: number;
    errors: string[];
  }> {
    try {
      logger.info('Running manual email processing...');
      const result = await EmailNotificationService.retryFailedEmails();
      logger.info('Manual email processing completed', result);
      return result;
    } catch (error) {
      logger.error('Manual email processing error', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        retried: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get background job status
   */
  static getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    jobTypes: string[];
  } {
    return {
      isRunning: this._isRunning,
      activeJobs: this.intervals.length,
      jobTypes: [
        'Point Release Processing (hourly)',
        'OTP Cleanup (every 5 minutes)',
        'Email Processing (every minute)'
      ]
    };
  }

  private static isInitialized = false;

  /**
   * Initialize background jobs (call this in your main app)
   */
  static initialize(): void {
    if (this.isInitialized) {
      logger.info('Background jobs already initialized');
      return;
    }

    this.isInitialized = true;
    
    // Start jobs in development and production
    if (typeof window === 'undefined') {
      // Server-side only
      this.startAllJobs();
    } else {
      // Client-side - start jobs after a delay to ensure app is loaded
      setTimeout(() => {
        this.startAllJobs();
      }, 5000);
    }
  }
}

// Auto-initialize if this is a server environment
if (typeof window === 'undefined') {
  BackgroundJobService.initialize();
}
