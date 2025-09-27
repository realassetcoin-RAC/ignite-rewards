-- Complete Email Notification System (FIXED)
-- This script creates all necessary tables and functions for email notifications

-- 1. Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Create email notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create email delivery logs table
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.email_notifications(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for email templates
CREATE POLICY "Anyone can view active email templates" ON public.email_templates
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage email templates" ON public.email_templates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Create RLS policies for email notifications
CREATE POLICY "Users can view their own email notifications" ON public.email_notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email notifications" ON public.email_notifications
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert email notifications" ON public.email_notifications
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- 7. Create RLS policies for email delivery logs
CREATE POLICY "Admins can view email delivery logs" ON public.email_delivery_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_template_name ON public.email_notifications(template_name);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_notification_id ON public.email_delivery_logs(notification_id);

-- 9. Create function to send email notification (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.send_email_notification(
    p_user_id UUID,
    p_to_email VARCHAR(255),
    p_template_name VARCHAR(255),
    p_variables JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    template_record RECORD;
    notification_id UUID;
    subject_text VARCHAR(500);
    html_content_text TEXT;
    text_content_text TEXT;
    key TEXT;
    value TEXT;
BEGIN
    -- Get email template
    SELECT * INTO template_record
    FROM public.email_templates
    WHERE name = p_template_name AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email template % not found or inactive', p_template_name;
    END IF;
    
    -- Replace variables in template content
    subject_text := template_record.subject;
    html_content_text := template_record.html_content;
    text_content_text := COALESCE(template_record.text_content, '');
    
    -- Simple variable replacement (FIXED - proper loop syntax)
    -- This is a basic implementation - replace {{variable}} with values from p_variables
    FOR key, value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        subject_text := replace(subject_text, '{{' || key || '}}', value);
        html_content_text := replace(html_content_text, '{{' || key || '}}', value);
        text_content_text := replace(text_content_text, '{{' || key || '}}', value);
    END LOOP;
    
    -- Create email notification record
    INSERT INTO public.email_notifications (
        user_id, to_email, template_name, subject, html_content, text_content,
        variables, priority, status
    ) VALUES (
        p_user_id, p_to_email, p_template_name, subject_text, html_content_text, text_content_text,
        p_variables, p_priority, 'pending'
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to update email notification status
CREATE OR REPLACE FUNCTION public.update_email_notification_status(
    p_notification_id UUID,
    p_status VARCHAR(20),
    p_provider_message_id VARCHAR(255) DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.email_notifications
    SET 
        status = p_status,
        sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
        delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_notification_id;
    
    -- Log the delivery attempt
    INSERT INTO public.email_delivery_logs (
        notification_id, provider, provider_message_id, status, response_data
    ) VALUES (
        p_notification_id, 'system', p_provider_message_id, p_status, 
        jsonb_build_object('error_message', p_error_message)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get pending email notifications
CREATE OR REPLACE FUNCTION public.get_pending_email_notifications(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    to_email VARCHAR(255),
    subject VARCHAR(500),
    html_content TEXT,
    text_content TEXT,
    priority VARCHAR(20),
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        en.id,
        en.to_email,
        en.subject,
        en.html_content,
        en.text_content,
        en.priority,
        en.retry_count
    FROM public.email_notifications en
    WHERE en.status = 'pending'
    AND en.retry_count < en.max_retries
    ORDER BY 
        CASE en.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
        END,
        en.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION public.send_email_notification(UUID, VARCHAR, VARCHAR, JSONB, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_email_notification_status(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_email_notifications(INTEGER) TO authenticated;

-- 13. Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables) VALUES
(
    'welcome',
    'Welcome to RAC Rewards!',
    '<h1>Welcome to RAC Rewards!</h1><p>Hello {{user_name}},</p><p>Welcome to the RAC Rewards platform! Your account has been successfully created.</p><p>Get started by exploring our loyalty programs and earning rewards.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'Welcome to RAC Rewards!\n\nHello {{user_name}},\n\nWelcome to the RAC Rewards platform! Your account has been successfully created.\n\nGet started by exploring our loyalty programs and earning rewards.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string"}'
),
(
    'referral_welcome',
    'You''ve been referred to RAC Rewards!',
    '<h1>You''ve been referred to RAC Rewards!</h1><p>Hello {{user_name}},</p><p>{{referrer_name}} has referred you to RAC Rewards! You''ve earned {{points_awarded}} points as a welcome bonus.</p><p>Start earning more rewards by participating in our loyalty programs.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'You''ve been referred to RAC Rewards!\n\nHello {{user_name}},\n\n{{referrer_name}} has referred you to RAC Rewards! You''ve earned {{points_awarded}} points as a welcome bonus.\n\nStart earning more rewards by participating in our loyalty programs.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string", "referrer_name": "string", "points_awarded": "number"}'
),
(
    'loyalty_link_success',
    'Loyalty Account Linked Successfully',
    '<h1>Loyalty Account Linked Successfully</h1><p>Hello {{user_name}},</p><p>Your {{network_name}} account has been successfully linked to RAC Rewards.</p><p>You can now convert your loyalty points and enjoy enhanced rewards.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'Loyalty Account Linked Successfully\n\nHello {{user_name}},\n\nYour {{network_name}} account has been successfully linked to RAC Rewards.\n\nYou can now convert your loyalty points and enjoy enhanced rewards.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string", "network_name": "string"}'
),
(
    'point_conversion',
    'Points Converted Successfully',
    '<h1>Points Converted Successfully</h1><p>Hello {{user_name}},</p><p>You have successfully converted {{converted_points}} points from {{network_name}} to {{platform_tokens}} platform tokens.</p><p>Your new balance is {{new_balance}} tokens.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'Points Converted Successfully\n\nHello {{user_name}},\n\nYou have successfully converted {{converted_points}} points from {{network_name}} to {{platform_tokens}} platform tokens.\n\nYour new balance is {{new_balance}} tokens.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string", "converted_points": "number", "network_name": "string", "platform_tokens": "number", "new_balance": "number"}'
),
(
    'nft_evolution',
    'Your NFT Has Evolved!',
    '<h1>Your NFT Has Evolved!</h1><p>Hello {{user_name}},</p><p>Congratulations! Your {{nft_name}} has evolved to a {{rarity}} rarity level.</p><p>You now have access to enhanced rewards and benefits.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'Your NFT Has Evolved!\n\nHello {{user_name}},\n\nCongratulations! Your {{nft_name}} has evolved to a {{rarity}} rarity level.\n\nYou now have access to enhanced rewards and benefits.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string", "nft_name": "string", "rarity": "string"}'
),
(
    'point_release',
    'Points Released - {{points_released}} Points Available',
    '<h1>Points Released</h1><p>Hello {{user_name}},</p><p>Great news! {{points_released}} points from {{transaction_count}} transactions have been released and are now available in your account.</p><p>These points were held for 30 days as per our policy.</p><p>Best regards,<br>The RAC Rewards Team</p>',
    'Points Released\n\nHello {{user_name}},\n\nGreat news! {{points_released}} points from {{transaction_count}} transactions have been released and are now available in your account.\n\nThese points were held for 30 days as per our policy.\n\nBest regards,\nThe RAC Rewards Team',
    '{"user_name": "string", "points_released": "number", "transaction_count": "number"}'
)
ON CONFLICT (name) DO NOTHING;

-- 14. Add helpful comments
COMMENT ON TABLE public.email_templates IS 'Email templates for various notification types';
COMMENT ON TABLE public.email_notifications IS 'Email notifications queue and tracking';
COMMENT ON TABLE public.email_delivery_logs IS 'Email delivery logs and provider responses';
COMMENT ON FUNCTION public.send_email_notification IS 'Sends an email notification using a template';
COMMENT ON FUNCTION public.update_email_notification_status IS 'Updates the status of an email notification';
COMMENT ON FUNCTION public.get_pending_email_notifications IS 'Retrieves pending email notifications for processing';
