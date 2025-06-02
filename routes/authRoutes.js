const express = require('express');
const router = express.Router();

// Load PostgreSQL model (optional for future use)
const UserModel = require('../models/User');

// Inject PostgreSQL model into req.models (optional)
router.use((req, res, next) => {
  const pool = req.app.locals.pool;
  req.models = {
    User: new UserModel(pool),
  };
  next();
});

// Load middleware
let protect;
try {
  protect = require('../middleware/auth').protect;
} catch (err) {
  console.error('❌ Failed to load auth middleware:', err);
  protect = (req, res, next) => next(); // Fallback if protect not implemented
}

// Load controller
let controllers;
try {
  controllers = require('../controllers/authController');
} catch (err) {
  console.error('❌ Failed to load authController:', err);
  process.exit(1);
}

// Destructure controller methods
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
} = controllers;

// Verify all required methods exist
[
  'showLoginForm', 'login', 'logout',
  'showRegisterForm', 'register',
  'show2faForm', 'verify2fa',
  'show2faSetup', 'enable2fa'
].forEach(method => {
  if (typeof controllers[method] !== 'function') {
    console.error(`❌ Missing controller method: ${method}`);
  }
});

// Debug route
router.get('/debug-test', (req, res) => {
  res.send('✅ Auth route working');
});

// Authentication routes
router.get('/login', showLoginForm);
router.post('/login', login);
router.get('/logout', logout);
router.get('/register', showRegisterForm);
router.post('/register', register);

// 2FA routes
router.get('/2fa', show2faForm);
router.post('/2fa', verify2fa);
router.get('/setup-2fa', protect, show2faSetup);
router.post('/enable-2fa', protect, enable2fa);

// Global error handler
router.use((err, req, res, next) => {
  console.error('❌ Auth route error:', err);
  res.status(500).send('Authentication route error');
});

module.exports = router;
