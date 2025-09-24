// Environment Configuration
// Handles different environments: development (local), UAT (Supabase), production

export const environment = {
  // Environment detection - Force cloud Supabase usage
  isDevelopment: false, // Always use cloud database
  isUAT: true, // Always use Supabase
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
    
    // Supabase (UAT/Production) - HARDCODED TO BYPASS VITE ENV LOADING ISSUE
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://wndswqvqogeblksrujpg.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
    }
  },

  // Application settings - HARDCODED TO BYPASS VITE ENV LOADING ISSUE
  app: {
    debug: import.meta.env.VITE_APP_DEBUG === 'true' || false,
    enableDebugPanel: import.meta.env.VITE_ENABLE_DEBUG_PANEL === 'true' || false,
    enableTestData: import.meta.env.VITE_ENABLE_TEST_DATA === 'true' || false,
    enableMockAuth: import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' || false // FORCE FALSE
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

// DEBUG: Log raw import.meta.env to see what Vite is actually loading
console.log('🔍 DEBUG - Raw import.meta.env:', import.meta.env);
console.log('🔍 DEBUG - All import.meta.env keys:', Object.keys(import.meta.env));
console.log('🔍 DEBUG - VITE_SUPABASE_URL value:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔍 DEBUG - VITE_ENABLE_MOCK_AUTH value:', import.meta.env.VITE_ENABLE_MOCK_AUTH);

// Log current environment
console.log('🌍 Environment Configuration:', {
  mode: 'Cloud Supabase (Forced)',
  database: 'Supabase Cloud',
  debug: environment.app.debug,
  enableMockAuth: environment.app.enableMockAuth,
  supabaseUrl: environment.database.supabase.url,
  hasAnonKey: !!environment.database.supabase.anonKey,
  envVars: {
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_ENABLE_MOCK_AUTH: import.meta.env.VITE_ENABLE_MOCK_AUTH,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
  }
});

export default environment;
