require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Debug environment variables at startup
console.log('=== Environment Check ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Present' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('=========================');

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ CRITICAL: MONGODB_URI is not defined in environment variables!');
  console.error('Please check your .env file and ensure it contains MONGODB_URI');
  process.exit(1);
}

console.log('🔧 Setting up MongoDB connection...');
console.log('📡 Connecting to MongoDB Atlas...');

// Improved connection with async/await
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Tips: Check your MongoDB Atlas IP whitelist and credentials');
    process.exit(1); // Exit if DB connection fails
  }
};

// Call the connection function
connectDB();

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully!');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Enhanced CORS middleware
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    ['*'];
  
  const origin = req.headers.origin;
  
  console.log(`🌐 CORS check - Origin: ${origin}, Allowed: ${allowedOrigins}`);
  
  if (allowedOrigins.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
      environment: process.env.NODE_ENV || 'not set',
      database: mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected'
    },
    server: {
      port: process.env.PORT || 3000,
      uptime: process.uptime()
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
    databaseCode: dbStatus,
    frontend: 'https://kazi-ocha-frontend-887d.vercel.app'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({ 
    status: isConnected ? 'OK' : 'WARNING',
    database: isConnected ? 'connected' : 'connecting',
    databaseCode: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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
    ],
    documentation: 'Check /api/debug for server status'
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 MongoDB connection state: ${mongoose.connection.readyState}`);
  console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
  console.log(`🌐 Allowed origins: ${process.env.ALLOWED_ORIGINS}`);
});

module.exports = app;
