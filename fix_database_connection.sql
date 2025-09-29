-- Create missing chatbot_conversations table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    message_type VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can view their own conversations" ON public.chatbot_conversations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can insert their own conversations" ON public.chatbot_conversations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can update their own conversations" ON public.chatbot_conversations 
FOR UPDATE USING (auth.uid() = user_id);

-- Verify table creation
SELECT 'chatbot_conversations table created successfully' as status;


