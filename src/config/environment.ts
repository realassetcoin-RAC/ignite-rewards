// Environment Configuration
// Uses Docker PostgreSQL for ALL operations including OAuth

export const environment = {
  // Environment detection - Use local PostgreSQL as per .cursorrules
  isDevelopment: true, // Use local database for development
  isUAT: false, // Use local database for UAT
  isProduction: import.meta.env.VITE_APP_ENV === 'production',

  // Database configuration
  database: {
    // Local PostgreSQL (Docker) - ALL operations use this
    local: {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
      database: import.meta.env.VITE_DB_NAME || 'ignite_rewards',
      user: import.meta.env.VITE_DB_USER || 'postgres',
      password: import.meta.env.VITE_DB_PASSWORD || 'Maegan@200328',
      url: import.meta.env.VITE_DATABASE_URL || 'postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards'
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
  },

  // OAuth configuration - Using local OAuth API server
  oauth: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`
    },
    apiBaseUrl: import.meta.env.VITE_OAUTH_API_BASE_URL || 'http://localhost:3000'
  },

  // API endpoints
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    port: parseInt(import.meta.env.VITE_API_PORT || '3001'),
    daoBaseUrl: import.meta.env.VITE_DAO_API_BASE_URL || 'http://localhost:3002/api',
    daoPort: parseInt(import.meta.env.VITE_DAO_API_PORT || '3002')
  }
};

// DEBUG: Log raw import.meta.env to see what Vite is actually loading
console.log('🔍 DEBUG - Raw import.meta.env:', import.meta.env);
console.log('🔍 DEBUG - All import.meta.env keys:', Object.keys(import.meta.env));

// Log current environment
console.log('🌍 Environment Configuration:', {
  mode: 'Docker PostgreSQL - No Supabase',
  database: 'Docker PostgreSQL',
  debug: environment.app.debug,
  enableMockAuth: environment.app.enableMockAuth,
  localDb: {
    host: environment.database.local.host,
    port: environment.database.local.port,
    database: environment.database.local.database,
    user: environment.database.local.user
  },
  oauth: {
    clientId: environment.oauth.google.clientId ? 'configured' : 'missing',
    apiBaseUrl: environment.oauth.apiBaseUrl
  },
  api: {
    baseUrl: environment.api.baseUrl,
    daoBaseUrl: environment.api.daoBaseUrl
  }
});

export default environment;
