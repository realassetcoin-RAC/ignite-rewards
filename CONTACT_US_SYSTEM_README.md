# Contact Us System - AI-Powered Support Platform

## Overview

The Contact Us System is a comprehensive, AI-powered support platform that provides 24/7 customer assistance through an intelligent chatbot and direct email support. The system features automated ticket creation, issue categorization, file attachment support, and seamless Slack integration for team collaboration.

## 🚀 Features

### User-Facing Features
- **Direct Email Support**: Display of `realassetcoin@gmail.com` with one-click email composition
- **AI-Powered Chatbot**: 24/7 intelligent assistant for instant support
- **Issue Categorization**: Smart categorization of support requests
- **File Attachments**: Support for screenshots, videos, and documents (up to 5MB per file, max 3 files)
- **Ticket Tracking**: Unique ticket IDs for all support requests
- **Real-time Chat**: Interactive conversation flow with the AI assistant

### Admin Features
- **Ticket Management**: Complete ticket lifecycle management
- **Slack Integration**: Automatic routing to appropriate Slack channels
- **Analytics Dashboard**: Support metrics and performance tracking
- **Category Management**: Customizable issue categories and tags
- **File Management**: Secure attachment storage and retrieval

### Technical Features
- **24/7 Availability**: Always-on chatbot service
- **Near-instantaneous Responses**: Optimized for real-time interaction
- **Secure Data Handling**: Encrypted file storage and transmission
- **Comprehensive Logging**: Full audit trail of all interactions
- **Scalable Architecture**: Built for high-volume support operations

## 🏗️ Architecture

### Database Schema

The system uses the following main tables:

#### Core Tables
- **`contact_tickets`**: Main ticket storage with status tracking
- **`ticket_attachments`**: File attachment metadata and URLs
- **`chatbot_conversations`**: Chat session management
- **`chatbot_interactions`**: Individual message logging
- **`issue_categories`**: Support issue categories
- **`issue_tags`**: Specific issue tags within categories
- **`slack_integration_settings`**: Slack webhook configurations

#### Key Features
- **Row Level Security (RLS)**: Secure data access based on user roles
- **Automatic Timestamps**: Created/updated timestamp tracking
- **Unique Ticket IDs**: Human-readable ticket numbering (TKT-2024-001)
- **File Size Validation**: 5MB per file limit enforcement
- **Session Management**: Unique session tracking for conversations

### Component Structure

```
src/
├── pages/
│   └── ContactUs.tsx              # Main contact page
├── components/
│   └── ContactChatbot.tsx         # AI chatbot component
├── lib/
│   ├── contactSystem.ts           # Core contact system functions
│   └── slackIntegration.ts        # Slack API integration
└── contact_us_schema.sql          # Database schema
```

## 🤖 AI Chatbot Flow

### Conversation States
1. **Greeting**: Initial welcome and assistance offer
2. **Query**: User question analysis and response
3. **Category**: Issue categorization selection
4. **Tag**: Specific tag selection within category
5. **Description**: Detailed issue description input
6. **Attachments**: File upload (optional)
7. **Confirmation**: Ticket details review
8. **Completed**: Success confirmation with ticket ID

### AI Capabilities
- **Query Analysis**: Intelligent understanding of user questions
- **Content Guidance**: Direction to relevant help resources
- **Issue Routing**: Smart categorization and tagging
- **Context Awareness**: Maintains conversation context
- **Error Handling**: Graceful handling of invalid inputs

## 📧 Email Integration

### Direct Email Support
- **Email Address**: `realassetcoin@gmail.com`
- **One-Click Composition**: Pre-filled subject and body templates
- **User Context**: Automatic inclusion of user information
- **Response Time**: Within 24 hours commitment

### Email Templates
- **Subject**: "Support Request"
- **Body**: Includes user details and issue description template
- **User Information**: Automatic inclusion of user email and name

## 🎫 Ticket Management

