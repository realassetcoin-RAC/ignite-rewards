// Wallet API for local PostgreSQL operations
// Handles wallet creation, seed phrase retrieval, and backup operations

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment configuration
function loadConfig() {
  const configPath = path.join(process.cwd(), 'api', 'config.env');
  const config = {};
  
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    configFile.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        config[key.trim()] = value;
      }
    });
  }
  
  return config;
}

const config = loadConfig();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || config.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || config.DB_PORT || '5432'),
  database: process.env.DB_NAME || config.DB_NAME || 'ignite_rewards',
  user: process.env.DB_USER || config.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || config.DB_PASSWORD || 'Maegan@200328'
};

// API server configuration
const serverConfig = {
  port: parseInt(process.env.WALLET_API_PORT || config.WALLET_API_PORT || '3003'),
  host: process.env.WALLET_API_HOST || config.WALLET_API_HOST || 'localhost',
  corsOrigin: process.env.WALLET_CORS_ORIGIN || config.WALLET_CORS_ORIGIN || '*',
  logLevel: process.env.WALLET_LOG_LEVEL || config.WALLET_LOG_LEVEL || 'info'
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': serverConfig.corsOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Database helper
async function executeQuery(query, params = []) {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

// Main server
const server = Bun.serve({
  port: serverConfig.port,
  hostname: serverConfig.host,
  
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // Create wallet endpoint
    if (url.pathname === '/api/wallet/create' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Call create_user_wallet function
        const result = await executeQuery(
          'SELECT create_user_wallet($1) as wallet_id',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        // Get the created wallet
        const walletResult = await executeQuery(
          'SELECT * FROM public.user_solana_wallets WHERE user_id = $1',
          [userId]
        );

        return new Response(JSON.stringify({ 
          success: true, 
          wallet: walletResult.data[0] 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get seed phrase endpoint
    if (url.pathname === '/api/wallet/seed-phrase' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Call get_user_seed_phrase function
        const result = await executeQuery(
          'SELECT * FROM get_user_seed_phrase($1)',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          data: result.data[0] 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Generate backup code endpoint
    if (url.pathname === '/api/wallet/backup-code' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Call generate_wallet_backup_code function
        const result = await executeQuery(
          'SELECT generate_wallet_backup_code($1) as code',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          code: result.data[0]?.code 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Verify backup code endpoint
    if (url.pathname === '/api/wallet/verify-backup' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId, code } = body;

        if (!userId || !code) {
          return new Response(JSON.stringify({ error: 'User ID and code are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Call verify_wallet_backup function
        const result = await executeQuery(
          'SELECT verify_wallet_backup($1, $2) as verified',
          [userId, code]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          verified: result.data[0]?.verified === true 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get wallet statistics endpoint
    if (url.pathname === '/api/wallet/statistics' && request.method === 'GET') {
      try {
        const result = await executeQuery('SELECT * FROM get_wallet_statistics()');

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          stats: result.data[0] 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get Google auth status endpoint
    if (url.pathname === '/api/wallet/google-auth-status' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const result = await executeQuery(
          'SELECT * FROM get_google_auth_status($1)',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          status: result.data[0] 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Disable Google auth endpoint
    if (url.pathname === '/api/wallet/disable-google-auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const result = await executeQuery(
          'SELECT disable_google_auth($1) as success',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: result.data[0]?.success === true 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Enable Google auth endpoint
    if (url.pathname === '/api/wallet/enable-google-auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const result = await executeQuery(
          'SELECT enable_google_auth($1) as success',
          [userId]
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          success: result.data[0]?.success === true 
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'wallet-api' }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders
    });
  }
});

console.log(`🔐 Wallet API server running on http://${serverConfig.host}:${serverConfig.port}`);
console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
console.log(`🌐 CORS Origin: ${serverConfig.corsOrigin}`);
console.log(`📝 Log Level: ${serverConfig.logLevel}`);
