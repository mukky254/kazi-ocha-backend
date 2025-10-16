const { connectToDatabase } = require('../utils/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // GET - Get all employees
    if (req.method === 'GET') {
      const employees = await usersCollection.find({ role: 'employee' })
        .sort({ joinDate: -1 })
        .toArray();
      
      res.status(200).json({
        success: true,
        employees: employees || []
      });
    }
    
    else {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    }
    
  } catch (error) {
    console.error('Employees API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
