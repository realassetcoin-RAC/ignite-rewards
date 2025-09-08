#!/usr/bin/env node

/**
 * Contact Us System Migration Script
 * 
 * This script applies the contact_us_schema.sql to the Supabase database.
 * It creates all necessary tables, indexes, policies, and sample data for the
 * AI-powered chatbot and ticket management system.
 * 
 * Usage:
 *   node apply_contact_us_migration.js
 * 
 * Prerequisites:
 *   - Supabase project URL and service role key configured
 *   - Node.js environment with required dependencies
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set your Supabase service role key:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

async function applyMigration() {
  try {
    console.log('🚀 Starting Contact Us System Migration...\n');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'contact_us_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            sql: statement
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          successCount++;
          errorCount--;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Contact Us System migration completed successfully!');
      console.log('\n📋 What was created:');
      console.log('   • contact_tickets table with RLS policies');
      console.log('   • ticket_attachments table for file uploads');
      console.log('   • chatbot_conversations table for chat logs');
      console.log('   • chatbot_interactions table for message tracking');
      console.log('   • issue_categories and issue_tags tables');
      console.log('   • slack_integration_settings table');
      console.log('   • Database indexes for performance');
      console.log('   • Sample categories and tags');
      console.log('   • Ticket ID generation function');
      console.log('   • Timestamp update triggers');
      
      console.log('\n🔧 Next Steps:');
      console.log('   1. Configure Slack webhook URLs in slack_integration_settings');
      console.log('   2. Set up Supabase Storage bucket for contact-attachments');
      console.log('   3. Test the Contact Us page and chatbot functionality');
      console.log('   4. Configure email notifications if needed');
      
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
      console.log('Please review the error messages above and fix any issues.');
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   • Verify your Supabase URL and service role key');
    console.error('   • Check that your Supabase project is active');
    console.error('   • Ensure you have the necessary permissions');
    console.error('   • Review the SQL schema file for syntax errors');
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect() {
  try {
    console.log('🚀 Starting Contact Us System Migration (Direct Method)...\n');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'contact_us_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');

    // Execute the entire SQL content
    console.log('⏳ Executing migration...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ Migration executed successfully!');
    console.log('\n🎉 Contact Us System migration completed!');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    
    // Try the statement-by-statement approach as fallback
    console.log('\n🔄 Trying alternative migration method...');
    await applyMigration();
  }
}

// Check if we should use direct method
const useDirect = process.argv.includes('--direct');

if (useDirect) {
  applyMigrationDirect();
} else {
  applyMigration();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Migration interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
