#!/usr/bin/env node
/**
 * Setup script to create .env file with Supabase database credentials
 * Usage: node setup-database-connection.js
 */

const fs = require('fs');
const path = require('path');

function createEnvFile() {
  console.log('🔧 Setting up Supabase database connection...\n');
  
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA

# Database Connection URL for direct PostgreSQL access
DATABASE_URL=postgresql://postgres:M@r0on@2025@db.wndswqvqogeblksrujpg.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:M@r0on@2025@db.wndswqvqogeblksrujpg.supabase.co:5432/postgres

# Individual database connection parameters (alternative format)
DB_HOST=db.wndswqvqogeblksrujpg.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=M@r0on@2025
`;

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists!');
      console.log('📋 Current .env file will be backed up to .env.backup');
      
      // Backup existing .env file
      const backupPath = path.join(process.cwd(), '.env.backup');
      fs.copyFileSync(envPath, backupPath);
      console.log('✅ Backup created successfully');
    }
    
    // Write new .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('');
    
    console.log('🔧 Configuration Summary:');
    console.log('   📡 Supabase URL: https://wndswqvqogeblksrujpg.supabase.co');
    console.log('   🗄️  Database Host: db.wndswqvqogeblksrujpg.supabase.co');
    console.log('   🔌 Port: 5432');
    console.log('   👤 User: postgres');
    console.log('   🔑 Password: M@r0on@2025');
    console.log('');
    
    console.log('🚀 Next steps:');
    console.log('   1. Run: node test-db-connection.js');
    console.log('   2. Test your application');
    console.log('   3. Use the database connection scripts in this project');
    console.log('');
    
    console.log('💡 Available environment variables:');
    console.log('   - DATABASE_URL: Direct PostgreSQL connection string');
    console.log('   - SUPABASE_DB_URL: Alternative database URL');
    console.log('   - VITE_SUPABASE_URL: Frontend Supabase URL');
    console.log('   - VITE_SUPABASE_ANON_KEY: Frontend Supabase API key');
    
  } catch (error) {
    console.error('❌ Failed to create .env file:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
createEnvFile();
