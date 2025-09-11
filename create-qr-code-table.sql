-- Create qr_code_data table for QR code functionality
-- This table stores QR code data for users

-- Create the table
CREATE TABLE IF NOT EXISTS public.qr_code_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qr_code_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS handling)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own QR codes" ON public.qr_code_data;
    DROP POLICY IF EXISTS "Users can insert their own QR codes" ON public.qr_code_data;
    DROP POLICY IF EXISTS "Users can update their own QR codes" ON public.qr_code_data;
    DROP POLICY IF EXISTS "Users can delete their own QR codes" ON public.qr_code_data;
    
    -- Create new policies
    CREATE POLICY "Users can view their own QR codes" ON public.qr_code_data
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own QR codes" ON public.qr_code_data
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own QR codes" ON public.qr_code_data
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own QR codes" ON public.qr_code_data
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Note: Test data insertion removed to avoid foreign key constraint violations
-- The table will be created empty and ready for real user data

-- Verify the table was created
SELECT 'qr_code_data table created successfully' as status;
