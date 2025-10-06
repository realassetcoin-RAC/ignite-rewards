// Environment Configuration
// Handles different environments: development (local), UAT (Supabase), production

export const environment = {
  // Environment detection - Force local database usage
  isDevelopment: true, // Always use local database
  isUAT: false, // Disable Supabase
  isProduction: import.meta.env.VITE_APP_ENV === 'production',

  // Database configuration
  database: {
    // Local PostgreSQL (Development)
    local: {
      host: import.meta.env.VITE_DB_HOST,
      port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
      database: import.meta.env.VITE_DB_NAME,
      user: import.meta.env.VITE_DB_USER,
      password: import.meta.env.VITE_DB_PASSWORD,
      url: import.meta.env.VITE_DATABASE_URL
    },
    
    // Supabase (UAT/Production) - Environment variables only
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
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
  },

  // External API configuration
  apis: {
    apiNinjas: {
      key: import.meta.env.VITE_API_NINJAS_KEY
    }
  },

  // Admin configuration
  admin: {
    email: import.meta.env.VITE_ADMIN_EMAIL,
    password: import.meta.env.VITE_ADMIN_PASSWORD
  }
};

// Environment validation
const validateEnvironment = () => {
  // For local development, validate local database connection
  if (environment.isDevelopment) {
    const required = [
      'VITE_DB_HOST',
      'VITE_DB_PORT',
      'VITE_DB_NAME',
      'VITE_DB_USER',
      'VITE_DB_PASSWORD'
    ];
    
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required local database environment variables: ${missing.join(', ')}`);
    }
  } else {
    // For production/UAT, validate Supabase connection
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // Validate local database connection
  if (environment.isDevelopment && environment.database.local.host) {
    if (!environment.database.local.host.includes('localhost') && !environment.database.local.host.includes('127.0.0.1')) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Warning: Not using localhost for local development');
    }
  }
  
  // Validate Supabase URL format (only if not in development mode)
  if (!environment.isDevelopment && environment.database.supabase.url && !environment.database.supabase.url.includes('supabase.co')) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Warning: Supabase URL format may be incorrect');
  }
  
  // Validate JWT token format (only if not in development mode)
  if (!environment.isDevelopment && environment.database.supabase.anonKey && !environment.database.supabase.anonKey.startsWith('eyJ')) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Warning: Supabase anon key format may be incorrect');
  }
};

// Call validation
validateEnvironment();

// Only log in debug mode
if (environment.app.debug) {
  // eslint-disable-next-line no-console
  console.log('🌍 Environment Configuration:', {
    mode: environment.isDevelopment ? 'Local Development' : 'Cloud Supabase',
    database: environment.isDevelopment ? 'Local PostgreSQL' : 'Supabase Cloud',
    localDb: environment.isDevelopment ? {
      host: environment.database.local.host,
      port: environment.database.local.port,
      database: environment.database.local.database,
      user: environment.database.local.user
    } : null,
    supabaseUrl: environment.database.supabase.url,
    hasAnonKey: !!environment.database.supabase.anonKey
  });
}

export default environment;
