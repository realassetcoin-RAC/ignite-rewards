#!/usr/bin/env node

/**
 * Apply Virtual Cards Schema and Permissions Fix
 * 
 * This script applies the comprehensive fix for virtual card creation issues
 * by executing the necessary SQL commands through the Supabase client.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Initialize Supabase client with service role for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging utilities
const log = {
  info: (message, data = {}) => {
    console.log(`ℹ️  [INFO] ${message}`, Object.keys(data).length ? data : '');
  },
  success: (message, data = {}) => {
    console.log(`✅ [SUCCESS] ${message}`, Object.keys(data).length ? data : '');
  },
  warn: (message, data = {}) => {
    console.log(`⚠️  [WARN] ${message}`, Object.keys(data).length ? data : '');
  },
  error: (message, error = null, data = {}) => {
    console.log(`❌ [ERROR] ${message}`, Object.keys(data).length ? data : '');
    if (error) {
      console.log(`   Error Details:`, error);
    }
  },
  debug: (message, data = {}) => {
    console.log(`🐛 [DEBUG] ${message}`, Object.keys(data).length ? data : '');
  }
};

// Execute SQL command
async function executeSql(sql, description) {
  log.info(`Executing: ${description}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      log.error(`Failed: ${description}`, error);
      return false;
    }
    
    log.success(`Completed: ${description}`, { result: data });
    return true;
  } catch (error) {
    log.error(`Exception during: ${description}`, error);
    return false;
  }
}

// Main fix application function
async function applyVirtualCardsFix() {
  console.log('🚀 Starting Virtual Cards Schema and Permissions Fix\n');
  
  const fixes = [
    {
      description: "Create API schema",
      sql: "CREATE SCHEMA IF NOT EXISTS api;"
    },
    {
      description: "Create card_type enum in API schema",
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
                CREATE TYPE api.card_type AS ENUM ('rewards', 'loyalty', 'membership', 'gift', 'loyalty_plus');
            END IF;
        END $$;
      `
    },
    {
      description: "Create subscription_plan enum in API schema",
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
                CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
            END IF;
        END $$;
      `
    },
    {
      description: "Create pricing_type enum in API schema",
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
                CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
            END IF;
        END $$;
      `
    },
    {
      description: "Create app_role enum in API schema",
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
                CREATE TYPE api.app_role AS ENUM ('admin', 'merchant', 'customer');
            END IF;
        END $$;
      `
    },
    {
      description: "Create virtual_cards table in API schema",
      sql: `
        CREATE TABLE IF NOT EXISTS api.virtual_cards (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            card_name TEXT NOT NULL,
            card_type api.card_type NOT NULL,
            description TEXT,
            image_url TEXT,
            subscription_plan api.subscription_plan,
            pricing_type api.pricing_type NOT NULL DEFAULT 'free',
            one_time_fee DECIMAL(10,2) DEFAULT 0,
            monthly_fee DECIMAL(10,2) DEFAULT 0,
            annual_fee DECIMAL(10,2) DEFAULT 0,
            features JSONB,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
    },
    {
      description: "Create profiles table in API schema",
      sql: `
        CREATE TABLE IF NOT EXISTS api.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role api.app_role DEFAULT 'customer',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
    },
    {
      description: "Enable RLS on API tables",
      sql: `
        ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE api.virtual_cards ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      description: "Create is_admin helper function",
      sql: `
        CREATE OR REPLACE FUNCTION api.is_admin()
        RETURNS boolean
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM api.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            );
        $$;
      `
    },
    {
      description: "Create RLS policy for admin access to virtual_cards",
      sql: `
        DROP POLICY IF EXISTS "Admins have full access to virtual_cards" ON api.virtual_cards;
        CREATE POLICY "Admins have full access to virtual_cards" ON api.virtual_cards
            FOR ALL TO authenticated
            USING (api.is_admin())
            WITH CHECK (api.is_admin());
      `
    },
    {
      description: "Create RLS policy for viewing active virtual_cards",
      sql: `
        DROP POLICY IF EXISTS "Authenticated users can view active virtual_cards" ON api.virtual_cards;
        CREATE POLICY "Authenticated users can view active virtual_cards" ON api.virtual_cards
            FOR SELECT TO authenticated
            USING (is_active = true OR api.is_admin());
      `
    },
    {
      description: "Create RLS policy for anonymous access to active virtual_cards",
      sql: `
        DROP POLICY IF EXISTS "Anonymous users can view active virtual_cards" ON api.virtual_cards;
        CREATE POLICY "Anonymous users can view active virtual_cards" ON api.virtual_cards
            FOR SELECT TO anon
            USING (is_active = true);
      `
    },
    {
      description: "Create RLS policies for profiles",
      sql: `
        DROP POLICY IF EXISTS "Users can view their own profile" ON api.profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON api.profiles;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON api.profiles;
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON api.profiles;
        
        CREATE POLICY "Users can view their own profile" ON api.profiles
            FOR SELECT TO authenticated
            USING (auth.uid() = id OR api.is_admin());
            
        CREATE POLICY "Users can update their own profile" ON api.profiles
            FOR UPDATE TO authenticated
            USING (auth.uid() = id OR api.is_admin())
            WITH CHECK (auth.uid() = id OR api.is_admin());
            
        CREATE POLICY "Users can insert their own profile" ON api.profiles
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = id OR api.is_admin());
            
        CREATE POLICY "Admins can manage all profiles" ON api.profiles
            FOR ALL TO authenticated
            USING (api.is_admin())
            WITH CHECK (api.is_admin());
      `
    },
    {
      description: "Grant permissions on API schema",
      sql: `
        GRANT USAGE ON SCHEMA api TO authenticated;
        GRANT USAGE ON SCHEMA api TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON api.virtual_cards TO authenticated;
        GRANT SELECT ON api.virtual_cards TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;
        GRANT SELECT ON api.profiles TO anon;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
        GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
        GRANT EXECUTE ON FUNCTION api.is_admin() TO anon;
      `
    },
    {
      description: "Sync existing data from public to API schema",
      sql: `
        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
        SELECT id, email, full_name, role::api.app_role, created_at, updated_at
        FROM public.profiles
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
      `
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const fix of fixes) {
    const success = await executeSql(fix.sql, fix.description);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Add a small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('VIRTUAL CARDS FIX APPLICATION RESULTS');
  console.log('='.repeat(80));
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations: ${failureCount}`);
  console.log(`📊 Total operations: ${fixes.length}`);
  
  if (failureCount === 0) {
    log.success('🎉 All fixes applied successfully! Virtual card creation should now work.');
  } else {
    log.warn(`⚠️ ${failureCount} operations failed. Manual intervention may be required.`);
  }
  
  return failureCount === 0;
}

// Test the fix by attempting to create a test virtual card
async function testVirtualCardCreation() {
  console.log('\n🧪 Testing virtual card creation...\n');
  
  try {
    // Test creating a virtual card
    const testCard = {
      card_name: "Test Admin Card - DELETE ME",
      card_type: "loyalty",
      description: "Test card created by fix verification",
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      is_active: false
    };
    
    log.info('Attempting to create test virtual card...');
    
    const { data, error } = await supabase
      .from('virtual_cards')
      .insert([testCard])
      .select();
    
    if (error) {
      log.error('Test card creation failed', error);
      
      // Analyze the error
      if (error.code === '42501') {
        log.warn('RLS policy is still blocking creation. Admin user may be needed.');
      } else if (error.code === '22P02') {
        log.warn('Enum value issue. Check if card_type enum includes the test value.');
      } else {
        log.warn('Unexpected error during test creation.');
      }
      
      return false;
    }
    
    const createdCard = data?.[0];
    log.success('Test card created successfully!', { 
      id: createdCard?.id,
      name: createdCard?.card_name 
    });
    
    // Clean up test card
    if (createdCard?.id) {
      log.info('Cleaning up test card...');
      const { error: deleteError } = await supabase
        .from('virtual_cards')
        .delete()
        .eq('id', createdCard.id);
      
      if (deleteError) {
        log.warn('Failed to clean up test card', deleteError);
      } else {
        log.success('Test card cleaned up successfully');
      }
    }
    
    return true;
    
  } catch (error) {
    log.error('Test virtual card creation threw exception', error);
    return false;
  }
}

// Main execution
async function main() {
  try {
    const fixSuccess = await applyVirtualCardsFix();
    
    if (fixSuccess) {
      const testSuccess = await testVirtualCardCreation();
      
      console.log('\n' + '='.repeat(80));
      console.log('FINAL RESULTS');
      console.log('='.repeat(80));
      
      if (testSuccess) {
        console.log('🎉 SUCCESS: Virtual card creation is now working!');
        console.log('✅ Admin users should be able to create virtual cards in the dashboard.');
      } else {
        console.log('⚠️ PARTIAL SUCCESS: Schema fix applied but test creation failed.');
        console.log('📝 Next steps:');
        console.log('   1. Ensure you have an admin user in the system');
        console.log('   2. Try creating a virtual card through the admin dashboard');
        console.log('   3. Check the error logs for any remaining issues');
      }
    } else {
      console.log('❌ FAILURE: Could not apply all fixes.');
      console.log('📝 Manual database intervention may be required.');
    }
    
    process.exit(fixSuccess ? 0 : 1);
    
  } catch (error) {
    log.error('Main execution failed', error);
    process.exit(1);
  }
}

// Run the fix
main();