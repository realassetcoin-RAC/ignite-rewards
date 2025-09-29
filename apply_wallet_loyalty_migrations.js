import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Create Supabase client
const supabase = createClient(
  'https://wndswqvqogeblksrujpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

async function applyMigrations() {
  console.log('🔄 Applying wallet and loyalty migrations to cloud database...');
  
  try {
    // 1. Create user_solana_wallets table
    console.log('📝 Creating user_solana_wallets table...');
    const createWalletTable = `
      CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        wallet_address TEXT NOT NULL UNIQUE,
        seed_phrase_encrypted TEXT NOT NULL,
        public_key TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // 2. Create user_notifications table
    console.log('📝 Creating user_notifications table...');
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS public.user_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'earning', 'asset_link', 'new_feature', 'system', 'alert')),
        category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'earnings', 'asset_linking', 'new_features')),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // 3. Create get_user_loyalty_card function
    console.log('📝 Creating get_user_loyalty_card function...');
    const createLoyaltyFunction = `
      CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
      RETURNS TABLE (
        id UUID,
        user_id UUID,
        nft_type_id UUID,
        loyalty_number TEXT,
        card_number TEXT,
        full_name TEXT,
        email TEXT,
        points_balance INTEGER,
        tier_level TEXT,
        is_active BOOLEAN,
        nft_name TEXT,
        display_name TEXT,
        rarity TEXT,
        earn_on_spend_ratio DECIMAL,
        created_at TIMESTAMP WITH TIME ZONE
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ulc.id,
          ulc.user_id,
          ulc.nft_type_id,
          ulc.loyalty_number,
          ulc.card_number,
          ulc.full_name,
          ulc.email,
          ulc.points_balance,
          ulc.tier_level,
          ulc.is_active,
          nt.nft_name,
          nt.display_name,
          nt.rarity,
          nt.earn_on_spend_ratio,
          ulc.created_at
        FROM public.user_loyalty_cards ulc
        LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
        WHERE ulc.user_id = user_uuid
        AND ulc.is_active = TRUE
        ORDER BY ulc.created_at DESC
        LIMIT 1;
      END;
      $$;
    `;
    
    // 4. Create authenticate_with_seed_phrase function
    console.log('📝 Creating authenticate_with_seed_phrase function...');
    const createSeedPhraseFunction = `
      CREATE OR REPLACE FUNCTION public.authenticate_with_seed_phrase(p_seed_phrase TEXT)
      RETURNS TABLE (
        user_id UUID,
        email TEXT,
        full_name TEXT,
        role TEXT,
        auth_provider TEXT,
        has_solana_wallet BOOLEAN
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        found_user_id UUID;
        user_profile RECORD;
      BEGIN
        -- Find user by seed phrase in user_solana_wallets table
        SELECT usw.user_id INTO found_user_id
        FROM public.user_solana_wallets usw
        WHERE usw.seed_phrase_encrypted = p_seed_phrase
        LIMIT 1;
        
        -- If not found in user_solana_wallets, try user_wallets table
        IF found_user_id IS NULL THEN
          SELECT uw.user_id INTO found_user_id
          FROM public.user_wallets uw
          WHERE uw.encrypted_seed_phrase = p_seed_phrase
          LIMIT 1;
        END IF;
        
        -- If still not found, return empty result
        IF found_user_id IS NULL THEN
          RETURN;
        END IF;
        
        -- Get user profile information
        SELECT p.id, p.email, p.full_name, p.role, p.auth_provider, p.has_solana_wallet
        INTO user_profile
        FROM public.profiles p
        WHERE p.id = found_user_id;
        
        -- Return user information
        RETURN QUERY SELECT 
          user_profile.id,
          user_profile.email,
          user_profile.full_name,
          user_profile.role,
          user_profile.auth_provider,
          user_profile.has_solana_wallet;
      END;
      $$;
    `;
    
    // Since we can't execute raw SQL directly, let's test if the tables exist
    console.log('🔍 Testing table access...');
    
    // Test user_solana_wallets
    const walletTest = await supabase.from('user_solana_wallets').select('count').limit(1);
    console.log('✅ user_solana_wallets:', walletTest.error ? 'MISSING' : 'EXISTS');
    
    // Test user_notifications
    const notificationTest = await supabase.from('user_notifications').select('count').limit(1);
    console.log('✅ user_notifications:', notificationTest.error ? 'MISSING' : 'EXISTS');
    
    // Test get_user_loyalty_card function
    const functionTest = await supabase.rpc('get_user_loyalty_card', { user_uuid: '00000000-0000-0000-0000-000000000001' });
    console.log('✅ get_user_loyalty_card function:', functionTest.error ? 'MISSING' : 'EXISTS');
    
    // Test authenticate_with_seed_phrase function
    const seedPhraseTest = await supabase.rpc('authenticate_with_seed_phrase', { p_seed_phrase: 'test' });
    console.log('✅ authenticate_with_seed_phrase function:', seedPhraseTest.error ? 'MISSING' : 'EXISTS');
    
    console.log('\n📋 Summary:');
    console.log('- The tables and functions need to be created in the cloud database');
    console.log('- This requires database admin access or Supabase CLI');
    console.log('- The application is currently falling back to mock data');
    console.log('\n🔧 Next steps:');
    console.log('1. Use Supabase Dashboard to run the SQL migrations');
    console.log('2. Or install Supabase CLI and run: supabase db push');
    console.log('3. Or contact database admin to apply the migrations');
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error.message);
  }
}

applyMigrations();