### Ticket Lifecycle
1. **Creation**: Automatic ticket generation with unique ID
2. **Categorization**: Smart category and tag assignment
3. **Routing**: Automatic Slack channel routing
4. **Assignment**: Admin assignment to support agents
5. **Resolution**: Status tracking and resolution logging
6. **Closure**: Final status update and archiving

### Ticket Statuses
- **Open**: Newly created, awaiting assignment
- **In Progress**: Assigned and being worked on
- **Resolved**: Issue resolved, awaiting user confirmation
- **Closed**: Fully completed and archived

### Priority Levels
- **Low**: General inquiries and minor issues
- **Medium**: Standard support requests
- **High**: Urgent issues requiring quick resolution
- **Urgent**: Critical issues requiring immediate attention

## 📎 File Attachment System

### Supported File Types
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WebM
- **Documents**: PDF, DOC, DOCX, TXT
- **Archives**: ZIP, RAR (for log files)

### File Validation
- **Size Limit**: 5MB per file
- **Quantity Limit**: Maximum 3 files per ticket
- **Security**: Virus scanning and type validation
- **Storage**: Secure Supabase Storage with public URLs

### File Management
- **Upload**: Direct upload to Supabase Storage
- **Retrieval**: Secure file access with expiration
- **Cleanup**: Automatic cleanup of orphaned files
- **Backup**: Regular backup of critical attachments

## 🔗 Slack Integration

### Channel Routing
- **Technical Issues**: `#tech-support`
- **Billing & Account**: `#billing-support`
- **Feature Requests**: `#feature-requests`
- **General Inquiries**: `#general-support`

### Message Format
- **Rich Formatting**: Structured blocks with emojis and formatting
- **Ticket Details**: Complete ticket information display
- **Action Buttons**: Quick actions for ticket management
- **Status Updates**: Real-time status change notifications

### Webhook Configuration
- **Secure URLs**: Encrypted webhook endpoints
- **Error Handling**: Retry logic for failed deliveries
- **Rate Limiting**: Respect Slack API rate limits
- **Monitoring**: Delivery status tracking

## 🔒 Security Features

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based access with RLS policies
- **Audit Logging**: Complete interaction history
- **File Security**: Secure file storage with access controls

### Privacy Compliance
- **Data Minimization**: Only necessary data collection
- **User Consent**: Clear consent for data processing
- **Right to Deletion**: User data deletion capabilities
- **Data Portability**: Export user data on request

## 📊 Analytics & Reporting

### Key Metrics
- **Ticket Volume**: Daily, weekly, monthly ticket counts
- **Response Times**: Average time to first response
- **Resolution Times**: Time to ticket resolution
- **Category Breakdown**: Issue type distribution
- **User Satisfaction**: Feedback and rating tracking

### Dashboard Features
- **Real-time Updates**: Live metric updates
- **Trend Analysis**: Historical performance tracking
- **Custom Reports**: Configurable reporting options
- **Export Capabilities**: Data export in multiple formats

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase project with service role key
- Slack workspace with webhook permissions
- File storage bucket configured

### Database Setup
1. **Run Migration**:
   ```bash
   node apply_contact_us_migration.js
   ```

2. **Configure Storage**:
   ```sql
   -- Create storage bucket for attachments
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('contact-attachments', 'contact-attachments', true);
   ```

3. **Set Up RLS Policies**:
   ```sql
   -- Policies are automatically created by migration
   -- Verify with: SELECT * FROM pg_policies WHERE tablename = 'contact_tickets';
   ```

### Environment Configuration
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Slack Configuration (Optional - can be set in database)
SLACK_WEBHOOK_TECH=https://hooks.slack.com/services/...
SLACK_WEBHOOK_BILLING=https://hooks.slack.com/services/...
SLACK_WEBHOOK_FEATURES=https://hooks.slack.com/services/...
SLACK_WEBHOOK_GENERAL=https://hooks.slack.com/services/...
```

### Component Integration
1. **Add Route**:
   ```tsx
   import ContactUs from '@/pages/ContactUs';
   
   <Route path="/contact" element={<ContactUs />} />
   ```

2. **Add Navigation**:
   ```tsx
   <Link to="/contact">Contact Us</Link>
   ```

3. **Import Components**:
   ```tsx
   import ContactChatbot from '@/components/ContactChatbot';
   ```

## 🔧 Configuration

### Slack Webhook Setup
1. **Create Slack App**: Go to api.slack.com/apps
2. **Enable Incoming Webhooks**: Add webhook URLs
3. **Configure Channels**: Set up dedicated support channels
4. **Update Database**: Insert webhook URLs in `slack_integration_settings`

### Issue Categories Customization
```sql
-- Add new category
INSERT INTO issue_categories (category_key, category_name, description) 
VALUES ('new_category', 'New Category', 'Description of new category');

