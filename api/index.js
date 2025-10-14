const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mukky254:muhidinaliko2006@cluster0.bneqb6q.mongodb.net/kaziDB?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

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
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check with DB status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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
