const express = require('express');
const router = express.Router();

// ✅ Destructure methods directly
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

const { protect } = require('../middleware/auth');

// ✅ This line is invalid with destructuring, so REMOVE or COMMENT it
// console.log('Auth Controller Methods:', Object.keys(authController));

// ✅ Simple test route to check routing works
router.get('/debug-test', (req, res) => {
    res.send('Route working!');
});

// ✅ Use destructured methods directly
router.get('/login', showLoginForm);
router.post('/login', login);
router.get('/logout', logout);
router.get('/register', showRegisterForm);
router.post('/register', register);
router.get('/2fa', show2faForm);
router.post('/2fa', verify2fa);
router.get('/setup-2fa', protect, show2faSetup);
router.post('/enable-2fa', protect, enable2fa);

// ✅ Debug message (optional)
console.log('Auth routes loaded successfully.');

// ✅ Export the router — NOT the functions (you're using routes here)
module.exports = router;
