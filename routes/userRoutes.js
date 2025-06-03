const express = require('express');
const router = express.Router();
const UserModel = require('../models/User');
const { protect } = require('../middleware/auth');

// Inject PostgreSQL pool into User model
router.use((req, res, next) => {
  const pool = req.app.locals.pool;
  req.models = {
    ...(req.models || {}),
    User: new UserModel(pool),
  };
  next();
});

// Load user controller
let controller;
try {
  controller = require('../controllers/userController');
} catch (err) {
  console.error('❌ Failed to load userController:', err);
  controller = {};
}

const { getProfile, updateProfile, deleteUser } = controller;

// Ensure required functions exist before routing
if (getProfile && updateProfile) {
  router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile);
} else {
  console.warn('⚠️ getProfile or updateProfile not defined in controller');
}

// Optional route for deleting account
if (deleteUser) {
  router.delete('/profile', protect, deleteUser);
}

module.exports = router;
