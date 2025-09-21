// Environment Configuration
// Handles different environments: development (local), UAT (Supabase), production

export const environment = {
  // Environment detection
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development' || 
                 import.meta.env.VITE_DB_HOST === 'localhost' ||
                 !import.meta.env.VITE_SUPABASE_URL?.includes('supabase'),
  
  isUAT: import.meta.env.VITE_APP_ENV === 'uat' || 
         import.meta.env.VITE_SUPABASE_URL?.includes('supabase'),
  
  isProduction: import.meta.env.VITE_APP_ENV === 'production',

  // Database configuration
  database: {
    // Local PostgreSQL (Development)
    local: {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
      database: import.meta.env.VITE_DB_NAME || 'ignite_rewards',
      user: import.meta.env.VITE_DB_USER || 'postgres',
      password: import.meta.env.VITE_DB_PASSWORD || 'your_password',
      url: import.meta.env.VITE_DATABASE_URL || 'postgresql://postgres:your_password@localhost:5432/ignite_rewards'
    },
    
    // Supabase (UAT/Production)
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  },

  // Application settings
  app: {
    debug: import.meta.env.VITE_APP_DEBUG === 'true',
    enableDebugPanel: import.meta.env.VITE_ENABLE_DEBUG_PANEL === 'true',
    enableTestData: import.meta.env.VITE_ENABLE_TEST_DATA === 'true',
    enableMockAuth: import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true'
  },

  // Blockchain configuration
  blockchain: {
    solana: {
      rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
    },
    ethereum: {
      rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/your-infura-key',
      network: import.meta.env.VITE_ETHEREUM_NETWORK || 'sepolia'
    }
  },

  // Admin configuration
  admin: {
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@igniterewards.com',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123!'
  }
};

// Log current environment
console.log('🌍 Environment Configuration:', {
  mode: environment.isDevelopment ? 'Development (Local PostgreSQL)' : 
        environment.isUAT ? 'UAT (Supabase)' : 'Production',
  database: environment.isDevelopment ? 'Local PostgreSQL' : 'Supabase',
  debug: environment.app.debug
});

export default environment;
