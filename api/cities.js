#!/usr/bin/env bun

// City Search API Server
// Queries the actual PostgreSQL database with 323,573 cities
// Dynamic configuration using environment variables

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment configuration
function loadConfig() {
  try {
    // Try to load from config.env file first
    const configPath = join(__dirname, 'config.env');
    const configContent = readFileSync(configPath, 'utf8');
    
    const config = {};
    configContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    });
    
    return config;
  } catch (error) {
    console.warn('⚠️  Could not load config.env, using environment variables and defaults');
    return {};
  }
}

const config = loadConfig();

// Database configuration with environment variable support
const dbConfig = {
  host: process.env.DB_HOST || config.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || config.DB_PORT || '5432'),
  database: process.env.DB_NAME || config.DB_NAME || 'ignite_rewards',
  user: process.env.DB_USER || config.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || config.DB_PASSWORD || 'Maegan@200328'
};

// API server configuration
const apiConfig = {
  port: parseInt(process.env.API_PORT || config.API_PORT || '3001'),
  host: process.env.API_HOST || config.API_HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || config.CORS_ORIGIN || '*',
  defaultSearchLimit: parseInt(process.env.DEFAULT_SEARCH_LIMIT || config.DEFAULT_SEARCH_LIMIT || '10'),
  maxSearchLimit: parseInt(process.env.MAX_SEARCH_LIMIT || config.MAX_SEARCH_LIMIT || '50'),
  logLevel: process.env.LOG_LEVEL || config.LOG_LEVEL || 'info'
};

// CORS headers with dynamic configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': apiConfig.corsOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Handle CORS preflight requests
function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
}

// Search cities function with dynamic configuration
async function searchCities(query, limit = null) {
  const searchLimit = limit || apiConfig.defaultSearchLimit;
  
  // Enforce maximum limit
  const finalLimit = Math.min(searchLimit, apiConfig.maxSearchLimit);
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Search query with ranking for better results
    const searchQuery = `
      SELECT 
        id,
        city_name as name,
        country_name as country,
        country_code,
        state_province,
        population,
        is_capital,
        latitude,
        longitude
      FROM public.cities_lookup 
      WHERE 
        city_name ILIKE $1 
        OR country_name ILIKE $1
        OR state_province ILIKE $1
      ORDER BY 
        CASE 
          WHEN city_name ILIKE $2 THEN 1
          WHEN city_name ILIKE $3 THEN 2
          WHEN city_name ILIKE $1 THEN 3
          ELSE 4
        END,
        population DESC NULLS LAST,
        city_name ASC
      LIMIT $4
    `;
    
    const searchPattern = `%${query}%`;
    const exactStart = `${query}%`;
    const exactMatch = query;
    
    const result = await client.query(searchQuery, [
      searchPattern,
      exactStart,
      exactMatch,
      finalLimit
    ]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      country_code: row.country_code,
      state_province: row.state_province || '',
      population: row.population || 0,
      is_capital: row.is_capital || false,
      latitude: row.latitude || 0,
      longitude: row.longitude || 0
    }));
    
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to search cities');
  } finally {
    await client.end();
  }
}

