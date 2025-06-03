const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  showLoginForm,
  login,
  logout,
  showRegisterForm,
  register,
  show2faForm,
  verify2fa,
  show2faSetup,
  enable2fa
} = require('../controllers/authController');
const { guest, auth } = require('../middleware/auth');

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Debug route
router.get('/debug-test', (req, res) => {
  res.send('✅ Auth route working');
});

// Authentication routes
router.get('/login', showLoginForm);
router.post('/login', guest, loginValidation, login);
router.post('/logout', auth, logout);
router.get('/register', showRegisterForm);
router.post('/register', guest, registerValidation, register);

// 2FA routes
router.get('/2fa', show2faForm);
router.post('/2fa', verify2fa);
router.get('/setup-2fa', auth, show2faSetup);
router.post('/enable-2fa', auth, enable2fa);

// OAuth routes (placeholders)
router.get('/google', guest, (req, res) => {
  res.status(501).json({ message: 'Google OAuth not implemented yet' });
});

router.get('/google/callback', guest, (req, res) => {
  res.status(501).json({ message: 'Google OAuth callback not implemented yet' });
});

router.get('/facebook', guest, (req, res) => {
  res.status(501).json({ message: 'Facebook OAuth not implemented yet' });
});

router.get('/facebook/callback', guest, (req, res) => {
  res.status(501).json({ message: 'Facebook OAuth callback not implemented yet' });
});

// Global error handler
router.use((err, req, res, next) => {
  console.error('❌ Auth route error:', err);
  res.status(500).send('Authentication route error');
});

module.exports = router;
