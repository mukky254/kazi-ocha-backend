const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mukky254:muhidinaliko2006@cluster0.bneqb6q.mongodb.net/kaziDB?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((error) => {
  console.log('❌ MongoDB connection failed:', error.message);
});

// Basic middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Simple test route
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

// Health check with DB status
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({ 
    status: 'OK',
    database: isConnected ? 'connected' : 'disconnected',
    databaseCode: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Test jobs endpoint (using test data for now)
app.get('/api/jobs', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isConnected = dbStatus === 1;
  
  res.json({
    success: true,
    message: isConnected ? 'Jobs endpoint working (DB connected)' : 'Jobs endpoint working (using test data)',
    database: isConnected ? 'connected' : 'disconnected',
    jobs: [
      {
        id: 1,
        title: 'Construction Worker Needed',
        description: 'Looking for construction workers for building project in Nairobi',
        location: 'Nairobi',
        category: 'construction',
        salary: '1500 per day',
        phone: '+254712345678'
      },
      {
        id: 2,
        title: 'Farm Assistant Urgently Needed',
        description: 'Help with farm work and harvesting in Kiambu',
        location: 'Kiambu',
        category: 'agriculture', 
        salary: '1200 per day',
        phone: '+254723456789'
      },
      {
        id: 3,
        title: 'House Cleaning Services',
        description: 'Need reliable cleaner for residential house in Westlands',
        location: 'Westlands',
        category: 'domestic',
        salary: '1000 per day',
        phone: '+254734567890'
      }
    ]
  });
});

// POST create job (test endpoint)
app.post('/api/jobs', (req, res) => {
  const jobData = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Job created successfully!',
    job: {
      id: Date.now(),
      ...jobData,
      createdAt: new Date().toISOString()
    }
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
