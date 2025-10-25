// Script to create the missing referral_codes table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createReferralCodesTable() {
  console.log('🔧 Creating referral_codes table...\n');

  try {
    // Create the referral_codes table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.referral_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
        is_used BOOLEAN NOT NULL DEFAULT false,
        used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    console.log('Creating referral_codes table...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('❌ Error creating table:', createError.message);
    } else {
      console.log('✅ referral_codes table created successfully');
    }

    // Enable RLS
    const enableRLSSQL = `ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;`;
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    if (rlsError) {
      console.log('❌ Error enabling RLS:', rlsError.message);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
      CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON public.referral_codes(referrer_id);
    `;
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.log('❌ Error creating indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Create RLS policies
    const policiesSQL = `
      DROP POLICY IF EXISTS "Users can view their own codes" ON public.referral_codes;
      CREATE POLICY "Users can view their own codes" 
      ON public.referral_codes 
      FOR SELECT 
      USING (auth.uid() = referrer_id);

      DROP POLICY IF EXISTS "Users can create codes" ON public.referral_codes;
      CREATE POLICY "Users can create codes" 
      ON public.referral_codes 
      FOR INSERT 
      WITH CHECK (auth.uid() = referrer_id);

      DROP POLICY IF EXISTS "Admins can manage codes" ON public.referral_codes;
      CREATE POLICY "Admins can manage codes" 
      ON public.referral_codes 
      FOR ALL 
      USING (public.check_admin_access());
    `;
    console.log('Creating RLS policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    
    if (policiesError) {
      console.log('❌ Error creating policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    console.log('\n🎉 referral_codes table setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the creation
createReferralCodesTable();




