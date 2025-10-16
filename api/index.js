require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB connection with better Vercel handling
const MONGODB_URI = process.env.MONGODB_URI;

// Global variable to track connection state
let isConnected = false;
let connectionPromise = null;

// Improved connection function for serverless
const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  if (connectionPromise) {
    console.log('🔄 Connection in progress, waiting...');
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0
  }).then(conn => {
    isConnected = true;
    console.log('✅ MongoDB connected successfully!');
    return conn;
  }).catch(error => {
    console.error('❌ MongoDB connection failed:', error.message);
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('✅ MongoDB connected successfully!');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.log('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('🔌 MongoDB disconnected');
});

// Middleware to handle DB connection for each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    next(); // Continue anyway, we'll handle it in routes
  }
});

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    ['*'];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basic middleware
app.use(express.json());

// Health check (no DB dependency)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Main endpoint with DB status
app.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  
  res.json({ 
    message: 'Kazi Ocha API is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
    database: dbStatus === 1 ? 'connected' : 'connecting',
    databaseCode: dbStatus,
    deployment: 'Vercel'
  });
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
    server: {
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
});

// Jobs endpoint (works even if DB is down)
app.get('/api/jobs', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  
  res.json({
    success: true,
    message: dbStatus === 1 ? 'API ready for MongoDB data' : 'Using test data - MongoDB connecting',
    database: dbStatus === 1 ? 'connected' : 'connecting',
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : error.message
  });
});

// Export for Vercel
module.exports = app;
