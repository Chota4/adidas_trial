const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.render('users/profile', {
    title: 'Your Profile',
    user,
  });
});

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.render('users/profile', {
      title: 'Your Profile',
      user: updatedUser,
      messages: { success: 'Profile updated successfully' },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});