// Get city statistics
async function getCityStats() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cities,
        COUNT(DISTINCT country_name) as total_countries,
        COUNT(CASE WHEN population > 1000000 THEN 1 END) as major_cities
      FROM public.cities_lookup
    `;
    
    const result = await client.query(statsQuery);
    return result.rows[0];
    
  } catch (error) {
    console.error('Stats query error:', error);
    throw new Error('Failed to get city statistics');
  } finally {
    await client.end();
  }
}

// Logging function
function log(level, message, data = null) {
  if (apiConfig.logLevel === 'debug' || 
      (apiConfig.logLevel === 'info' && level === 'info') ||
      (apiConfig.logLevel === 'error' && level === 'error')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Main server with dynamic configuration
const server = Bun.serve({
  port: apiConfig.port,
  hostname: apiConfig.host,
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;
    
    try {
      // City search endpoint
      if (path === '/api/cities/search' && request.method === 'GET') {
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || apiConfig.defaultSearchLimit.toString());
        
        if (!query || query.length < 2) {
          return new Response(JSON.stringify({
            success: true,
            data: [],
            message: 'Query must be at least 2 characters long'
          }), {
            status: 200,
            headers: corsHeaders
          });
        }
        
        const cities = await searchCities(query, limit);
        
        return new Response(JSON.stringify({
          success: true,
          data: cities,
          query: query,
          count: cities.length
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // City statistics endpoint
      if (path === '/api/cities/stats' && request.method === 'GET') {
        const stats = await getCityStats();
        
        return new Response(JSON.stringify({
          success: true,
          data: stats
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // Health check endpoint
      if (path === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          success: true,
          message: 'City API server is running',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // Subscription plans endpoint
      if (path === '/api/subscription-plans' && request.method === 'GET') {
        const client = new Client(dbConfig);
        
        try {
          console.log('🔄 Fetching subscription plans from local PostgreSQL...');
          await client.connect();
          
          const { rows } = await client.query(`
            SELECT 
              id,
              name,
              description,
              price_monthly,
              price_yearly,
              monthly_points,
              monthly_transactions,
              email_limit,
              features,
              trial_days,
              is_active,
              popular,
              plan_number,
              valid_from,
              valid_until,
              created_at,
              updated_at
            FROM public.merchant_subscription_plans 
            WHERE is_active = true 
            ORDER BY price_monthly ASC
          `);

          console.log(`✅ Found ${rows.length} subscription plans in local database`);
          
          // Transform the data to match expected format
          const plans = rows.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price_monthly: Number(plan.price_monthly),
            price_yearly: Number(plan.price_yearly),
            monthly_points: plan.monthly_points,
            monthly_transactions: plan.monthly_transactions,
            email_limit: plan.email_limit,
            features: plan.features,
            trial_days: plan.trial_days,
            is_active: plan.is_active,
            popular: plan.popular,
            plan_number: plan.plan_number,
            valid_from: plan.valid_from,
            valid_until: plan.valid_until,
            created_at: plan.created_at,
            updated_at: plan.updated_at
          }));

          return new Response(JSON.stringify({
            success: true,
            data: plans,
            count: plans.length
          }), {
            status: 200,
            headers: corsHeaders
          });
        } catch (error) {
          console.error('❌ Error fetching subscription plans:', error);
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to fetch subscription plans',
            error: error.message
          }), {
            status: 500,
            headers: corsHeaders
          });
        } finally {
          await client.end();
        }
      }
      
      // 404 for unknown endpoints
      return new Response(JSON.stringify({
        success: false,
        message: 'Endpoint not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
      
    } catch (error) {
      console.error('API Error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
});

// Display startup information
console.log('🌍 City Search API Server');
console.log('═══════════════════════════════════════');
console.log(`🚀 Server: http://${apiConfig.host}:${apiConfig.port}`);
console.log(`🗄️  Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`🌐 CORS Origin: ${apiConfig.corsOrigin}`);
console.log(`📊 Default Limit: ${apiConfig.defaultSearchLimit} (Max: ${apiConfig.maxSearchLimit})`);
console.log(`📝 Log Level: ${apiConfig.logLevel}`);
console.log('═══════════════════════════════════════');
console.log('📡 Available endpoints:');
console.log(`  GET /api/cities/search?q=query&limit=${apiConfig.defaultSearchLimit} - Search cities`);
console.log('  GET /api/cities/stats - Get city database statistics');
console.log('  GET /api/health - Health check');
console.log('');
console.log('🔍 Example searches:');
console.log(`  http://${apiConfig.host}:${apiConfig.port}/api/cities/search?q=man&limit=5`);
console.log(`  http://${apiConfig.host}:${apiConfig.port}/api/cities/search?q=new%20york&limit=${apiConfig.defaultSearchLimit}`);
console.log(`  http://${apiConfig.host}:${apiConfig.port}/api/cities/search?q=madrid&limit=5`);
console.log('');
console.log('⚙️  Configuration:');
console.log(`  Environment: ${process.env.NODE_ENV || config.NODE_ENV || 'development'}`);
console.log(`  Config Source: ${config.DB_HOST ? 'config.env file' : 'environment variables'}`);
console.log('═══════════════════════════════════════');
