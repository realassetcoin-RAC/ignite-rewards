// Environment Setup Script
// Helps configure the application for different environments

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environments = {
  development: {
    VITE_APP_ENV: 'development',
    VITE_APP_DEBUG: 'true',
    VITE_DB_HOST: 'localhost',
    VITE_DB_PORT: '5432',
    VITE_DB_NAME: 'ignite_rewards',
    VITE_DB_USER: 'postgres',
    VITE_DB_PASSWORD: 'Maegan@200328',
    VITE_DATABASE_URL: 'postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards',
    VITE_SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    VITE_SOLANA_NETWORK: 'devnet',
    VITE_ETHEREUM_RPC_URL: 'https://sepolia.infura.io/v3/your-infura-key',
    VITE_ETHEREUM_NETWORK: 'sepolia',
    VITE_ADMIN_EMAIL: 'admin@igniterewards.com',
    VITE_ADMIN_PASSWORD: 'admin123!',
    VITE_ENABLE_DEBUG_PANEL: 'true',
    VITE_ENABLE_TEST_DATA: 'true',
    VITE_ENABLE_MOCK_AUTH: 'true'
  },
  
  uat: {
    VITE_APP_ENV: 'uat',
    VITE_APP_DEBUG: 'false',
    VITE_SUPABASE_URL: 'your-supabase-url-here',
    VITE_SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
    VITE_SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    VITE_SOLANA_NETWORK: 'devnet',
    VITE_ETHEREUM_RPC_URL: 'https://sepolia.infura.io/v3/your-infura-key',
    VITE_ETHEREUM_NETWORK: 'sepolia',
    VITE_ADMIN_EMAIL: 'admin@igniterewards.com',
    VITE_ADMIN_PASSWORD: 'admin123!',
    VITE_ENABLE_DEBUG_PANEL: 'false',
    VITE_ENABLE_TEST_DATA: 'false',
    VITE_ENABLE_MOCK_AUTH: 'false'
  },
  
  production: {
    VITE_APP_ENV: 'production',
    VITE_APP_DEBUG: 'false',
    VITE_SUPABASE_URL: 'your-production-supabase-url',
    VITE_SUPABASE_ANON_KEY: 'your-production-supabase-anon-key',
    VITE_SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    VITE_SOLANA_NETWORK: 'mainnet-beta',
    VITE_ETHEREUM_RPC_URL: 'https://mainnet.infura.io/v3/your-infura-key',
    VITE_ETHEREUM_NETWORK: 'mainnet',
    VITE_ADMIN_EMAIL: 'admin@igniterewards.com',
    VITE_ADMIN_PASSWORD: 'your-secure-password',
    VITE_ENABLE_DEBUG_PANEL: 'false',
    VITE_ENABLE_TEST_DATA: 'false',
    VITE_ENABLE_MOCK_AUTH: 'false'
  }
};

function setupEnvironment(env) {
  if (!environments[env]) {
    console.error(`❌ Unknown environment: ${env}`);
    console.log('Available environments: development, uat, production');
    process.exit(1);
  }

  const envContent = Object.entries(environments[env])
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envFile = path.join(__dirname, '.env.local');
  
  try {
    fs.writeFileSync(envFile, envContent);
    console.log(`✅ Environment configured for: ${env}`);
    console.log(`📁 Configuration written to: ${envFile}`);
    
    if (env === 'development') {
      console.log('\n🔧 Development Setup:');
      console.log('   - Using local PostgreSQL database');
      console.log('   - Debug mode enabled');
      console.log('   - Mock authentication enabled');
    } else if (env === 'uat') {
      console.log('\n🧪 UAT Setup:');
      console.log('   - Using Supabase database');
      console.log('   - Debug mode disabled');
      console.log('   - Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    } else if (env === 'production') {
      console.log('\n🚀 Production Setup:');
      console.log('   - Using Supabase database');
      console.log('   - Debug mode disabled');
      console.log('   - Please update all production values');
    }
    
  } catch (error) {
    console.error(`❌ Failed to write environment file: ${error.message}`);
    process.exit(1);
  }
}

// Get environment from command line argument
const env = process.argv[2] || 'development';

console.log(`🌍 Setting up environment: ${env}`);
setupEnvironment(env);
