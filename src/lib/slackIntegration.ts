// import { supabase } from "@/integrations/supabase/client";

export interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface TicketData {
  ticketId: string;
  userEmail: string;
  userName?: string;
  category: string;
  tag?: string;
  description: string;
  attachments?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
  }>;
  priority?: string;
  createdAt: string;
}

/**
 * Get Slack webhook URL for a category
 */
async function getSlackWebhook(category: string): Promise<{
  success: boolean;
  webhookUrl?: string;
  channelName?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('slack_integration_settings')
      .select('webhook_url, channel_name')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching Slack webhook:', error);
      return { success: false, error: 'Slack webhook not configured for this category' };
    }

    return { 
      success: true, 
      webhookUrl: data.webhook_url,
      channelName: data.channel_name
    };
  } catch (error) {
    console.error('Error fetching Slack webhook:', error);
    return { success: false, error: 'Failed to fetch Slack configuration' };
  }
}

/**
 * Format ticket data for Slack message
 */
function formatTicketForSlack(ticket: TicketData): SlackMessage {
  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴'
  };

  const categoryEmoji = {
    technical_issue: '🔧',
    billing_account: '💳',
    feature_request: '💡',
    general_inquiry: '❓'
  };

  const priority = ticket.priority || 'medium';
  const categoryEmojiIcon = categoryEmoji[ticket.category as keyof typeof categoryEmoji] || '📋';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${categoryEmojiIcon} New Support Ticket: ${ticket.ticketId}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Ticket ID:*\n${ticket.ticketId}`
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${priorityEmoji[priority as keyof typeof priorityEmoji]} ${priority.toUpperCase()}`
        },
        {
          type: 'mrkdwn',
          text: `*Category:*\n${ticket.category.replace('_', ' ').toUpperCase()}`
        },
        {
          type: 'mrkdwn',
          text: `*Tag:*\n${ticket.tag || 'N/A'}`
        },
        {
          type: 'mrkdwn',
          text: `*User Email:*\n${ticket.userEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*User Name:*\n${ticket.userName || 'Anonymous'}`
        },
        {
          type: 'mrkdwn',
          text: `*Created:*\n${new Date(ticket.createdAt).toLocaleString()}`
        },
        {
          type: 'mrkdwn',
          text: `*Attachments:*\n${ticket.attachments?.length || 0} file(s)`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${ticket.description}`
      }
    }
  ];

  // Add attachment information if any
  if (ticket.attachments && ticket.attachments.length > 0) {
    const attachmentText = ticket.attachments.map(att => 
      `• <${att.fileUrl}|${att.fileName}> (${formatFileSize(att.fileSize)}, ${att.fileType})`
    ).join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Attachments:*\n${attachmentText}`
      }
    });
  }

  // Add action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View in Dashboard'
        },
        style: 'primary',
        url: `${window.location.origin}/admin/tickets/${ticket.ticketId}`
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Mark as In Progress'
        },
        style: 'danger',
        action_id: 'mark_in_progress',
        value: ticket.ticketId
      }
    ]
  });

  return {
    text: `New Support Ticket: ${ticket.ticketId}`,
    blocks,
    username: 'Support Bot',
    icon_emoji: ':robot_face:'
  };
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Send message to Slack
 */
async function sendSlackMessage(webhookUrl: string, message: SlackMessage): Promise<{
  success: boolean;
  messageTs?: string;
  error?: string;
}> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack API error:', errorText);
      return { 
        success: false, 
        error: `Slack API error: ${response.status} ${errorText}` 
      };
    }

    const responseData = await response.text();
    
    // Slack webhook responses are usually just "ok"
    if (responseData === 'ok') {
      return { success: true };
    } else {
      // Try to parse as JSON for message timestamp
      try {
        const jsonResponse = JSON.parse(responseData);
        return { 
          success: true, 
          messageTs: jsonResponse.ts 
        };
      } catch {
        return { success: true };
      }
    }
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return { 
      success: false, 
      error: `Failed to send Slack message: ${error}` 
    };
  }
}

/**
 * Send ticket notification to Slack
 */
export async function sendTicketToSlack(ticket: TicketData): Promise<{
  success: boolean;
  messageTs?: string;
  channelName?: string;
  error?: string;
}> {
  try {
    // Get Slack configuration for the ticket category
    const webhookResult = await getSlackWebhook(ticket.category);
    
    if (!webhookResult.success || !webhookResult.webhookUrl) {
      return { 
        success: false, 
        error: webhookResult.error || 'Slack webhook not configured' 
      };
    }

    // Format the ticket for Slack
    const slackMessage = formatTicketForSlack(ticket);

    // Send to Slack
    const sendResult = await sendSlackMessage(webhookResult.webhookUrl, slackMessage);

    if (sendResult.success) {
      // Update ticket with Slack message timestamp
      await supabase
        .from('contact_tickets')
        .update({
          slack_message_ts: sendResult.messageTs,
          slack_channel: webhookResult.channelName
        })
        .eq('ticket_id', ticket.ticketId);

      return {
        success: true,
        messageTs: sendResult.messageTs,
        channelName: webhookResult.channelName
      };
    } else {
      return {
        success: false,
        error: sendResult.error
      };
    }
  } catch (error) {
    console.error('Error sending ticket to Slack:', error);
    return {
      success: false,
      error: `Failed to send ticket to Slack: ${error}`
    };
  }
}

