const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Subscription plans endpoint
app.get('/api/subscription-plans', async (req, res) => {
  try {
    // Mock data for now - this should connect to your local PostgreSQL
    const plans = [
      {
        id: 'startup',
        name: 'StartUp',
        price_monthly: 20,
        price_yearly: 150,
        features: ['Basic features', 'Email support'],
        is_popular: false
      },
      {
        id: 'momentum',
        name: 'Momentum',
        price_monthly: 50,
        price_yearly: 500,
        features: ['Advanced features', 'Priority support'],
        is_popular: false
      },
      {
        id: 'energizer',
        name: 'Energizer',
        price_monthly: 100,
        price_yearly: 1000,
        features: ['Premium features', '24/7 support'],
        is_popular: true
      },
      {
        id: 'cloud9',
        name: 'Cloud9',
        price_monthly: 250,
        price_yearly: 2500,
        features: ['Enterprise features', 'Dedicated support'],
        is_popular: false
      },
      {
        id: 'super',
        name: 'Super',
        price_monthly: 500,
        price_yearly: 5000,
        features: ['All features', 'White-glove service'],
        is_popular: false
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Cities endpoint
app.get('/api/cities', async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.json([]);
    }

    // Mock city data - this should connect to your local PostgreSQL
    const cities = [
      { id: 1, name: 'New York', country: 'United States' },
      { id: 2, name: 'London', country: 'United Kingdom' },
      { id: 3, name: 'Tokyo', country: 'Japan' },
      { id: 4, name: 'Paris', country: 'France' },
      { id: 5, name: 'Sydney', country: 'Australia' }
    ].filter(city => 
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.country.toLowerCase().includes(search.toLowerCase())
    );

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Subscription plans: http://localhost:${PORT}/api/subscription-plans`);
  console.log(`🏙️ Cities: http://localhost:${PORT}/api/cities`);
});



