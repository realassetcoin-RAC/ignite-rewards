/**
 * ✅ IMPLEMENT REQUIREMENT: Security service for RLS policy enforcement and monitoring
 * OWASP compliance and security best practices implementation
 */

import { supabase } from '@/integrations/supabase/client';

interface SecurityContext {
  userId: string;
  userRole: string;
  isAdmin: boolean;
  isMerchant: boolean;
  merchantId?: string;
  sessionId: string;
}

interface SecurityAudit {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface AccessAttempt {
  resource: string;
  action: string;
  allowed: boolean;
  reason?: string;
}

export class SecurityService {
  private static context: SecurityContext | null = null;

  /**
   * Initialize security context for current user
   */
  static async initializeSecurityContext(): Promise<SecurityContext | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.context = null;
        return null;
      }

      // Get user profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('app_role')
        .eq('id', user.id)
        .single();

      // Check if user is a merchant
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      const userRole = profile?.app_role || 'user';
      
      this.context = {
        userId: user.id,
        userRole,
        isAdmin: userRole === 'admin',
        isMerchant: !!merchant,
        merchantId: merchant?.id,
        sessionId: user.aud || 'unknown'
      };

      console.log('🔐 Security context initialized:', {
        userId: user.id,
        role: userRole,
        isAdmin: this.context.isAdmin,
        isMerchant: this.context.isMerchant
      });