/**
 * Send status update to Slack
 */
export async function sendStatusUpdateToSlack(
  ticketId: string,
  status: string,
  updatedBy: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('contact_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Get Slack configuration
    const webhookResult = await getSlackWebhook(ticket.category);
    
    if (!webhookResult.success || !webhookResult.webhookUrl) {
      return { 
        success: false, 
        error: 'Slack webhook not configured for this category' 
      };
    }

    const statusEmoji = {
      open: '🟡',
      in_progress: '🔵',
      resolved: '✅',
      closed: '🔒'
    };

    const message: SlackMessage = {
      text: `Ticket ${ticketId} status updated`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji[status as keyof typeof statusEmoji]} *Ticket ${ticketId} Status Update*\n\n*New Status:* ${status.toUpperCase()}\n*Updated By:* ${updatedBy}\n*Updated At:* ${new Date().toLocaleString()}`
          }
        }
      ],
      username: 'Support Bot',
      icon_emoji: ':robot_face:'
    };

    if (notes) {
      message.blocks?.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Notes:*\n${notes}`
        }
      });
    }

    const sendResult = await sendSlackMessage(webhookResult.webhookUrl, message);
    
    return {
      success: sendResult.success,
      error: sendResult.error
    };
  } catch (error) {
    console.error('Error sending status update to Slack:', error);
    return {
      success: false,
      error: `Failed to send status update: ${error}`
    };
  }
}

/**
 * Send daily summary to Slack
 */
export async function sendDailySummaryToSlack(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get today's ticket statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayTickets, error: ticketsError } = await supabase
      .from('contact_tickets')
      .select('status, category, priority')
      .gte('created_at', today.toISOString());

    if (ticketsError) {
      console.error('Error fetching today\'s tickets:', ticketsError);
      return { success: false, error: 'Failed to fetch ticket data' };
    }

    const totalTickets = todayTickets?.length || 0;
    const openTickets = todayTickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = todayTickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedTickets = todayTickets?.filter(t => t.status === 'resolved').length || 0;

    // Get category breakdown
    const categoryMap = new Map<string, number>();
    todayTickets?.forEach(ticket => {
      const count = categoryMap.get(ticket.category) || 0;
      categoryMap.set(ticket.category, count + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, count]) => `• ${category.replace('_', ' ').toUpperCase()}: ${count}`)
      .join('\n');

    const message: SlackMessage = {
      text: `Daily Support Summary - ${today.toLocaleDateString()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Daily Support Summary - ${today.toLocaleDateString()}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Tickets:*\n${totalTickets}`
            },
            {
              type: 'mrkdwn',
              text: `*Open:*\n${openTickets}`
            },
            {
              type: 'mrkdwn',
              text: `*In Progress:*\n${inProgressTickets}`
            },
            {
              type: 'mrkdwn',
              text: `*Resolved:*\n${resolvedTickets}`
            }
          ]
        }
      ],
      username: 'Support Bot',
      icon_emoji: ':bar_chart:'
    };

    if (categoryBreakdown) {
      message.blocks?.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Category Breakdown:*\n${categoryBreakdown}`
        }
      });
    }

    // Send to all active channels
    const { data: webhooks, error: webhooksError } = await supabase
      .from('slack_integration_settings')
      .select('webhook_url, channel_name')
      .eq('is_active', true);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return { success: false, error: 'Failed to fetch Slack webhooks' };
    }

    const results = await Promise.allSettled(
      webhooks?.map(webhook => sendSlackMessage(webhook.webhook_url, message)) || []
    );

    const failed = results.filter(result => result.status === 'rejected').length;
    const succeeded = results.length - failed;

    return {
      success: succeeded > 0,
      error: failed > 0 ? `${failed} webhooks failed` : undefined
    };
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return {
      success: false,
      error: `Failed to send daily summary: ${error}`
    };
  }
}

/**
 * Test Slack webhook connection
 */
export async function testSlackWebhook(webhookUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const testMessage: SlackMessage = {
      text: '🧪 Slack Integration Test',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🧪 *Slack Integration Test*\n\nThis is a test message to verify the Slack webhook is working correctly.'
          }
        }
      ],
      username: 'Support Bot',
      icon_emoji: ':robot_face:'
    };

    const result = await sendSlackMessage(webhookUrl, testMessage);
    return result;
  } catch (error) {
    console.error('Error testing Slack webhook:', error);
    return {
      success: false,
      error: `Failed to test webhook: ${error}`
    };
  }
}
