const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// SECURITY: Use a strong salt round for bcrypt to mitigate brute-force attacks.
const SALT_ROUNDS = 12;

/**
 * POST /register
 * Register a new user
 * Body: { name, email, password, role? }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    // SECURITY: Use parameterized query to prevent SQL injection
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user into the database
    // SECURITY: Parameterized query
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Generate JWT
    // SECURITY: Sign the token with an expiration time
    const payload = { id: userId, email, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: payload
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
});

/**
 * POST /login
 * Authenticate a user and issue a JWT
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Retrieve user by email
    // SECURITY: Parameterized query
    const [users] = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
    const user = users[0];

    // SECURITY: Generic error message to prevent email enumeration
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Compare provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate JWT
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

/**
 * GET /me
 * Retrieve the current authenticated user's profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Retrieve user, excluding the password field
    // SECURITY: Parameterized query
    const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching profile' });
  }
});

module.exports = router;
