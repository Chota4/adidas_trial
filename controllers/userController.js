const pool = require('../config/db');

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get User Profile Error:', err);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
      [username, email, userId]
    );
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('Update User Profile Error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Delete user account
exports.deleteUser = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User account deleted' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Failed to delete user account' });
  }
};
