const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    try {
      const [users] = await pool.execute(
        'SELECT id, username, email, role, status, profile_image FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (users[0].status !== 'active') {
        return res.status(401).json({ error: 'Account is not active' });
      }

      req.user = users[0];
      next();
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  } catch (jwtError) {
    console.error('JWT verification failed:', jwtError.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.log(`Access denied: User ${req.user.id} (${req.user.username}) has role ${req.user.role}, but admin required.`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };