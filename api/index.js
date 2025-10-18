// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mukky254:your-password@cluster0.mongodb.net/kazi-ocha';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Root API route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Kazi Ocha Backend API is working!',
    endpoints: ['/auth', '/jobs', '/employees', '/health']
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Export the Express API
module.exports = app;