      return this.context;

    } catch (error) {
      console.error('Error initializing security context:', error);
      this.context = null;
      return null;
    }
  }

  /**
   * Get current security context
   */
  static getSecurityContext(): SecurityContext | null {
    return this.context;
  }

  /**
   * Check if user has permission to access resource
   */
  static async checkAccess(
    resource: string,
    action: 'read' | 'write' | 'delete',
    targetUserId?: string
  ): Promise<AccessAttempt> {
    const context = await this.getOrInitializeContext();
    
    if (!context) {
      return {
        resource,
        action,
        allowed: false,
        reason: 'Not authenticated'
      };
    }

    // Admin can access everything
    if (context.isAdmin) {
      return {
        resource,
        action,
        allowed: true,
        reason: 'Admin privileges'
      };
    }

    // Check resource-specific permissions
    const accessCheck = this.checkResourceAccess(context, resource, action, targetUserId);
    
    // Log access attempt
    await this.logSecurityEvent(
      context.userId,
      `access_${action}`,
      resource,
      accessCheck.allowed,
      accessCheck.reason
    );

    return accessCheck;
  }

  /**
   * Check resource-specific access permissions
   */
  private static checkResourceAccess(
    context: SecurityContext,
    resource: string,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    switch (resource) {
      case 'user_profile':
        return this.checkUserProfileAccess(context, action, targetUserId);
      
      case 'loyalty_cards':
        return this.checkLoyaltyCardAccess(context, action, targetUserId);
      
      case 'transactions':
        return this.checkTransactionAccess(context, action, targetUserId);
      
      case 'wallets':
        return this.checkWalletAccess(context, action, targetUserId);
      
      case 'payments':
        return this.checkPaymentAccess(context, action, targetUserId);
      
      case 'merchant_data':
        return this.checkMerchantDataAccess(context, action);
      
      default:
        return {
          resource,
          action,
          allowed: false,
          reason: 'Unknown resource'
        };
    }
  }

  /**
   * Check user profile access
   */
  private static checkUserProfileAccess(
    context: SecurityContext,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    // Users can access their own profile
    if (targetUserId === context.userId) {
      return {
        resource: 'user_profile',
        action,
        allowed: true,
        reason: 'Own profile access'
      };
    }

    return {
      resource: 'user_profile',
      action,
      allowed: false,
      reason: 'Cannot access other user profiles'
    };
  }

  /**
   * Check loyalty card access
   */
  private static checkLoyaltyCardAccess(
    context: SecurityContext,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    // Users can access their own loyalty cards
    if (targetUserId === context.userId) {
      return {
        resource: 'loyalty_cards',
        action,
        allowed: true,
        reason: 'Own loyalty card access'
      };
    }

    // Merchants can read customer loyalty cards for transactions
    if (context.isMerchant && action === 'read') {
      return {
        resource: 'loyalty_cards',
        action,
        allowed: true,
        reason: 'Merchant customer access'
      };
    }

    return {
      resource: 'loyalty_cards',
      action,
      allowed: false,
      reason: 'Insufficient permissions'
    };
  }

  /**
   * Check transaction access
   */
  private static checkTransactionAccess(
    context: SecurityContext,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    // Users can access their own transactions
    if (targetUserId === context.userId) {
      return {
        resource: 'transactions',
        action,
        allowed: true,
        reason: 'Own transaction access'
      };
    }

    // Merchants can access their merchant transactions
    if (context.isMerchant) {
      return {
        resource: 'transactions',
        action,
        allowed: true,
        reason: 'Merchant transaction access'
      };
    }

    return {
      resource: 'transactions',
      action,
      allowed: false,
      reason: 'Insufficient permissions'
    };
  }

  /**
   * Check wallet access
   */
  private static checkWalletAccess(
    context: SecurityContext,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    // Only users can access their own wallets
    if (targetUserId === context.userId) {
      return {
        resource: 'wallets',
        action,
        allowed: true,
        reason: 'Own wallet access'
      };
    }

    return {
      resource: 'wallets',
      action,
      allowed: false,
      reason: 'Wallet access restricted to owner'
    };
  }

  /**
   * Check payment access
   */
  private static checkPaymentAccess(
    context: SecurityContext,
    action: string,
    targetUserId?: string
  ): AccessAttempt {
    // Users can access their own payments
    if (targetUserId === context.userId) {
      return {
        resource: 'payments',
        action,
        allowed: true,
        reason: 'Own payment access'
      };
    }

    return {
      resource: 'payments',
      action,
      allowed: false,
      reason: 'Payment access restricted to owner'
    };
  }

  /**
   * Check merchant data access
   */
  private static checkMerchantDataAccess(
    context: SecurityContext,
    action: string
  ): AccessAttempt {
    if (context.isMerchant) {
      return {
        resource: 'merchant_data',
        action,
        allowed: true,
        reason: 'Merchant data access'
      };
    }

    return {
      resource: 'merchant_data',
      action,
      allowed: false,
      reason: 'Not a merchant'
    };
  }

  /**
   * Get or initialize security context
   */
  private static async getOrInitializeContext(): Promise<SecurityContext | null> {
    if (!this.context) {
      await this.initializeSecurityContext();
    }
    return this.context;
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('security_audit_logs')
        .insert({
          user_id: userId,
          action,
          resource,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          success,
          error_message: errorMessage
        });

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get client IP address (mock implementation)
   */
  private static async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you would get this from the server
      return '127.0.0.1'; // Mock IP for development
    } catch {
      return 'unknown';
    }
  }

  /**
   * Validate sensitive operation
   */
  static async validateSensitiveOperation(
    operation: string,
    additionalChecks?: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string }> {
    const context = await this.getOrInitializeContext();
    
    if (!context) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    // Log sensitive operation attempt
    await this.logSecurityEvent(
      context.userId,
      `sensitive_operation_${operation}`,
      'system',
      true
    );

    switch (operation) {
      case 'wallet_creation':
        return this.validateWalletCreation(context);
      
      case 'payment_processing':
        return this.validatePaymentProcessing(context, additionalChecks);
      
      case 'data_export':
        return this.validateDataExport(context);
      
      default:
        return { allowed: true };
    }
  }

  /**
   * Validate wallet creation
   */
  private static validateWalletCreation(context: SecurityContext): { allowed: boolean; reason?: string } {
    // Users can create their own wallets
    return { allowed: true };
  }

  /**
   * Validate payment processing
   */
  private static validatePaymentProcessing(
    context: SecurityContext,
    additionalChecks?: Record<string, any>
  ): { allowed: boolean; reason?: string } {
    // Check if payment amount is reasonable
    if (additionalChecks?.amount && additionalChecks.amount > 10000) {
      return { allowed: false, reason: 'Payment amount exceeds limit' };
    }

    return { allowed: true };
  }

  /**
   * Validate data export
   */
  private static validateDataExport(context: SecurityContext): { allowed: boolean; reason?: string } {
    // Only admins can export data
    if (context.isAdmin) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Admin privileges required for data export' };
  }

  /**
   * Get security audit logs
   */
  static async getSecurityAuditLogs(
    limit: number = 100,
    userId?: string
  ): Promise<SecurityAudit[]> {
    try {
      const context = await this.getOrInitializeContext();
      
      if (!context?.isAdmin && !userId) {
        throw new Error('Admin privileges required');
      }

      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching security audit logs:', error);
      return [];
    }
  }

  /**
   * Monitor for suspicious activity
   */
  static async monitorSuspiciousActivity(): Promise<void> {
    try {
      const context = await this.getOrInitializeContext();
      if (!context) return;

      // Check for rapid successive failed login attempts
      const recentFailures = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', context.userId)
        .eq('action', 'login_attempt')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .limit(5);

      if (recentFailures.data && recentFailures.data.length >= 3) {
        console.warn('🚨 Suspicious activity detected: Multiple failed login attempts');
        
        await this.logSecurityEvent(
          context.userId,
          'suspicious_activity_detected',
          'authentication',
          true,
          'Multiple failed login attempts'
        );
      }

    } catch (error) {
      console.error('Error monitoring suspicious activity:', error);
    }
  }

  /**
   * Clear security context (on logout)
   */
  static clearSecurityContext(): void {
    this.context = null;
    console.log('🔐 Security context cleared');
  }

  /**
   * Get security summary for admin dashboard
   */
  static async getSecuritySummary(): Promise<any> {
    try {
      const context = await this.getOrInitializeContext();
      
      if (!context?.isAdmin) {
        throw new Error('Admin privileges required');
      }

      const [
        totalUsers,
        activeUsers,
        failedLogins,
        suspiciousActivity
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('security_audit_logs').select('id', { count: 'exact' }).eq('action', 'login_attempt').eq('success', false).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('security_audit_logs').select('id', { count: 'exact' }).eq('action', 'suspicious_activity_detected').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        total_users: totalUsers.count || 0,
        active_users_24h: activeUsers.count || 0,
        failed_logins_24h: failedLogins.count || 0,
        suspicious_activities_24h: suspiciousActivity.count || 0,
        security_status: 'healthy' // Would be calculated based on metrics
      };

    } catch (error) {
      console.error('Error getting security summary:', error);
      return {
        total_users: 0,
        active_users_24h: 0,
        failed_logins_24h: 0,
        suspicious_activities_24h: 0,
        security_status: 'unknown'
      };
    }
  }
}
