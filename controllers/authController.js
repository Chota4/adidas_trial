const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Show login form (GET /login)
exports.showLoginForm = (req, res) => {
  // Render a login page or send a message for API-only app
  res.send('Render login form here');
};

// Logout (GET /logout)
exports.logout = (req, res) => {
  // If using sessions or tokens, destroy session or instruct client to delete token
  // Here, just a placeholder response
  res.send('User logged out (implement session/token invalidation)');
};

// Show register form (GET /register)
exports.showRegisterForm = (req, res) => {
  // Render a registration page or send message for API
  res.send('Render registration form here');
};

// Register (POST /register)
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login (POST /login)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Show 2FA form (GET /2fa)
exports.show2faForm = (req, res) => {
  res.send('Render 2FA verification form here');
};

// Verify 2FA (POST /2fa)
exports.verify2fa = (req, res) => {
  // Implement your 2FA verification logic here
  res.send('2FA verification logic not implemented yet');
};

// Show 2FA setup form (GET /setup-2fa)
exports.show2faSetup = (req, res) => {
  res.send('Render 2FA setup page here');
};

// Enable 2FA (POST /enable-2fa)
exports.enable2fa = (req, res) => {
    res.send('Enable 2FA logic not implemented yet');
};