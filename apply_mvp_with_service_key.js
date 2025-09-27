/**
 * Apply MVP Completion Scripts with Service Role Key
 * Replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from cloud-supabase.env
dotenv.config({ path: 'cloud-supabase.env' });

// Supabase configuration from cloud-supabase.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables from cloud-supabase.env:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);

async function executeSQLFile(filename) {
  try {
    console.log(`\n📄 Executing ${filename}...`);
    
    const filePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Execute the entire SQL file as one statement
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });
    
    if (error) {
      console.error(`❌ Error executing ${filename}:`, error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ ${filename} completed successfully`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting MVP Completion Script Application...');
  console.log('================================================');
  console.log('🌐 Target: Cloud Supabase Database');
  console.log('🔗 URL:', supabaseUrl);
  console.log('================================================');
  
  const scripts = [
    'complete_mfa_integration.sql',
    'complete_email_notification_system.sql', 
    'complete_third_party_integration.sql',
    'add_missing_database_tables.sql'
  ];
  
  let allSuccess = true;
  
  // Execute all SQL scripts
  for (const script of scripts) {
    const result = await executeSQLFile(script);
    if (!result.success) {
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 MVP COMPLETION SUCCESSFUL!');
    console.log('All high-priority features have been implemented.');
  } else {
    console.log('\n⚠️ Some scripts failed. Please check the errors above.');
  }
}

// Run the script
main().catch(console.error);
