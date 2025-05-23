const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('dateOfBirth').optional().isISO8601(),
  body('riskTolerance').optional().isIn(['conservative', 'moderate', 'aggressive']),
  body('investmentExperience').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('annualIncome').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'dateOfBirth', 'riskTolerance', 
      'investmentExperience', 'annualIncome'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    await req.user.update(updates);

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate current password
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await req.user.update({ password: newPassword });

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'Internal server error'
    });
  }
});

// Deactivate account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await req.user.update({ isActive: false });

    res.json({
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({
      error: 'Failed to deactivate account',
      message: 'Internal server error'
    });
  }
});

module.exports = router;