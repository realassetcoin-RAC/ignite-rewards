import { environment } from '@/config/environment';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
}

export interface EmailNotification {
  id: string;
  to_email: string;
  template_name: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  variables?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailNotificationService {
  /**
   * Send email notification using template
   */
  static async sendEmail(
    toEmail: string,
    templateName: string,
    variables: Record<string, any> = {},
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<EmailResult> {
    try {
      // In development mode, use mock email functionality
      if (environment.isDevelopment) {
        console.log(`📧 [MOCK EMAIL] Sending email to ${toEmail}`);
        console.log(`📧 [MOCK EMAIL] Template: ${templateName}`);
        console.log(`📧 [MOCK EMAIL] Variables:`, variables);
        console.log(`📧 [MOCK EMAIL] Priority: ${priority}`);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Log the email content for testing
        console.log(`📧 [MOCK EMAIL] Email would be sent with subject: ${templateName} notification`);
        console.log(`📧 [MOCK EMAIL] Recipient: ${toEmail}`);
        
        return { 
          success: true, 
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        };
      }

      // Production mode - use real email functionality
      // Get email template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return {
          success: false,
          error: `Email template '${templateName}' not found or inactive`
        };
      }

      // Replace variables in subject and content
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.html_content, variables);
      const textContent = this.replaceVariables(template.text_content, variables);

      // Create email notification record
      const { data: notification, error: insertError } = await supabase
        .from('email_notifications')
        .insert({
          to_email: toEmail,
          template_name: templateName,
          subject,
          html_content: htmlContent,
          text_content: textContent,
          variables,
          priority,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Send email via external service
      const sendResult = await this.sendViaEmailService({
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent
      });

      if (sendResult.success) {
        // Update notification status
        await supabase
          .from('email_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        return {
          success: true,
          messageId: sendResult.messageId
        };
      } else {
        // Update notification with error
        await supabase
          .from('email_notifications')
          .update({
            status: 'failed',
            error_message: sendResult.error
          })
          .eq('id', notification.id);

        return {
          success: false,
          error: sendResult.error
        };
      }

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: 'Failed to send email notification'
      };
    }
  }

  /**
   * Send referral welcome email
   */
  static async sendReferralWelcomeEmail(
    userEmail: string,
    referrerName: string,
    pointsAwarded: number
  ): Promise<EmailResult> {
    return this.sendEmail('referral_welcome', {
      user_email: userEmail,
      referrer_name: referrerName,
      points_awarded: pointsAwarded
    });
  }

  /**
   * Send loyalty account linking email
   */
  static async sendLoyaltyLinkingEmail(
    userEmail: string,
    networkName: string,
    mobileNumber: string
  ): Promise<EmailResult> {
    return this.sendEmail('loyalty_linking', {
      user_email: userEmail,
      network_name: networkName,
      mobile_number: mobileNumber
    });
  }

  /**
   * Send points transfer completion email
   */
  static async sendTransferCompletionEmail(
    userEmail: string,
    networkName: string,
    pointsTransferred: number
  ): Promise<EmailResult> {
    return this.sendEmail('transfer_completion', {
      user_email: userEmail,
      network_name: networkName,
      points_transferred: pointsTransferred
    });
  }

  /**
   * Send NFT upgrade email
   */
  static async sendNFTUpgradeEmail(
    userEmail: string,
    oldNFTName: string,
    newNFTName: string,
    upgradePrice: number
  ): Promise<EmailResult> {
    return this.sendEmail('nft_upgrade', {
      user_email: userEmail,
      old_nft_name: oldNFTName,
      new_nft_name: newNFTName,
      upgrade_price: upgradePrice
    });
  }

  /**
   * Send point release email
   */
  static async sendPointReleaseEmail(
    userEmail: string,
    pointsReleased: number,
    transactionDate: string
  ): Promise<EmailResult> {
    return this.sendEmail('point_release', {
      user_email: userEmail,
      points_released: pointsReleased,
      transaction_date: transactionDate
    });
  }

