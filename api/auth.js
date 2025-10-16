const { connectToDatabase } = require('../utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-make-it-very-long-and-random';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { db } = await connectToDatabase();

  try {
    // Check if phone number exists
    if (method === 'POST' && req.url === '/auth/check-phone') {
      const { phone } = req.body;
      
      const existingUser = await db.collection('users').findOne({ phone });
      res.json({ exists: !!existingUser });
      return;
    }

    // User Signup
    if (method === 'POST' && req.url === '/auth/signup') {
      const { name, phone, location, password, role, specialization, jobType } = req.body;

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'An account with this phone number already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        name,
        phone,
        location,
        password: hashedPassword,
        role,
        specialization: role === 'employee' ? specialization : '',
        jobType: role === 'employer' ? jobType : '',
        joinDate: new Date(),
        lastLogin: new Date()
      };

      const result = await db.collection('users').insertOne(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertedId, phone: user.phone }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          _id: result.insertedId,
          name: user.name,
          phone: user.phone,
          location: user.location,
          role: user.role,
          specialization: user.specialization,
          jobType: user.jobType,
          joinDate: user.joinDate,
          lastLogin: user.lastLogin
        }
      });
      return;
    }

    // User Signin
    if (method === 'POST' && req.url === '/auth/signin') {
      const { phone, password } = req.body;

      // Find user
      const user = await db.collection('users').findOne({ phone });
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          error: 'Account not found. Please sign up first.' 
        });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid password' 
        });
      }

      // Update last login
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, phone: user.phone }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          location: user.location,
          role: user.role,
          specialization: user.specialization,
          jobType: user.jobType,
          joinDate: user.joinDate,
          lastLogin: new Date()
        }
      });
      return;
    }

    // Update profile
    if (method === 'PUT' && req.url === '/auth/profile') {
      const { phone, name, location, specialization, jobType } = req.body;

      const updateData = { name, location };
      if (specialization !== undefined) updateData.specialization = specialization;
      if (jobType !== undefined) updateData.jobType = jobType;

      const result = await db.collection('users').updateOne(
        { phone },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      const updatedUser = await db.collection('users').findOne({ phone });

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          location: updatedUser.location,
          role: updatedUser.role,
          specialization: updatedUser.specialization,
          jobType: updatedUser.jobType,
          joinDate: updatedUser.joinDate,
          lastLogin: updatedUser.lastLogin
        }
      });
      return;
    }

    // Change password
    if (method === 'PUT' && req.url === '/auth/password') {
      const { phone, currentPassword, newPassword } = req.body;

      const user = await db.collection('users').findOne({ phone });
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current password is incorrect' 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.collection('users').updateOne(
        { phone },
        { $set: { password: hashedPassword } }
      );

      res.json({ success: true, message: 'Password updated successfully' });
      return;
    }

    // If no route matches
    res.status(404).json({ success: false, error: 'Endpoint not found' });

  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
