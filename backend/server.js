const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Test database connection
const pool = require('./config/database');

// Test route
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    res.json({ 
      message: 'Rayyan API is running!', 
      database: 'Connected',
      test: rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'API is running but database connection failed', 
      error: error.message 
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscriptions', require('./routes/subscriptions-working'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/plans', require('./routes/plans'));

app.listen(PORT, () => {
  console.log(`Rayyan server running on port ${PORT}`);
});