-- Add tags for category
INSERT INTO issue_tags (category_id, tag_key, tag_name, description) 
VALUES (
  (SELECT id FROM issue_categories WHERE category_key = 'new_category'),
  'new_tag', 'New Tag', 'Description of new tag'
);
```

### File Upload Configuration
```typescript
// Adjust file size limits in contactSystem.ts
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_TICKET = 3;

// Configure allowed file types
const ALLOWED_FILE_TYPES = [
  'image/png', 'image/jpeg', 'image/gif',
  'video/mp4', 'video/avi',
  'application/pdf', 'text/plain'
];
```

## 🧪 Testing

### Unit Tests
```bash
# Test contact system functions
npm test src/lib/contactSystem.test.ts

# Test Slack integration
npm test src/lib/slackIntegration.test.ts

# Test chatbot component
npm test src/components/ContactChatbot.test.tsx
```

### Integration Tests
```bash
# Test full ticket creation flow
npm run test:integration

# Test Slack webhook delivery
npm run test:slack

# Test file upload functionality
npm run test:upload
```

### Manual Testing Checklist
- [ ] Contact page loads correctly
- [ ] Email link opens mail client
- [ ] Chatbot opens and responds
- [ ] Issue categorization works
- [ ] File upload functions properly
- [ ] Ticket creation generates ID
- [ ] Slack notifications are sent
- [ ] Admin can view tickets

## 🐛 Troubleshooting

### Common Issues

#### Chatbot Not Responding
- Check conversation creation in database
- Verify user authentication
- Review browser console for errors
- Check network connectivity

#### File Upload Failures
- Verify Supabase Storage bucket exists
- Check file size limits
- Validate file type restrictions
- Review storage permissions

#### Slack Notifications Not Sending
- Verify webhook URLs are correct
- Check Slack app permissions
- Review webhook rate limits
- Test webhook connectivity

#### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies
- Review database permissions
- Test connection with simple query

### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Contact system debug info:', {
    conversationId,
    ticketId,
    userEmail,
    category
  });
}
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Optimized indexes on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized queries for better performance
- **Caching**: Redis caching for frequently accessed data

### Frontend Optimization
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Reduced initial bundle size
- **Image Optimization**: Compressed and optimized images
- **CDN Integration**: Fast content delivery

### Backend Optimization
- **API Rate Limiting**: Prevent abuse and ensure stability
- **Background Jobs**: Async processing for heavy operations
- **Caching Strategy**: Intelligent caching for better performance
- **Monitoring**: Real-time performance monitoring

## 🔄 Maintenance

### Regular Tasks
- **Database Cleanup**: Remove old conversations and attachments
- **Log Rotation**: Archive old log files
- **Performance Monitoring**: Track system performance metrics
- **Security Updates**: Keep dependencies updated

### Backup Strategy
- **Database Backups**: Daily automated backups
- **File Backups**: Regular attachment backups
- **Configuration Backups**: Backup of system configurations
- **Disaster Recovery**: Tested recovery procedures

## 📞 Support

For technical support or questions about the Contact Us System:

- **Email**: realassetcoin@gmail.com
- **Documentation**: This README file
- **Issues**: Create GitHub issues for bugs or feature requests
- **Updates**: Check for system updates and improvements

## 📄 License

This Contact Us System is part of the Real Asset Coin platform and follows the same licensing terms as the main application.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Real Asset Coin Development Team
