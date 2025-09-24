// Simple API server for DAO operations with local PostgreSQL
// This is a basic Express server to handle DAO-related requests

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ignite_rewards',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DAO API is running' });
});

// Get all active DAO organizations
app.get('/api/dao/organizations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM public.dao_organizations 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching DAO organizations:', error);
    res.status(500).json({ error: 'Failed to fetch DAO organizations' });
  }
});

// Get all proposals with optional filtering
app.get('/api/dao/proposals', async (req, res) => {
  try {
    const { daoId, status, category } = req.query;
    let query = `
      SELECT p.*, d.name as dao_name, d.governance_token_symbol
      FROM public.dao_proposals p
      LEFT JOIN public.dao_organizations d ON p.dao_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (daoId) {
      paramCount++;
      query += ` AND p.dao_id = $${paramCount}`;
      params.push(daoId);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Submit a vote on a proposal
app.post('/api/dao/votes', async (req, res) => {
  try {
    const { proposal_id, voter_id, vote_type, voting_power } = req.body;

    // Validate input
    if (!proposal_id || !voter_id || !vote_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['yes', 'no', 'abstain'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if user already voted on this proposal
    const existingVote = await pool.query(
      'SELECT id FROM public.dao_votes WHERE proposal_id = $1 AND voter_id = $2',
      [proposal_id, voter_id]
    );

    if (existingVote.rows.length > 0) {
      return res.status(400).json({ error: 'User has already voted on this proposal' });
    }

    // Insert the vote
    const voteResult = await pool.query(
      `INSERT INTO public.dao_votes (proposal_id, voter_id, vote_type, voting_power)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [proposal_id, voter_id, vote_type, voting_power || 1]
    );

    // Update proposal vote counts
    const updateQuery = `
      UPDATE public.dao_proposals 
      SET 
        total_votes = total_votes + 1,
        yes_votes = yes_votes + CASE WHEN $2 = 'yes' THEN 1 ELSE 0 END,
        no_votes = no_votes + CASE WHEN $2 = 'no' THEN 1 ELSE 0 END,
        abstain_votes = abstain_votes + CASE WHEN $2 = 'abstain' THEN 1 ELSE 0 END,
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [proposal_id, vote_type]);

    res.json({ success: true, vote: voteResult.rows[0] });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Get voting statistics
app.get('/api/dao/stats', async (req, res) => {
  try {
    const [proposalsResult, daosResult, votersResult] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_proposals,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_proposals,
          COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_proposals,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_proposals
        FROM public.dao_proposals
      `),
      pool.query(`
        SELECT COUNT(*) as total_daos 
        FROM public.dao_organizations 
        WHERE is_active = true
      `),
      pool.query(`
        SELECT COUNT(DISTINCT voter_id) as total_voters 
        FROM public.dao_votes
      `)
    ]);

    const stats = {
      total_proposals: parseInt(proposalsResult.rows[0].total_proposals),
      active_proposals: parseInt(proposalsResult.rows[0].active_proposals),
      passed_proposals: parseInt(proposalsResult.rows[0].passed_proposals),
      failed_proposals: parseInt(proposalsResult.rows[0].failed_proposals),
      total_daos: parseInt(daosResult.rows[0].total_daos),
      total_voters: parseInt(votersResult.rows[0].total_voters) || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching voting stats:', error);
    res.status(500).json({ error: 'Failed to fetch voting stats' });
  }
});

// Get database schema information
app.get('/api/dao/schema', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM public.get_database_schema()
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching database schema:', error);
    res.status(500).json({ error: 'Failed to fetch database schema' });
  }
});

// Get table relationships
app.get('/api/dao/relationships', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM public.get_table_relationships()
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table relationships:', error);
    res.status(500).json({ error: 'Failed to fetch table relationships' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`DAO API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/dao/organizations`);
  console.log(`  GET  /api/dao/proposals`);
  console.log(`  POST /api/dao/votes`);
  console.log(`  GET  /api/dao/stats`);
  console.log(`  GET  /api/dao/schema`);
  console.log(`  GET  /api/dao/relationships`);
});

module.exports = app;
