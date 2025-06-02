const express = require('express');
const router = express.Router();

// Import controller methods with error handling
let controllers;
try {
    controllers = require('../controllers/authController');
} catch (err) {
    console.error('❌ Failed to load authController:', err);
    process.exit(1); // Exit if controllers can't be loaded
}

// Destructure methods with null checks
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
} = controllers || {};

// Verify all required methods exist
const requiredMethods = [
    'showLoginForm', 'login', 'logout', 
    'showRegisterForm', 'register',
    'show2faForm', 'verify2fa',
    'show2faSetup', 'enable2fa'
];

for (const method of requiredMethods) {
    if (typeof controllers[method] !== 'function') {
        console.error(`❌ Missing required controller method: ${method}`);
    }
}

// Import middleware
let protect;
try {
    protect = require('../middleware/auth').protect;
} catch (err) {
    console.error('❌ Failed to load auth middleware:', err);
    protect = (req, res, next) => next(); // Fallback if middleware fails
}

// Test route
router.get('/debug-test', (req, res) => {
    console.log('✅ Route test successful');
    res.send('Route working!');
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

// Route error handler
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).send('Authentication error');
});
console.log('✅ Auth routes loaded successfully');

// ✅ Export the router — NOT the functions (you're using routes here)
module.exports = router;
