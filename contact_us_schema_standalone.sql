-- Contact Us System Schema (Standalone Version)
-- This schema supports the AI-powered chatbot and ticket management system
-- Modified to work without the profiles table dependency

-- Table for contact tickets
CREATE TABLE IF NOT EXISTS contact_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(20) UNIQUE NOT NULL, -- Human-readable ticket ID (e.g., TKT-2024-001)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- technical_issue, billing_account, feature_request, general_inquiry
    tag VARCHAR(100), -- Specific tag like login_issue, unauthorized_charge, etc.
    subject VARCHAR(500),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    slack_message_ts VARCHAR(50), -- Slack message timestamp for tracking
    slack_channel VARCHAR(100), -- Slack channel where ticket was posted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for ticket attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES contact_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL, -- Size in bytes
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL, -- URL to the stored file
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for chatbot conversation logs
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL, -- Unique session identifier
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    conversation_data JSONB NOT NULL, -- Full conversation history
    ticket_id UUID REFERENCES contact_tickets(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' -- active, completed, abandoned
);

-- Table for chatbot interaction logs
CREATE TABLE IF NOT EXISTS chatbot_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL, -- user_message, bot_response, system_action
    message_content TEXT,
    metadata JSONB, -- Additional data like buttons clicked, options selected
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for issue categories and tags
CREATE TABLE IF NOT EXISTS issue_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES issue_categories(id) ON DELETE CASCADE,
    tag_key VARCHAR(100) NOT NULL,
    tag_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, tag_key)
);

-- Table for Slack integration settings
CREATE TABLE IF NOT EXISTS slack_integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    channel_id VARCHAR(100) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_tickets_ticket_id ON contact_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_user_id ON contact_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_status ON contact_tickets(status);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_category ON contact_tickets(category);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_created_at ON contact_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_conversation_id ON chatbot_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_issue_tags_category_id ON issue_tags(category_id);

