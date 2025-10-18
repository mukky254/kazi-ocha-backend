const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not found, running without database');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't crash the server if DB connection fails
  }
};

// Initialize DB connection
connectDB();

// Routes
app.get('/api', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    message: 'Kazi Ocha Backend API is working!',
    database: dbStatus,
    endpoints: ['/auth', '/jobs', '/health']
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    message: `Server is healthy - Database: ${dbStatus}`,
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Export the app
module.exports = app;
