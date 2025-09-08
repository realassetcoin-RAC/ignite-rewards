# Slack Integration Setup Guide

## Overview

This guide will walk you through setting up Slack integration for the Contact Us system. The integration automatically routes support tickets to appropriate Slack channels based on issue categories, providing real-time notifications and streamlined team collaboration.

## 🚀 Quick Setup Checklist

- [ ] Create Slack App
- [ ] Configure Incoming Webhooks
- [ ] Set up Support Channels
- [ ] Configure Webhook URLs in Database
- [ ] Test Integration
- [ ] Set up Monitoring

## 📋 Prerequisites

- Slack workspace with admin permissions
- Access to your Supabase database
- Contact Us system deployed and running

## 🔧 Step-by-Step Setup

### Step 1: Create a Slack App

1. **Go to Slack API Dashboard**
   - Visit [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App"
   - Choose "From scratch"
   - Enter app name: "Contact Us Support Bot"
   - Select your workspace

2. **Configure App Settings**
   - Go to "Basic Information"
   - Add app description: "AI-powered support ticket routing system"
   - Upload app icon (optional but recommended)
   - Set app display name: "Support Bot"

### Step 2: Enable Incoming Webhooks

1. **Navigate to Incoming Webhooks**
   - In your app settings, go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON

2. **Add Webhook URLs**
   - Click "Add New Webhook to Workspace"
   - Select the channel for each category:
     - **Technical Issues** → `#tech-support`
     - **Billing & Account** → `#billing-support`
     - **Feature Requests** → `#feature-requests`
     - **General Inquiries** → `#general-support`

3. **Copy Webhook URLs**
   - Save each webhook URL - you'll need them for database configuration
   - Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

### Step 3: Set Up Support Channels

Create dedicated channels for each support category:

#### Technical Support Channel (`#tech-support`)
```
Purpose: Technical issues, bugs, and system problems
Members: Technical support team, developers
Settings: 
- Enable notifications for all messages
- Pin important resources
- Set up channel description
```

#### Billing Support Channel (`#billing-support`)
```
Purpose: Payment issues, account problems, subscription questions
Members: Billing team, customer success
Settings:
- Enable notifications for all messages
- Pin billing policies and procedures
- Set up channel description
```

#### Feature Requests Channel (`#feature-requests`)
```
Purpose: User suggestions, feature requests, product feedback
Members: Product team, developers, designers
Settings:
- Enable notifications for all messages
- Pin feature request templates
- Set up channel description
```

#### General Support Channel (`#general-support`)
```
Purpose: General inquiries, questions, and miscellaneous support
Members: General support team, customer success
Settings:
- Enable notifications for all messages
- Pin FAQ and common responses
- Set up channel description
```

### Step 4: Configure Database Settings

Update the `slack_integration_settings` table with your webhook URLs:

```sql
-- Update webhook URLs (replace with your actual webhook URLs)
UPDATE slack_integration_settings 
SET 
  webhook_url = 'https://hooks.slack.com/services/YOUR/TECH/WEBHOOK',
  channel_name = 'tech-support',
  is_active = true
WHERE category = 'technical_issue';

UPDATE slack_integration_settings 
SET 
  webhook_url = 'https://hooks.slack.com/services/YOUR/BILLING/WEBHOOK',
  channel_name = 'billing-support',
  is_active = true
WHERE category = 'billing_account';

UPDATE slack_integration_settings 
SET 
  webhook_url = 'https://hooks.slack.com/services/YOUR/FEATURES/WEBHOOK',
  channel_name = 'feature-requests',
  is_active = true
WHERE category = 'feature_request';

UPDATE slack_integration_settings 
SET 
  webhook_url = 'https://hooks.slack.com/services/YOUR/GENERAL/WEBHOOK',
  channel_name = 'general-support',
  is_active = true
WHERE category = 'general_inquiry';
```

### Step 5: Test the Integration

1. **Create a Test Ticket**
   - Go to your Contact Us page
   - Start a chat with the AI assistant
   - Create a test ticket in each category

2. **Verify Slack Notifications**
   - Check that messages appear in the correct channels
   - Verify message formatting and content
   - Test action buttons (if implemented)

3. **Test Error Handling**
   - Try with invalid webhook URLs
   - Test with network connectivity issues
   - Verify error logging

## 🎨 Message Format Customization

### Default Message Format

The system sends rich, formatted messages with:

- **Header**: Category emoji + ticket ID
- **Fields**: Priority, category, tag, user info, timestamps
- **Description**: Full issue description
- **Attachments**: File information (if any)
- **Action Buttons**: Quick actions for ticket management

### Customizing Message Format

You can customize the message format by modifying `src/lib/slackIntegration.ts`:

```typescript
// Customize emojis for categories
const categoryEmoji = {
  technical_issue: '🔧',
  billing_account: '💳',
  feature_request: '💡',
  general_inquiry: '❓'
};

// Customize priority emojis
const priorityEmoji = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴'
};
```

### Adding Custom Fields

To add custom fields to Slack messages:

```typescript
// Add custom field to message blocks
blocks.push({
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: `*Custom Field:*\n${customValue}`
    }
  ]
});
```

## 🔒 Security Best Practices

### Webhook Security

1. **Keep Webhook URLs Secret**
   - Never commit webhook URLs to version control
   - Store them securely in environment variables or database
   - Rotate webhook URLs periodically

2. **Validate Incoming Data**
   - Always validate ticket data before sending to Slack
   - Sanitize user input to prevent injection attacks
   - Implement rate limiting for webhook calls

3. **Monitor Webhook Usage**
   - Set up alerts for failed webhook deliveries
   - Monitor webhook usage patterns
   - Log all webhook activities

### Access Control

1. **Channel Permissions**
   - Restrict channel access to relevant team members
   - Use private channels for sensitive information
   - Regularly review channel membership

2. **App Permissions**
   - Use minimal required permissions
   - Regularly review app permissions
   - Remove unused permissions

## 📊 Monitoring and Analytics

### Set Up Monitoring

1. **Webhook Delivery Monitoring**
   ```typescript
   // Add to your monitoring system
   const webhookMetrics = {
     totalSent: 0,
     successfulDeliveries: 0,
     failedDeliveries: 0,
     averageResponseTime: 0
   };
   ```

2. **Error Tracking**
   - Set up alerts for webhook failures
   - Monitor response times
   - Track delivery success rates

3. **Usage Analytics**
   - Track ticket volume by category
   - Monitor response times
   - Analyze team performance

### Dashboard Integration

Create a monitoring dashboard to track:

- **Ticket Volume**: Daily/weekly/monthly ticket counts
- **Response Times**: Average time to first response
- **Category Distribution**: Breakdown by issue type
- **Team Performance**: Resolution times by team member
- **Webhook Health**: Delivery success rates

## 🚨 Troubleshooting

### Common Issues

#### Webhook Not Delivering Messages

**Symptoms**: Messages not appearing in Slack channels

**Solutions**:
1. Verify webhook URL is correct
2. Check channel permissions
3. Ensure webhook is active
4. Test webhook manually

```bash
# Test webhook manually
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"Test message"}' \
YOUR_WEBHOOK_URL
```

#### Messages Appearing in Wrong Channels

**Symptoms**: Tickets routed to incorrect channels

**Solutions**:
1. Check category mapping in database
2. Verify webhook URL assignments
3. Review ticket categorization logic

#### Formatting Issues

**Symptoms**: Messages not displaying properly

**Solutions**:
1. Check Slack block format
2. Validate JSON structure
3. Test with simple messages first

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Add to your environment variables
DEBUG_SLACK=true

// In slackIntegration.ts
if (process.env.DEBUG_SLACK) {
  console.log('Slack webhook request:', {
    url: webhookUrl,
    message: message,
    timestamp: new Date().toISOString()
  });
}
```

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**
   - Review webhook delivery logs
   - Check channel activity and engagement
   - Monitor error rates

2. **Monthly**
   - Review and update webhook URLs if needed
   - Analyze ticket volume and response times
   - Update channel descriptions and pinned messages

3. **Quarterly**
   - Review app permissions and access
   - Update message formatting if needed
   - Conduct security audit

### Backup and Recovery

1. **Webhook URL Backup**
   - Store webhook URLs securely
   - Document channel configurations
   - Keep backup of integration settings

2. **Recovery Procedures**
   - Document webhook recreation process
   - Test recovery procedures regularly
   - Maintain contact list for Slack admins

## 📞 Support

### Getting Help

If you encounter issues with the Slack integration:

1. **Check Documentation**: Review this guide and the main README
2. **Test Webhooks**: Use the manual testing methods above
3. **Review Logs**: Check application logs for error messages
4. **Contact Support**: Reach out to the development team

### Useful Resources

- [Slack API Documentation](https://api.slack.com/)
- [Incoming Webhooks Guide](https://api.slack.com/messaging/webhooks)
- [Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Slack Community](https://slackcommunity.com/)

## 🎯 Advanced Features

### Custom Actions

Add custom action buttons to Slack messages:

```typescript
// Add action buttons to message blocks
blocks.push({
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: { type: 'plain_text', text: 'Mark as Resolved' },
      style: 'primary',
      action_id: 'mark_resolved',
      value: ticketId
    },
    {
      type: 'button',
      text: { type: 'plain_text', text: 'Assign to Me' },
      action_id: 'assign_to_me',
      value: ticketId
    }
  ]
});
```

### Interactive Components

Set up interactive components to handle button clicks:

1. **Enable Interactivity**
   - Go to your Slack app settings
   - Navigate to "Interactivity & Shortcuts"
   - Enable interactivity
   - Set request URL to your webhook endpoint

2. **Handle Interactions**
   ```typescript
   // Handle button clicks
   app.action('mark_resolved', async ({ ack, body, client }) => {
     await ack();
     // Update ticket status in database
     // Send confirmation message
   });
   ```

### Scheduled Reports

Set up daily/weekly summary reports:

```typescript
// Daily summary function
export async function sendDailySummary() {
  const summary = await generateDailySummary();
  const message = formatSummaryMessage(summary);
  
  // Send to all channels
  await sendToAllChannels(message);
}
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Real Asset Coin Development Team
