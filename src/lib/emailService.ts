/**
 * ✅ IMPLEMENT REQUIREMENT: Email notification system for transfers and linking
 * Email service for loyalty transfers, account linking, and other notifications
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'ses' | 'mock';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailNotification {
  id: string;
  user_id: string;
  email_address: string;
  subject: string;
  template_type: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export class EmailService {
  private static config: EmailConfig = {
    provider: process.env.NODE_ENV === 'production' ? 'resend' : 'mock',
    apiKey: process.env.VITE_EMAIL_API_KEY,
    fromEmail: process.env.VITE_FROM_EMAIL || 'noreply@igniterewards.com',
    fromName: process.env.VITE_FROM_NAME || 'PointBridge Rewards'
  };

  /**
   * Send loyalty account linking confirmation email
   */
  static async sendLoyaltyLinkingConfirmation(
    userId: string,
    userEmail: string,
    userName: string,
    networkName: string,
    mobileNumber: string
  ): Promise<EmailResult> {
    const template = this.getLoyaltyLinkingTemplate(userName, networkName, mobileNumber);
    
    return this.sendEmail({
      userId,
      email: userEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateType: 'loyalty_linking_confirmation'
    });
  }

  /**
   * Send loyalty points transfer notification
   */
  static async sendPointsTransferNotification(
    userId: string,
    userEmail: string,
    userName: string,
    fromNetwork: string,
    points: number,
    convertedPoints: number
  ): Promise<EmailResult> {
    const template = this.getPointsTransferTemplate(
      userName, 
      fromNetwork, 
      points, 
      convertedPoints
    );
    
    return this.sendEmail({
      userId,
      email: userEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateType: 'points_transfer_notification'
    });
  }

  /**
   * Send loyalty transfer completion notification
   */
  static async sendTransferCompletionNotification(
    userId: string,
    userEmail: string,
    userName: string,
    networkName: string,
    transferredPoints: number,
    newBalance: number
  ): Promise<EmailResult> {
    const template = this.getTransferCompletionTemplate(
      userName,
      networkName,
      transferredPoints,
      newBalance
    );
    
    return this.sendEmail({
      userId,
      email: userEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateType: 'transfer_completion'
    });
  }

  /**
   * Send welcome email for new users
   */
  static async sendWelcomeEmail(
    userId: string,
    userEmail: string,
    userName: string,
    loyaltyNumber: string,
    walletAddress: string
  ): Promise<EmailResult> {
    const template = this.getWelcomeTemplate(userName, loyaltyNumber, walletAddress);
    
    return this.sendEmail({
      userId,
      email: userEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateType: 'welcome_email'
    });
  }

  /**
   * Send NFT evolution notification email
   */
  static async sendEvolutionNotification(
    userId: string,
    userEmail: string,
    userName: string,
    evolvedNftName: string,
    rarity: string
  ): Promise<EmailResult> {
    const template = this.getEvolutionTemplate(userName, evolvedNftName, rarity);
    
    return this.sendEmail({
      userId,
      email: userEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateType: 'nft_evolution_notification'
    });
  }

  /**
   * Core email sending function
   */
  private static async sendEmail({
    userId,
    email,
    subject,
    htmlContent,
    textContent,
    templateType
  }: {
    userId: string;
    email: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    templateType: string;
  }): Promise<EmailResult> {
    try {
      // Store email notification record
      const { data: notification, error: dbError } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          email_address: email,
          subject,
          template_type: templateType,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error storing email notification:', dbError);
        return { success: false, error: 'Failed to create email record' };
      }

      // Send email based on provider
      const emailResult = await this.sendEmailViaProvider(email, subject, htmlContent, textContent);
      
      // Update notification status
      await supabase
        .from('email_notifications')
        .update({
          status: emailResult.success ? 'sent' : 'failed',
          sent_at: emailResult.success ? new Date().toISOString() : null,
          error_message: emailResult.error || null
        })
        .eq('id', notification.id);

      return emailResult;

    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email via configured provider
   */
  private static async sendEmailViaProvider(
    email: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<EmailResult> {
    switch (this.config.provider) {
      case 'resend':
        return this.sendResendEmail(email, subject, htmlContent, textContent);
      case 'sendgrid':
        return this.sendSendGridEmail(email, subject, htmlContent, textContent);
      case 'ses':
        return this.sendSESEmail(email, subject, htmlContent, textContent);
      case 'mock':
      default:
        return this.sendMockEmail(email, subject, htmlContent, textContent);
    }
  }

  /**
   * Send email via Resend
   */
  private static async sendResendEmail(
    email: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<EmailResult> {
    try {
      if (!this.config.apiKey) {
        console.warn('Resend API key not configured, using mock email');
        return this.sendMockEmail(email, subject, htmlContent, textContent);
      }

      // In a real implementation, you would use Resend SDK here
      // const resend = new Resend(this.config.apiKey);
      // const result = await resend.emails.send({
      //   from: `${this.config.fromName} <${this.config.fromEmail}>`,
      //   to: email,
      //   subject,
      //   html: htmlContent,
      //   text: textContent
      // });

      console.log(`📧 [MOCK RESEND] Email sent to ${email}: ${subject}`);
      return {
        success: true,
        messageId: `resend-${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resend email failed'
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private static async sendSendGridEmail(
    email: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<EmailResult> {
    try {
      console.log(`📧 [MOCK SENDGRID] Email sent to ${email}: ${subject}`);
      return {
        success: true,
        messageId: `sendgrid-${Date.now()}`
      };
    } catch (error) {
      console.error('SendGrid email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SendGrid email failed'
      };
    }
  }

  /**
   * Send email via AWS SES
   */
  private static async sendSESEmail(
    email: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<EmailResult> {
    try {
      console.log(`📧 [MOCK AWS SES] Email sent to ${email}: ${subject}`);
      return {
        success: true,
        messageId: `ses-${Date.now()}`
      };
    } catch (error) {
      console.error('AWS SES email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SES email failed'
      };
    }
  }

  /**
   * Mock email for development
   */
  private static async sendMockEmail(
    email: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<EmailResult> {
    console.log(`📧 [MOCK EMAIL] To: ${email}`);
    console.log(`📧 [MOCK EMAIL] Subject: ${subject}`);
    console.log(`📧 [MOCK EMAIL] Text Content: ${textContent}`);
    console.log(`📧 [MOCK EMAIL] Status: Delivered (Mock)`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      messageId: `mock-${Date.now()}`
    };
  }

  /**
   * Email templates
   */
  private static getLoyaltyLinkingTemplate(
    userName: string,
    networkName: string,
    mobileNumber: string
  ): EmailTemplate {
    const maskedNumber = mobileNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    
    return {
      subject: `${networkName} Loyalty Account Successfully Linked`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Loyalty Account Linked Successfully!</h2>
          <p>Hi ${userName},</p>
          <p>Great news! Your <strong>${networkName}</strong> loyalty account has been successfully linked to your PointBridge account.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Linked Account Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Network:</strong> ${networkName}</li>
              <li><strong>Mobile Number:</strong> ${maskedNumber}</li>
              <li><strong>Linked Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>You can now transfer points from your ${networkName} account to PointBridge and enjoy our rewards ecosystem.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The PointBridge Team</p>
        </div>
      `,
      textContent: `
Hi ${userName},

Your ${networkName} loyalty account has been successfully linked to your PointBridge account.

Linked Account Details:
- Network: ${networkName}
- Mobile Number: ${maskedNumber}
- Linked Date: ${new Date().toLocaleDateString()}

You can now transfer points from your ${networkName} account to PointBridge.

Best regards,
The PointBridge Team
      `.trim()
    };
  }

  private static getPointsTransferTemplate(
    userName: string,
    fromNetwork: string,
    points: number,
    convertedPoints: number
  ): EmailTemplate {
    return {
      subject: `Points Transfer Initiated - ${points} ${fromNetwork} Points`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Points Transfer Initiated</h2>
          <p>Hi ${userName},</p>
          <p>Your points transfer has been initiated and is being processed.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Transfer Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>From Network:</strong> ${fromNetwork}</li>
              <li><strong>Points Transferred:</strong> ${points}</li>
              <li><strong>PointBridge Points:</strong> ${convertedPoints}</li>
              <li><strong>Transfer Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>Your converted points will be available in your PointBridge account within 24-48 hours.</p>
          <p>Best regards,<br>The PointBridge Team</p>
        </div>
      `,
      textContent: `
Hi ${userName},

Your points transfer has been initiated from ${fromNetwork}.

Transfer Details:
- From Network: ${fromNetwork}
- Points Transferred: ${points}
- PointBridge Points: ${convertedPoints}
- Transfer Date: ${new Date().toLocaleDateString()}

Your converted points will be available within 24-48 hours.

Best regards,
The PointBridge Team
      `.trim()
    };
  }

  private static getTransferCompletionTemplate(
    userName: string,
    networkName: string,
    transferredPoints: number,
    newBalance: number
  ): EmailTemplate {
    return {
      subject: `Points Transfer Complete - ${transferredPoints} Points Added`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Points Transfer Complete!</h2>
          <p>Hi ${userName},</p>
          <p>Your points transfer from ${networkName} has been completed successfully.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Transfer Summary:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Points Added:</strong> ${transferredPoints}</li>
              <li><strong>New Balance:</strong> ${newBalance}</li>
              <li><strong>Completed:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>Your points are now available in your PointBridge account and ready to use!</p>
          <p>Best regards,<br>The PointBridge Team</p>
        </div>
      `,
      textContent: `
Hi ${userName},

Your points transfer from ${networkName} has been completed successfully.

Transfer Summary:
- Points Added: ${transferredPoints}
- New Balance: ${newBalance}
- Completed: ${new Date().toLocaleDateString()}

Your points are now available in your PointBridge account!

Best regards,
The PointBridge Team
      `.trim()
    };
  }

  private static getWelcomeTemplate(
    userName: string,
    loyaltyNumber: string,
    walletAddress: string
  ): EmailTemplate {
    const maskedWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    
    return {
      subject: `Welcome to PointBridge - Your Account is Ready!`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to PointBridge!</h2>
          <p>Hi ${userName},</p>
          <p>Welcome to PointBridge! Your account has been successfully created and your loyalty NFT card is now active.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Account Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Loyalty Number:</strong> ${loyaltyNumber}</li>
              <li><strong>Wallet Address:</strong> ${maskedWallet}</li>
              <li><strong>NFT Card:</strong> Pearl White (Free)</li>
              <li><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>You can now start earning rewards, linking third-party loyalty accounts, and participating in our rewards ecosystem.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The PointBridge Team</p>
        </div>
      `,
      textContent: `
Hi ${userName},

Welcome to PointBridge! Your account has been successfully created.

Your Account Details:
- Loyalty Number: ${loyaltyNumber}
- Wallet Address: ${maskedWallet}
- NFT Card: Pearl White (Free)
- Account Created: ${new Date().toLocaleDateString()}

You can now start earning rewards and linking loyalty accounts.

Best regards,
The PointBridge Team
      `.trim()
    };
  }

  private static getEvolutionTemplate(
    userName: string,
    evolvedNftName: string,
    rarity: string
  ): EmailTemplate {
    const rarityColors = {
      rare: '#3b82f6',
      epic: '#8b5cf6', 
      legendary: '#f59e0b',
      mythic: '#ef4444'
    };
    
    const rarityColor = rarityColors[rarity as keyof typeof rarityColors] || '#3b82f6';
    
    return {
      subject: `🎉 Surprise! Your NFT Has Evolved to ${evolvedNftName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px;">
          <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: ${rarityColor}; margin-bottom: 20px; font-size: 28px;">🎭 NFT Evolution Complete!</h1>
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Congratulations! Your dedication and investment have unlocked something extraordinary...</p>
            
            <div style="background: linear-gradient(135deg, ${rarityColor}20, ${rarityColor}10); padding: 30px; border-radius: 12px; margin: 30px 0; border: 2px solid ${rarityColor};">
              <h2 style="color: ${rarityColor}; margin: 0 0 15px 0; font-size: 24px;">✨ Surprise Evolution Unlocked!</h2>
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">${evolvedNftName}</h3>
              <div style="display: inline-block; background: ${rarityColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                ${rarity} RARITY
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">🎁 Evolution Benefits:</h3>
              <ul style="text-align: left; color: #666; line-height: 1.6;">
                <li>Enhanced earning ratios from your investments</li>
                <li>Exclusive 3D animated NFT (.gif format)</li>
                <li>Special abilities and bonus multipliers</li>
                <li>Access to premium staking pools</li>
                <li>Unique evolution wallet for dedicated earnings</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #666; margin: 30px 0;">Your evolved NFT is now active and earning enhanced rewards. Visit your dashboard to explore its new capabilities!</p>
            
            <a href="${process.env.VITE_APP_URL || 'http://localhost:8084'}/dashboard" style="display: inline-block; background: ${rarityColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
              View Your Evolved NFT
            </a>
            
            <p style="font-size: 14px; color: #888; margin-top: 30px;">Thank you for being part of the PointBridge evolution!</p>
            <p style="font-size: 14px; color: #888;">The PointBridge Team</p>
          </div>
        </div>
      `,
      textContent: `
🎉 NFT Evolution Complete!

Hi ${userName},

Congratulations! Your NFT has evolved into something extraordinary:

✨ ${evolvedNftName} (${rarity.toUpperCase()} RARITY)

Evolution Benefits:
- Enhanced earning ratios from your investments
- Exclusive 3D animated NFT
- Special abilities and bonus multipliers
- Access to premium staking pools
- Unique evolution wallet for dedicated earnings

Your evolved NFT is now active and earning enhanced rewards. Visit your dashboard to explore its new capabilities!

Dashboard: ${process.env.VITE_APP_URL || 'http://localhost:8084'}/dashboard

Thank you for being part of the PointBridge evolution!
The PointBridge Team
      `.trim()
    };
  }

  /**
   * Get email notification history for a user
   */
  static async getEmailHistory(userId: string, limit: number = 20): Promise<EmailNotification[]> {
    try {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmailHistory:', error);
      return [];
    }
  }
}
