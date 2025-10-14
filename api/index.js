const express = require('express');
const mongoose = require('mongoose');
const cors = require('../middleware/cors');

const app = express();

// Simple MongoDB connection (remove connectDB import)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mukky254:muhidinaliko2006@cluster0.bneqb6q.mongodb.net/kaziDB?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors);
app.use(express.json());

app.use('/api/test', require('./test'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kazi Ocha API is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const jobRoutes = require('./jobs');
const userRoutes = require('./users');

// API routes
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

module.exports = app;
