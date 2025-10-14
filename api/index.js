const express = require('express');
const connectDB = require('../utils/database');
const cors = require('../middleware/cors');

const app = express();

// Initialize database
connectDB();

// Middleware
app.use(cors);
app.use(express.json());

// Routes
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
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Import and use your route handlers
app.use('/api/jobs', require('./jobs'));
app.use('/api/users', require('./users'));

module.exports = app;
