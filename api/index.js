const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB Connection with event listeners
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔧 Setting up MongoDB connection...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully!');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Basic middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let statusText = 'unknown';
  
  switch(dbStatus) {
    case 0: statusText = 'disconnected'; break;
    case 1: statusText = 'connected'; break;
    case 2: statusText = 'connecting'; break;
    case 3: statusText = 'disconnecting'; break;
  }
  
  res.json({
    success: true,
    mongodb: {
      status: statusText,
      code: dbStatus,
      uriPresent: !!process.env.MONGODB_URI,
      environment: process.env.NODE_ENV || 'not set'
    },
    timestamp: new Date().toISOString()
  });
});

// Main endpoint
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let statusText = 'unknown';
  
  switch(dbStatus) {
    case 0: statusText = 'disconnected'; break;
    case 1: statusText = 'connected'; break;
    case 2: statusText = 'connecting'; break;
    case 3: statusText = 'disconnecting'; break;
  }
  
  res.json({ 
    message: 'Kazi Ocha API is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
    database: statusText,
    databaseCode: dbStatus
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({ 
    status: 'OK',
    database: isConnected ? 'connected' : 'connecting',
    databaseCode: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Jobs endpoint with test data
app.get('/api/jobs', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({
    success: true,
    message: isConnected ? 'API ready for MongoDB data' : 'Using test data - MongoDB connecting',
    database: isConnected ? 'connected' : 'connecting',
    jobs: [
      {
        id: 1,
        title: 'Construction Worker Needed - Nairobi',
        description: 'Immediate opening for experienced construction workers for building project',
        location: 'Nairobi, CBD',
        salary: 'KSh 1,500 per day',
        category: 'construction',
        phone: '+254712345678',
        posted: '2 hours ago'
      },
      {
        id: 2,
        title: 'Farm Assistant - Kiambu',
        description: 'Help with farm work, planting, and harvesting',
        location: 'Kiambu County', 
        salary: 'KSh 1,200 per day',
        category: 'agriculture',
        phone: '+254723456789',
        posted: '5 hours ago'
      },
      {
        id: 3,
        title: 'House Cleaning Services',
        description: 'Reliable cleaner needed for residential house cleaning',
        location: 'Westlands, Nairobi',
        salary: 'KSh 1,000 per day',
        category: 'domestic',
        phone: '+254734567890',
        posted: '1 day ago'
      }
    ]
  });
});

// Handle unknown endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      '/',
      '/api/health', 
      '/api/debug',
      '/api/jobs'
    ]
  });
});

module.exports = app;
