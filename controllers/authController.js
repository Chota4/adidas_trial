const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// Show login form
exports.showLoginForm = (req, res) => {
  res.send('Render login form here');
};

// Logout
exports.logout = (req, res) => {
  res.send('User logged out (implement session/token invalidation)');
};

// Show register form
exports.showRegisterForm = (req, res) => {
  res.send('Render registration form here');
};

// Register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/register');
    }

    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });

    const token = User.generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    req.flash('success', 'Registration successful! Welcome to Adidas Store.');
    res.redirect('/dashboard');
  } catch (error) {
    if (error.message === 'Email already exists') {
      req.flash('error', 'Email already registered. Please login instead.');
      return res.redirect('/auth/login');
    }

    console.error('Registration error:', error);
    req.flash('error', 'An error occurred during registration. Please try again.');
    res.redirect('/auth/register');
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/login');
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const isMatch = await User.verifyPassword(user, password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const token = User.generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login. Please try again.');
    res.redirect('/auth/login');
  }
};

// Show 2FA form
exports.show2faForm = (req, res) => {
  res.send('Render 2FA verification form here');
};

// Verify 2FA
exports.verify2fa = (req, res) => {
  res.send('2FA verification logic not implemented yet');
};

// Show 2FA setup form
exports.show2faSetup = (req, res) => {
  res.send('Render 2FA setup page here');
};

// Enable 2FA
exports.enable2fa = (req, res) => {
  res.send('Enable 2FA logic not implemented yet');
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/forgot-password');
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      req.flash('error', 'No account found with that email address');
      return res.redirect('/auth/forgot-password');
    }

    // Placeholder for token generation and email logic
    req.flash('success', 'Password reset instructions have been sent to your email.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/auth/forgot-password');
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('back');
    }

    const { token, password } = req.body;

    // Placeholder for token verification and password update
    req.flash('success', 'Password has been reset successfully. Please login with your new password.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('back');
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update current user
exports.updateCurrentUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.update(req.user.id, updates);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/user/settings');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    const isMatch = await User.verifyPassword(user, currentPassword);
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/user/settings');
    }

    await User.updatePassword(req.user.id, newPassword);

    req.flash('success', 'Password updated successfully');
    res.redirect('/user/settings');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/user/settings');
  }
};
