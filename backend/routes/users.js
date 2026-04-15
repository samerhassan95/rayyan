const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;