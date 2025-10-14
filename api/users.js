const connectDB = require('../utils/database');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cors = require('../middleware/cors');

const JWT_SECRET = process.env.JWT_SECRET || 'kazi-mashinani-secret';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

module.exports = async (req, res) => {
  // Apply CORS
  await new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  await connectDB();

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Register user
    if (req.method === 'POST' && req.url === '/register') {
      const { name, email, phone, password, location, role = 'employer' } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email or phone already exists'
        });
      }
      
      // Create user
      const user = new User({
        name,
        email,
        phone,
        password,
        location,
        role
      });
      
      await user.save();
      
      // Generate token
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role
        }
      });
    }
    
    // POST - Login user
    else if (req.method === 'POST' && req.url === '/login') {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      // Generate token
      const token = generateToken(user._id);
      
      res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role
        }
      });
    }
    
    // GET - Get user profile
    else if (req.method === 'GET' && req.url.includes('/profile')) {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    }
    
    else {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    }
    
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};