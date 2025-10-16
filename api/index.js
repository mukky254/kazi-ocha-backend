require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB connection with serverless optimization
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔧 Initializing MongoDB connection...');
console.log('📡 MONGODB_URI present:', !!MONGODB_URI);

// Connection configuration for serverless
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 1,
};

// Global to track connection state
let isConnecting = false;

const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return mongoose.connection;
  }

  // If connecting, wait for the connection
  if (isConnecting) {
    console.log('🔄 MongoDB connection in progress, waiting...');
    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        if (mongoose.connection.readyState === 1) {
          resolve(mongoose.connection);
        } else if (mongoose.connection.readyState === 0) {
          reject(new Error('Connection failed'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  isConnecting = true;
  
  try {
    console.log('🚀 Attempting MongoDB connection...');
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log('✅ MongoDB connected successfully!');
    isConnecting = false;
    return mongoose.connection;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully!');
  isConnecting = false;
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err.message);
  isConnecting = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
  isConnecting = false;
});

// Initialize connection on startup
connectDB().catch(console.error);

// Middleware
app.use(express.json());

// Enhanced CORS middleware
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

// Routes that work even without DB connection
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const isConnected = dbStatus === 1;
    
    res.json({ 
      status: isConnected ? 'OK' : 'WARNING',
      database: isConnected ? 'connected' : 'disconnected',
      databaseCode: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      database: 'disconnected',
      databaseCode: 0,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: 'Health check failed'
    });
  }
});

app.get('/', async (req, res) => {
  try {
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
      databaseCode: dbStatus,
      deployment: 'Vercel',
      note: dbStatus === 0 ? 'Database may connect on next request' : 'Database connection active'
    });
  } catch (error) {
    res.json({
      message: 'Kazi Ocha API is working!',
      timestamp: new Date().toISOString(),
      status: 'success',
      database: 'error',
      databaseCode: 0,
      deployment: 'Vercel',
      note: 'API working but database connection failed'
    });
  }
});

// Debug endpoint with connection attempt
app.get('/api/debug', async (req, res) => {
  try {
    // Try to establish connection if not connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    
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
        environment: process.env.NODE_ENV || 'not set',
        databaseName: mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected'
      },
      server: {
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      mongodb: {
        status: 'error',
        code: mongoose.connection.readyState,
        uriPresent: !!process.env.MONGODB_URI
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Jobs endpoint (always works with test data)
app.get('/api/jobs', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({
    success: true,
    message: isConnected ? 'API ready for MongoDB data' : 'Using test data - MongoDB connecting',
    database: isConnected ? 'connected' : 'connecting',
    databaseCode: dbStatus,
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
      }
    ]
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'Database connection successful!',
      database: 'connected',
      databaseCode: mongoose.connection.readyState
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      databaseCode: mongoose.connection.readyState
    });
  }
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
      '/api/jobs',
      '/api/test-db'
    ]
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

module.exports = app;
