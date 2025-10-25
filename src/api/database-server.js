// Simple Express server for database API endpoints
// Handles database queries from browser environment

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ignite_rewards',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Maegan@200328'
};

// Create connection pool
const pool = new Pool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Database query endpoint
app.post('/api/database/query', async (req, res) => {
  try {
    const { table, operation, query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    console.log(`🔍 API Query: ${query}`, params);
    
    const client = await pool.connect();
    const result = await client.query(query, params || []);
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    });
  } catch (error) {
    console.error('❌ Database query error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.code
    });
  }
});

// Specific endpoints for common operations
app.get('/api/cities/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = `
      SELECT city_name as name, country_name as country, country_code, 
             latitude, longitude, population, state_province, is_capital
      FROM cities_lookup 
      WHERE city_name ILIKE $1 
      ORDER BY 
        CASE WHEN city_name ILIKE $2 THEN 1 ELSE 2 END,
        population DESC NULLS LAST
      LIMIT $3
    `;
    
    const client = await pool.connect();
    const result = await client.query(query, [`%${q}%`, `${q}%`, limit]);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Cities search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/subscription-plans', async (req, res) => {
  try {
    const query = `
      SELECT id, name, price, price_yearly, monthly_points, monthly_transactions, 
             features, description, is_popular, created_at, updated_at
      FROM merchant_subscription_plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `;
    
    const client = await pool.connect();
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/loyalty-cards', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT ulc.*, nt.name as nft_type_name, nt.image_url as nft_image_url
      FROM user_loyalty_cards ulc
      LEFT JOIN nft_types nt ON ulc.nft_type_id = nt.id
    `;
    
    const params = [];
    if (user_id) {
      query += ' WHERE ulc.user_id = $1';
      params.push(user_id);
    }
    
    query += ' ORDER BY ulc.created_at DESC';
    
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Loyalty cards error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Database API server running on port ${PORT}`);
  console.log(`📊 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

module.exports = app;
