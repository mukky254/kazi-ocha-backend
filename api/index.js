const express = require('express');

const app = express();

// Basic middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Simple test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kazi Ocha API is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Test jobs endpoint (no database)
app.get('/api/jobs', (req, res) => {
  res.json({
    success: true,
    message: 'Jobs endpoint is working',
    jobs: [
      {
        id: 1,
        title: 'Test Job 1',
        description: 'This is a test job',
        location: 'Nairobi',
        category: 'general'
      },
      {
        id: 2, 
        title: 'Test Job 2',
        description: 'Another test job',
        location: 'Mombasa',
        category: 'construction'
      }
    ]
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = app;
