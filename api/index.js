const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  role: { type: String, enum: ['employee', 'employer'], required: true },
  specialization: String,
  jobType: String,
  joinDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Check if phone number exists
app.post('/api/auth/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    res.json({
      success: true,
      exists: !!user
    });
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Sign up endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, location, password, role, specialization, jobType } = req.body;
    
    console.log('📝 Signup attempt:', { phone, role });

    // Validation
    if (!name || !phone || !location || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this phone number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      phone,
      location,
      password: hashedPassword,
      role,
      specialization: role === 'employee' ? specialization : '',
      jobType: role === 'employer' ? jobType : ''
    });

    await user.save();

    console.log('✅ User created successfully:', phone);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        role: user.role,
        specialization: user.specialization,
        jobType: user.jobType,
        joinDate: user.joinDate,
        lastLogin: user.lastLogin
      },
      token
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during signup'
    });
  }
});

// Sign in endpoint
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log('🔐 Login attempt:', phone);

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone and password are required'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Account not found. Please sign up first.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY }
    );

    console.log('✅ Login successful:', phone);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        role: user.role,
        specialization: user.specialization,
        jobType: user.jobType,
        joinDate: user.joinDate,
        lastLogin: user.lastLogin
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// Update profile endpoint
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { phone, name, location, specialization, jobType } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user fields
    user.name = name;
    user.location = location;
    
    if (user.role === 'employee') {
      user.specialization = specialization;
    } else {
      user.jobType = jobType;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
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

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update'
    });
  }
});

// Change password endpoint
app.put('/api/auth/password', async (req, res) => {
  try {
    const { phone, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password change'
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};
