const { connectToDatabase } = require('../utils/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    
    // Root endpoint
    if (req.url === '/' || req.url === '') {
      return res.json({ 
        success: true, 
        message: 'Kazi Ocha Backend API is working!',
        timestamp: new Date().toISOString(),
        endpoints: ['/auth', '/jobs', '/employees', '/health']
      });
    }

    // Health check
    if (req.url === '/health') {
      return res.json({ 
        success: true, 
        status: 'OK', 
        database: 'Connected',
        timestamp: new Date().toISOString()
      });
    }

    res.status(404).json({ 
      success: false, 
      error: 'Endpoint not found',
      path: req.url 
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
