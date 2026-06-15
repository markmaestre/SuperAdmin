const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

const router = express.Router();

// Configure multer for memory storage (for form-data parsing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware to parse form-data
const parseFormData = upload.none();

// Helper function to check if user is admin (any admin type)
const isAdmin = (user) => {
  return user.role === 'admin' || user.role === 'southadmin' || user.role === 'centraladmin' || user.role === 'superadmin';
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  const { username, email, password, bod, gender, address, role, barangay } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      bod,
      gender,
      address,
      role: role || 'user',
      barangay: barangay || '',
      status: 'active'
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Account is banned. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    // Include role in token (could be 'southadmin', 'centraladmin', 'admin', or 'user')
    const tokenPayload = { 
      id: user._id, 
      role: user.role,
      barangay: user.barangay
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        gender: user.gender,
        bod: user.bod,
        address: user.address,
        profile: user.profile,
        barangay: user.barangay,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', auth, parseFormData, async (req, res) => {
  try {
    console.log('🔧 Profile update request received for user:', req.user.id);
    console.log('📦 Request body:', req.body);

    const { username, email, bod, gender, address, profile } = req.body;
    
    const updatedFields = {};

    if (username !== undefined && username !== '') {
      updatedFields.username = username;
      console.log('📝 Updating username:', username);
    }
    if (email !== undefined && email !== '') {
      updatedFields.email = email;
      console.log('📝 Updating email:', email);
    }
    if (bod !== undefined && bod !== '') {
      updatedFields.bod = bod;
      console.log('📝 Updating bod:', bod);
    }
    if (gender !== undefined && gender !== '') {
      updatedFields.gender = gender;
      console.log('📝 Updating gender:', gender);
    }
    if (address !== undefined && address !== '') {
      updatedFields.address = address;
      console.log('📝 Updating address:', address);
    }

    if (profile !== undefined) {
      if (profile === '') {
        updatedFields.profile = null;
        console.log('🗑️ Removing profile picture');
      } else if (profile && profile.startsWith('data:image')) {
        try {
          console.log('📸 Uploading new profile picture to Cloudinary...');
          const uploadResponse = await cloudinary.uploader.upload(profile, {
            folder: 'user_profiles',
            resource_type: 'image',
          });
          updatedFields.profile = uploadResponse.secure_url;
          console.log('✅ Image uploaded to Cloudinary:', uploadResponse.secure_url);
        } catch (uploadError) {
          console.error('❌ Cloudinary upload error:', uploadError);
          return res.status(500).json({ message: 'Error uploading image to Cloudinary' });
        }
      }
    }

    console.log('🔄 Fields to update:', updatedFields);

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: updatedFields }, 
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User updated successfully:', {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profile: updatedUser.profile
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        gender: updatedUser.gender,
        bod: updatedUser.bod,
        address: updatedUser.address,
        profile: updatedUser.profile,
        role: updatedUser.role,
        status: updatedUser.status,
        barangay: updatedUser.barangay,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
      },
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update: ' + error.message });
  }
});

// ==================== GET CURRENT USER PROFILE ====================
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        gender: user.gender,
        bod: user.bod,
        address: user.address,
        profile: user.profile,
        barangay: user.barangay,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user data' });
  }
});

// ==================== CHECK EMAIL ====================
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    res.json({ message: 'Email available' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking email' });
  }
});

// ==================== GET ALL USERS (Admin only - now accepts southadmin, centraladmin, admin) ====================
router.get('/all-users', auth, async (req, res) => {
  try {
    // Check if user has any admin role
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    console.log('User role:', req.user.role);
    
    let query = {};
    
    // Filter by admin type based on role
    if (req.user.role === 'southadmin') {
      query.barangay = 'South Signal';
      console.log('Filtering for South Signal residents');
    } else if (req.user.role === 'centraladmin') {
      query.barangay = 'Central Bicutan';
      console.log('Filtering for Central Bicutan residents');
    }
    // For 'admin' or 'superadmin', return all users (no filter)

    console.log('Query:', query);

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    console.log(`Found ${users.length} users`);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users: ' + error.message });
  }
});

// ==================== BAN / ACTIVATE USER ====================
router.put('/ban/:id', auth, async (req, res) => {
  // Check if user has any admin role
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { status } = req.body;

  if (!['banned', 'active'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    // Get the user to be updated
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if admin has permission to modify this user based on their role
    if (req.user.role === 'southadmin' && targetUser.barangay !== 'South Signal') {
      return res.status(403).json({ message: 'You can only manage South Signal residents' });
    }
    if (req.user.role === 'centraladmin' && targetUser.barangay !== 'Central Bicutan') {
      return res.status(403).json({ message: 'You can only manage Central Bicutan residents' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User ${user.username} status updated to ${status} by ${req.user.role}`);
    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status: ' + error.message });
  }
});

module.exports = router;