-- Row Level Security (RLS) Policies (Simplified without profiles table)
ALTER TABLE contact_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_tickets (Simplified)
CREATE POLICY "Users can view their own tickets" ON contact_tickets
    FOR SELECT USING (user_id = auth.uid() OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create tickets" ON contact_tickets
    FOR INSERT WITH CHECK (true); -- Allow anonymous ticket creation

CREATE POLICY "Authenticated users can update their own tickets" ON contact_tickets
    FOR UPDATE USING (user_id = auth.uid() OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for ticket_attachments (Simplified)
CREATE POLICY "Users can view attachments for their tickets" ON ticket_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contact_tickets 
            WHERE contact_tickets.id = ticket_attachments.ticket_id 
            AND (contact_tickets.user_id = auth.uid() OR contact_tickets.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Users can upload attachments" ON ticket_attachments
    FOR INSERT WITH CHECK (true); -- Allow anonymous uploads

-- RLS Policies for chatbot_conversations (Simplified)
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can create conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (true);

-- RLS Policies for chatbot_interactions (Simplified)
CREATE POLICY "Users can view interactions for their conversations" ON chatbot_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chatbot_conversations 
            WHERE chatbot_conversations.id = chatbot_interactions.conversation_id 
            AND chatbot_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create interactions" ON chatbot_interactions
    FOR INSERT WITH CHECK (true);

-- RLS Policies for issue_categories and tags (public read)
CREATE POLICY "Anyone can view active categories" ON issue_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active tags" ON issue_tags
    FOR SELECT USING (is_active = true);

-- RLS Policies for slack_integration_settings (admin only - simplified)
CREATE POLICY "Authenticated users can view Slack settings" ON slack_integration_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_contact_tickets_updated_at 
    BEFORE UPDATE ON contact_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slack_integration_settings_updated_at 
    BEFORE UPDATE ON slack_integration_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket ID
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    ticket_id VARCHAR(20);
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM contact_tickets
    WHERE ticket_id LIKE 'TKT-' || year_part || '-%';
    
    ticket_id := 'TKT-' || year_part || '-' || LPAD(sequence_num::VARCHAR, 3, '0');
    
    RETURN ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default issue categories
INSERT INTO issue_categories (category_key, category_name, description) VALUES
('technical_issue', 'Technical Issue', 'Problems with the platform, bugs, or technical difficulties'),
('billing_account', 'Billing & Account', 'Payment issues, account problems, subscription questions'),
('feature_request', 'Feature Request/Feedback', 'Suggestions for new features or improvements'),
('general_inquiry', 'General Inquiry', 'General questions about the platform or services')
ON CONFLICT (category_key) DO NOTHING;

-- Insert default issue tags
INSERT INTO issue_tags (category_id, tag_key, tag_name, description) VALUES
-- Technical Issue tags
((SELECT id FROM issue_categories WHERE category_key = 'technical_issue'), 'login_issue', 'Login Problems', 'Unable to log in or authentication issues'),
((SELECT id FROM issue_categories WHERE category_key = 'technical_issue'), 'app_crash', 'App Crashes', 'Application crashes or freezes'),
((SELECT id FROM issue_categories WHERE category_key = 'technical_issue'), 'slow_performance', 'Slow Performance', 'Platform running slowly or timing out'),
((SELECT id FROM issue_categories WHERE category_key = 'technical_issue'), 'data_sync', 'Data Sync Issues', 'Problems with data synchronization'),
((SELECT id FROM issue_categories WHERE category_key = 'technical_issue'), 'api_error', 'API Errors', 'Third-party API integration problems'),

-- Billing & Account tags
((SELECT id FROM issue_categories WHERE category_key = 'billing_account'), 'unauthorized_charge', 'Unauthorized Charge', 'Unexpected charges on account'),
((SELECT id FROM issue_categories WHERE category_key = 'billing_account'), 'payment_failed', 'Payment Failed', 'Payment processing errors'),
((SELECT id FROM issue_categories WHERE category_key = 'billing_account'), 'subscription_issue', 'Subscription Issues', 'Problems with subscription management'),
((SELECT id FROM issue_categories WHERE category_key = 'billing_account'), 'account_locked', 'Account Locked', 'Account access restrictions'),
((SELECT id FROM issue_categories WHERE category_key = 'billing_account'), 'refund_request', 'Refund Request', 'Request for payment refund'),

-- Feature Request tags
((SELECT id FROM issue_categories WHERE category_key = 'feature_request'), 'new_feature', 'New Feature Request', 'Suggestion for new functionality'),
((SELECT id FROM issue_categories WHERE category_key = 'feature_request'), 'ui_improvement', 'UI/UX Improvement', 'Interface or user experience improvements'),
((SELECT id FROM issue_categories WHERE category_key = 'feature_request'), 'integration_request', 'Integration Request', 'Request for third-party integrations'),
((SELECT id FROM issue_categories WHERE category_key = 'feature_request'), 'mobile_app', 'Mobile App Features', 'Mobile application feature requests'),

-- General Inquiry tags
((SELECT id FROM issue_categories WHERE category_key = 'general_inquiry'), 'how_to_use', 'How to Use', 'Questions about platform usage'),
((SELECT id FROM issue_categories WHERE category_key = 'general_inquiry'), 'pricing_info', 'Pricing Information', 'Questions about pricing and plans'),
((SELECT id FROM issue_categories WHERE category_key = 'general_inquiry'), 'partnership', 'Partnership Inquiry', 'Business partnership opportunities'),
((SELECT id FROM issue_categories WHERE category_key = 'general_inquiry'), 'other', 'Other', 'General questions not covered by other categories')
ON CONFLICT (category_id, tag_key) DO NOTHING;

-- Insert default Slack integration settings
INSERT INTO slack_integration_settings (category, channel_id, channel_name, webhook_url) VALUES
('technical_issue', 'C1234567890', 'tech-support', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'),
('billing_account', 'C1234567891', 'billing-support', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'),
('feature_request', 'C1234567892', 'feature-requests', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'),
('general_inquiry', 'C1234567893', 'general-support', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