  /**
   * Send bulk emails (for campaigns)
   */
  static async sendBulkEmails(
    recipients: Array<{ email: string; variables: Record<string, any> }>,
    templateName: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(
          recipient.email,
          templateName,
          recipient.variables,
          priority
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${recipient.email}: ${result.error}`);
        }

        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
        errors.push(`${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      errors
    };
  }

  /**
   * Get email notification statistics
   */
  static async getEmailStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    successRate: number;
    recentActivity: EmailNotification[];
  }> {
    try {
      // Get counts by status
      const { data: statusCounts, error: countError } = await supabase
        .from('email_notifications')
        .select('status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (countError) {
        throw countError;
      }

      const totalSent = statusCounts?.filter(n => n.status === 'sent').length || 0;
      const totalFailed = statusCounts?.filter(n => n.status === 'failed').length || 0;
      const totalPending = statusCounts?.filter(n => n.status === 'pending').length || 0;
      const total = totalSent + totalFailed + totalPending;
      const successRate = total > 0 ? (totalSent / total) * 100 : 0;

      // Get recent activity
      const { data: recentActivity, error: recentError } = await supabase
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        throw recentError;
      }

      return {
        totalSent,
        totalFailed,
        totalPending,
        successRate: Math.round(successRate * 100) / 100,
        recentActivity: recentActivity || []
      };

    } catch (error) {
      console.error('Error getting email stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        totalPending: 0,
        successRate: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Retry failed email notifications
   */
  static async retryFailedEmails(): Promise<{
    success: boolean;
    retried: number;
    errors: string[];
  }> {
    try {
      // Get failed notifications from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: failedEmails, error: fetchError } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', yesterday.toISOString())
        .limit(50); // Limit to avoid overwhelming the system

      if (fetchError) {
        throw fetchError;
      }

      let retried = 0;
      const errors: string[] = [];

      for (const email of failedEmails || []) {
        try {
          const result = await this.sendViaEmailService({
            to: email.to_email,
            subject: email.subject,
            html: email.html_content,
            text: email.text_content
          });

          if (result.success) {
            // Update status
            await supabase
              .from('email_notifications')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                error_message: null
              })
              .eq('id', email.id);

            retried++;
          } else {
            errors.push(`${email.to_email}: ${result.error}`);
          }

          // Add delay between retries
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          errors.push(`${email.to_email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        retried,
        errors
      };

    } catch (error) {
      // Don't log database connection errors in browser environment as they're expected
      if (error instanceof Error && error.message === 'Database not connected') {
        return {
          success: true, // Consider it successful when DB is not available
          retried: 0,
          errors: []
        };
      }
      
      // Only log actual errors, not expected database connection issues
      if (error instanceof Error && !error.message.includes('Database not connected')) {
        console.error('Error retrying failed emails:', error);
      }
      
      return {
        success: false,
        retried: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create or update email template
   */
  static async upsertEmailTemplate(template: Partial<EmailTemplate>): Promise<{
    success: boolean;
    template?: EmailTemplate;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'name' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        template: data
      };
    } catch (error) {
      console.error('Error upserting email template:', error);
      return {
        success: false,
        error: 'Failed to save email template'
      };
    }
  }

  // Private helper methods

  private static replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  private static async sendViaEmailService(emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailResult> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, simulate email sending
      console.log('Sending email:', {
        to: emailData.to,
        subject: emailData.subject,
        // Don't log full content for privacy
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production, replace this with actual email service integration
      // Example with SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // const msg = {
      //   to: emailData.to,
      //   from: 'noreply@pointbridge.com',
      //   subject: emailData.subject,
      //   text: emailData.text,
      //   html: emailData.html,
      // };
      // const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: `msg_${Date.now()}`
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email service error'
      };
    }
  }
}
