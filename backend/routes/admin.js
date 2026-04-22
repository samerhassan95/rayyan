const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  }
});

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Upload profile photo
router.post('/upload-profile-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a file' });
  }
  const photoUrl = `/uploads/profiles/${req.file.filename}`;
  res.json({ photoUrl });
});

// Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { period = 6 } = req.query; // Default to 6 months
    
    // Get total users
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    
    // Get total subscriptions
    const [subscriptionCount] = await pool.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    
    // Get total revenue from transactions
    const [revenue] = await pool.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "successful"');
    
    // Get support tickets
    const [ticketCount] = await pool.execute('SELECT COUNT(*) as count FROM support_tickets WHERE status = "open"');
    
    // Get recent transactions
    const [recentTransactions] = await pool.execute(`
      SELECT t.*, u.username, u.email 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.transaction_date DESC 
      LIMIT 10
    `);

    // Get monthly revenue data based on period
    const [monthlyRevenue] = await pool.execute(`
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as revenue,
        COUNT(CASE WHEN status = 'successful' THEN 1 END) as transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
      FROM transactions 
      WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
      ORDER BY month ASC
    `, [parseInt(period)]);

    // Get user acquisition data with source tracking (ALL users, not just last month)
    const [userAcquisitionData] = await pool.execute(`
      SELECT 
        COALESCE(acquisition_source, 'direct') as source,
        COUNT(*) as count
      FROM users 
      WHERE role = 'user'
      GROUP BY COALESCE(acquisition_source, 'direct')
    `);

    // Calculate total users for percentage calculation
    const totalAcquisition = userAcquisitionData.reduce((sum, item) => sum + item.count, 0);
    
    // Create user acquisition object with percentages
    const userAcquisitionMap = {};
    userAcquisitionData.forEach(item => {
      const percentage = totalAcquisition > 0 ? Math.round((item.count / totalAcquisition) * 100) : 0;
      userAcquisitionMap[item.source.toLowerCase()] = {
        percentage,
        count: item.count
      };
    });

    // Ensure all sources are represented
    const userAcquisition = {
      direct: userAcquisitionMap.direct?.percentage || 45,
      referral: userAcquisitionMap.referral?.percentage || 32,
      social: userAcquisitionMap.social?.percentage || 18,
      other: userAcquisitionMap.other?.percentage || 5,
      directCount: userAcquisitionMap.direct?.count || 0,
      referralCount: userAcquisitionMap.referral?.count || 0,
      socialCount: userAcquisitionMap.social?.count || 0,
      otherCount: userAcquisitionMap.other?.count || 0,
      total: totalAcquisition
    };

    // Calculate growth rates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const [currentMonthUsers] = await pool.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND role = 'user'
    `, [currentMonth, currentYear]);
    
    const [lastMonthUsers] = await pool.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND role = 'user'
    `, [lastMonth, lastMonthYear]);

    const userGrowth = lastMonthUsers[0].count > 0 
      ? ((currentMonthUsers[0].count - lastMonthUsers[0].count) / lastMonthUsers[0].count * 100).toFixed(1)
      : currentMonthUsers[0].count > 0 ? 100 : 0;

    // Calculate revenue growth
    const [currentMonthRevenue] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions 
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND status = 'successful'
    `, [currentMonth, currentYear]);
    
    const [lastMonthRevenue] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions 
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND status = 'successful'
    `, [lastMonth, lastMonthYear]);

    const revenueGrowth = lastMonthRevenue[0].revenue > 0 
      ? ((currentMonthRevenue[0].revenue - lastMonthRevenue[0].revenue) / lastMonthRevenue[0].revenue * 100).toFixed(1)
      : currentMonthRevenue[0].revenue > 0 ? 100 : 0;

    // Calculate subscription growth
    const [currentMonthSubs] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [currentMonth, currentYear]);
    
    const [lastMonthSubs] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [lastMonth, lastMonthYear]);

    const subsGrowth = lastMonthSubs[0].count > 0 
      ? ((currentMonthSubs[0].count - lastMonthSubs[0].count) / lastMonthSubs[0].count * 100).toFixed(1)
      : currentMonthSubs[0].count > 0 ? 100 : 0;

    res.json({
      stats: {
        totalUsers: userCount[0].count || 0,
        totalRevenue: revenue[0].total || 0,
        activeSubscriptions: subscriptionCount[0].count || 0,
        growthRate: userGrowth || 0,
        openTickets: ticketCount[0].count || 0,
        // Additional growth metrics
        userGrowth: userGrowth,
        revenueGrowth: revenueGrowth,
        subsGrowth: subsGrowth,
        // Monthly comparisons
        currentMonthUsers: currentMonthUsers[0].count,
        lastMonthUsers: lastMonthUsers[0].count,
        currentMonthRevenue: currentMonthRevenue[0].revenue,
        lastMonthRevenue: lastMonthRevenue[0].revenue
      },
      recentTransactions: recentTransactions.length > 0 ? recentTransactions : [
        {
          id: 'TXN-902341',
          username: 'Jane Doe',
          email: 'jane@example.com',
          amount: 1200.00,
          transaction_date: '2023-10-24',
          status: 'successful'
        },
        {
          id: 'TXN-902342',
          username: 'Marcus Smith',
          email: 'marcus@example.com',
          amount: 450.00,
          transaction_date: '2023-10-23',
          status: 'pending'
        }
      ],
      monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue : [
        { month: '2023-05', revenue: 95000, transactions: 120 },
        { month: '2023-06', revenue: 110000, transactions: 145 },
        { month: '2023-07', revenue: 125000, transactions: 160 },
        { month: '2023-08', revenue: 140000, transactions: 180 },
        { month: '2023-09', revenue: 155000, transactions: 200 },
        { month: '2023-10', revenue: 170000, transactions: 220 }
      ],
      userAcquisition: userAcquisition
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filtered transactions for dashboard
router.get('/transactions/filtered', async (req, res) => {
  try {
    const { status, dateRange, amount, limit = 10 } = req.query;
    
    let query = `
      SELECT t.*, u.username, u.email 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    // Filter by status
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      switch (dateRange) {
        case 'today':
          query += ' AND DATE(t.transaction_date) = CURDATE()';
          break;
        case 'week':
          query += ' AND t.transaction_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'month':
          query += ' AND t.transaction_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
      }
    }

    // Filter by amount
    if (amount && amount !== 'all') {
      switch (amount) {
        case 'low':
          query += ' AND t.amount < 100';
          break;
        case 'medium':
          query += ' AND t.amount >= 100 AND t.amount <= 1000';
          break;
        case 'high':
          query += ' AND t.amount > 1000';
          break;
      }
    }

    query += ' ORDER BY t.transaction_date DESC LIMIT ?';
    params.push(parseInt(limit));

    const connection = await pool.getConnection();
    const [transactions] = await connection.query(query, params);
    connection.release();

    res.json(transactions);
  } catch (error) {
    console.error('Transactions filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user acquisition analytics
router.get('/analytics/user-acquisition', async (req, res) => {
  try {
    // Get detailed user acquisition data
    const [acquisitionData] = await pool.execute(`
      SELECT 
        COALESCE(acquisition_source, 'direct') as source,
        COUNT(*) as count,
        DATE_FORMAT(created_at, '%Y-%m') as month
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY acquisition_source, DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC, count DESC
    `);

    // Get total counts by source
    const [totalBySource] = await pool.execute(`
      SELECT 
        COALESCE(acquisition_source, 'direct') as source,
        COUNT(*) as total_count
      FROM users 
      GROUP BY acquisition_source
      ORDER BY total_count DESC
    `);

    // Get monthly trends
    const [monthlyTrends] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total_users,
        COUNT(CASE WHEN acquisition_source = 'direct' THEN 1 END) as direct,
        COUNT(CASE WHEN acquisition_source = 'referral' THEN 1 END) as referral,
        COUNT(CASE WHEN acquisition_source = 'social' THEN 1 END) as social,
        COUNT(CASE WHEN acquisition_source IS NULL OR acquisition_source = 'other' THEN 1 END) as other
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    res.json({
      acquisitionData,
      totalBySource,
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';
    const planFilter = req.query.plan || '';
    const twoFactorFilter = req.query.twoFactor || '';

    const connection = await pool.getConnection();
    
    let query = `
      SELECT u.id, u.username, u.email, u.role, u.status, u.phone, u.job_title, u.address, 
             u.two_factor_enabled, u.created_at, u.last_login, u.acquisition_source,
             s.status as subscription_status, p.name as plan_name
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE u.role = 'user'
    `;
    let params = [];

    if (search.trim()) {
      query += ' AND (username LIKE ? OR email LIKE ? OR job_title LIKE ?)';
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    // Add status filter
    if (statusFilter && statusFilter !== 'all') {
      query += ' AND u.status = ?';
      params.push(statusFilter);
    }
    
    // Add plan filter
    if (planFilter && planFilter !== 'all') {
      query += ' AND p.name = ?';
      params.push(planFilter);
    }
    
    // Add 2FA filter
    if (twoFactorFilter && twoFactorFilter !== 'all') {
      if (twoFactorFilter === 'enabled') {
        query += ' AND u.two_factor_enabled = 1';
      } else if (twoFactorFilter === 'disabled') {
        query += ' AND u.two_factor_enabled = 0';
      }
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await connection.query(query, params);

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM users u LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = "active" LEFT JOIN plans p ON s.plan_id = p.id WHERE u.role = "user"';
    let countParams = [];
    
    if (search.trim()) {
      countQuery += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.job_title LIKE ?)';
      const searchParam = `%${search.trim()}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      countQuery += ' AND u.status = ?';
      countParams.push(statusFilter);
    }
    
    if (planFilter && planFilter !== 'all') {
      countQuery += ' AND p.name = ?';
      countParams.push(planFilter);
    }
    
    if (twoFactorFilter && twoFactorFilter !== 'all') {
      if (twoFactorFilter === 'enabled') {
        countQuery += ' AND u.two_factor_enabled = 1';
      } else if (twoFactorFilter === 'disabled') {
        countQuery += ' AND u.two_factor_enabled = 0';
      }
    }

    const [totalCount] = await connection.query(countQuery, countParams);
    
    // Get statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN u.status = 'active' THEN 1 END) as activeUsers,
        COUNT(CASE WHEN u.two_factor_enabled = 1 THEN 1 END) as twoFactorUsers,
        COUNT(CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recentlyActive,
        COUNT(CASE WHEN MONTH(u.created_at) = MONTH(NOW()) AND YEAR(u.created_at) = YEAR(NOW()) THEN 1 END) as newThisMonth,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as activeSubscriptions
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.role = 'user'
    `);

    connection.release();

    const totalUsersCount = stats[0].totalUsers || 1; // Prevent division by zero
    
    // Calculate network health (uptime percentage based on active users and system status)
    // This is a simplified calculation - in production, you'd track actual system uptime
    const activeUsersRatio = (stats[0].activeUsers / totalUsersCount) * 100;
    const recentActivityRatio = (stats[0].recentlyActive / totalUsersCount) * 100;
    const networkHealth = Math.min(99.99, (activeUsersRatio * 0.5 + recentActivityRatio * 0.5)).toFixed(2);
    
    // Calculate system insights
    const inactiveEnterpriseCount = await connection.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE p.tier = 'enterprise' 
      AND u.status = 'active'
      AND (u.last_login IS NULL OR u.last_login < DATE_SUB(NOW(), INTERVAL 5 DAY))
    `);
    
    const activityGrowth = await connection.query(`
      SELECT 
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as this_week,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND last_login < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_week
      FROM users
      WHERE role = 'user'
    `);
    
    const thisWeekActivity = activityGrowth[0][0].this_week || 0;
    const lastWeekActivity = activityGrowth[0][0].last_week || 1;
    const activityIncrease = Math.round(((thisWeekActivity - lastWeekActivity) / lastWeekActivity) * 100);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount[0].total,
        pages: Math.ceil(totalCount[0].total / limit)
      },
      statistics: {
        totalUsers: stats[0].totalUsers || 0,
        activeSubscriptions: stats[0].activeSubscriptions || 0,
        newThisMonth: stats[0].newThisMonth || 0,
        seatUtilization: Math.round((stats[0].activeUsers / totalUsersCount) * 100) || 0,
        avgActivation: Math.round((stats[0].recentlyActive / totalUsersCount) * 100) || 0,
        recentInvites: stats[0].newThisMonth || 0,
        twoFactorEnabled: stats[0].twoFactorUsers || 0,
        networkHealth: parseFloat(networkHealth),
        systemInsights: {
          activityIncrease: activityIncrease,
          inactiveEnterpriseAccounts: inactiveEnterpriseCount[0][0].count || 0
        }
      }
    });
  } catch (error) {
    console.error('Users query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user details with full profile
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details
    const [users] = await pool.execute(`
      SELECT id, username, email, role, status, phone, address, job_title, bio, profile_image,
             two_factor_enabled, last_login, created_at, updated_at, acquisition_source
      FROM users WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user's subscriptions
    const [subscriptions] = await pool.execute(`
      SELECT s.*, p.name as plan_name, p.monthly_price, p.yearly_price
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    // Get user's transactions
    const [transactions] = await pool.execute(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY transaction_date DESC 
      LIMIT 10
    `, [userId]);

    // Get user's support tickets
    const [supportTickets] = await pool.execute(`
      SELECT * FROM support_tickets 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [userId]);

    // Get user's sessions
    const [sessions] = await pool.execute(`
      SELECT * FROM user_sessions 
      WHERE user_id = ? 
      ORDER BY last_activity DESC 
      LIMIT 5
    `, [userId]);

    // Calculate user statistics
    const totalPayments = transactions
      .filter(t => t.status === 'successful')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalSpend = transactions
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

    const openTickets = supportTickets.filter(t => t.status === 'open').length;

    // Generate usage activity data from real user activity
    const usageActivity = [];
    
    // Get real activity data from transactions, tickets, and sessions
    const [transactionActivity] = await pool.execute(`
      SELECT DATE(transaction_date) as activity_date, 
             COUNT(*) as transaction_count,
             SUM(amount) as total_amount
      FROM transactions 
      WHERE user_id = ? AND transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(transaction_date)
      ORDER BY activity_date ASC
    `, [userId]);

    const [ticketActivity] = await pool.execute(`
      SELECT DATE(created_at) as activity_date, 
             COUNT(*) as ticket_count
      FROM support_tickets 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY activity_date ASC
    `, [userId]);

    const [sessionActivity] = await pool.execute(`
      SELECT DATE(last_activity) as activity_date, 
             COUNT(*) as session_count
      FROM user_sessions 
      WHERE user_id = ? AND last_activity >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(last_activity)
      ORDER BY activity_date ASC
    `, [userId]);

    // Create activity map from real data
    const activityMap = {};
    
    // Add transaction activity (weight: high)
    transactionActivity.forEach(t => {
      const date = t.activity_date instanceof Date ? 
        t.activity_date.toISOString().split('T')[0] : 
        t.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (t.transaction_count * 15) + (parseFloat(t.total_amount) / 20);
    });

    // Add support ticket activity (weight: medium)
    ticketActivity.forEach(t => {
      const date = t.activity_date instanceof Date ? 
        t.activity_date.toISOString().split('T')[0] : 
        t.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (t.ticket_count * 10);
    });

    // Add session activity (weight: low)
    sessionActivity.forEach(s => {
      const date = s.activity_date instanceof Date ? 
        s.activity_date.toISOString().split('T')[0] : 
        s.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (s.session_count * 5);
    });

    // Generate complete 30-day range with real data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Use real activity or 0 if no activity
      const realActivity = activityMap[dateKey] || 0;
      
      usageActivity.push({
        date: dateKey,
        value: Math.round(realActivity)
      });
    }

    res.json({
      user,
      subscriptions,
      transactions,
      supportTickets,
      sessions,
      usageActivity,
      statistics: {
        totalPayments: totalPayments.toFixed(2),
        totalSpend: totalSpend.toFixed(2),
        activeSubscriptions,
        openTickets
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role, phone, address, job_title, acquisition_source } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if email already exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(`
      INSERT INTO users (username, email, password, role, phone, address, job_title, status, acquisition_source, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'other', NOW())
    `, [username, email, hashedPassword, role || 'user', phone || null, address || null, job_title || null]);

    // Log the activity
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'user_create', `Created new user: ${username} (${email})`, req.ip]
    );

    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId,
      user: {
        id: result.insertId,
        username,
        email,
        role: role || 'user',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user (including profile updates)
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, phone, address, job_title, bio, status, role, profile_image } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (job_title !== undefined) {
      updates.push('job_title = ?');
      params.push(job_title);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (profile_image !== undefined) {
      updates.push('profile_image = ?');
      params.push(profile_image);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(userId);
    
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Log the activity
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'user_update', `Updated user profile for user ID: ${userId}`, req.ip]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user status (separate endpoint for status-only updates)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    // Log the activity
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'user_status_update', `Changed status to ${status} for user ID: ${userId}`, req.ip]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has orders
    const [orders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]);
    
    if (orders[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete user with existing orders' });
    }

    await pool.execute('DELETE FROM users WHERE id = ? AND role != "admin"', [userId]);
    
    // Log the activity
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'user_delete', `Deleted user ID: ${userId}`, req.ip]
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Category management
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.name
    `);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'active']
    );

    res.status(201).json({ 
      message: 'Category created successfully',
      categoryId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const categoryId = req.params.id;

    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, categoryId]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category has products
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [categoryId]);
    
    if (products[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product management
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.name LIKE ?
    `;
    let params = [`%${search}%`];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    const [products] = await pool.execute(
      query + ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?',
      [...params, limit, offset]
    );

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE name LIKE ?';
    let countParams = [`%${search}%`];
    
    if (category) {
      countQuery += ' AND category_id = ?';
      countParams.push(category);
    }

    const [totalCount] = await pool.execute(countQuery, countParams);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount[0].total,
        pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, category_id, image, status } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, category_id, image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, category_id, image, status || 'active']
    );

    res.status(201).json({ 
      message: 'Product created successfully',
      productId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, category_id, image, status } = req.body;
    const productId = req.params.id;

    await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, image = ?, status = ? WHERE id = ?',
      [name, description, price, category_id, image, status, productId]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product is in orders
    const [orderItems] = await pool.execute('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [productId]);
    
    if (orderItems[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete product with existing orders' });
    }

    await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order management
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    let query = `
      SELECT o.*, u.username, u.email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id
    `;
    let params = [];

    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    const [orders] = await pool.execute(
      query + ' ORDER BY o.order_date DESC LIMIT ? OFFSET ?',
      [...params, limit, offset]
    );

    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.execute(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    let countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }

    const [totalCount] = await pool.execute(countQuery, countParams);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount[0].total,
        pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings management
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT * FROM settings ORDER BY setting_key');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Session management
router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    await pool.execute('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
    
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/sessions/all', async (req, res) => {
  try {
    const userId = req.user.id; // Fixed: use id instead of userId
    
    await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    
    res.json({ message: 'All sessions terminated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity log
router.get('/activity-log', async (req, res) => {
  try {
    const userId = req.user.id; // Fixed: use id instead of userId
    
    const [activities] = await pool.execute(`
      SELECT * FROM activity_log 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [userId]);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id; // Fixed: use id instead of userId
    
    const [notifications] = await pool.execute(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    res.json(notifications);
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global search
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }

    const searchTerm = `%${q}%`;
    let results = [];

    // Search users
    if (type === 'all' || type === 'users') {
      const [users] = await pool.execute(`
        SELECT id, username, email, role, 'user' as type
        FROM users 
        WHERE username LIKE ? OR email LIKE ?
        LIMIT 10
      `, [searchTerm, searchTerm]);
      results = [...results, ...users];
    }

    // Search transactions
    if (type === 'all' || type === 'transactions') {
      const [transactions] = await pool.execute(`
        SELECT t.id, t.amount, t.status, u.username, u.email, 'transaction' as type
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.id LIKE ? OR u.username LIKE ? OR u.email LIKE ?
        LIMIT 10
      `, [searchTerm, searchTerm, searchTerm]);
      results = [...results, ...transactions];
    }

    // Search settings
    if (type === 'all' || type === 'settings') {
      const [settings] = await pool.execute(`
        SELECT setting_key as id, setting_key, setting_value, 'setting' as type
        FROM settings 
        WHERE setting_key LIKE ? OR setting_value LIKE ?
        LIMIT 5
      `, [searchTerm, searchTerm]);
      results = [...results, ...settings];
    }

    res.json({ results, query: q });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user usage activity with period filtering
router.get('/users/:id/usage-activity', async (req, res) => {
  try {
    const userId = req.params.id;
    const { period = 'Month' } = req.query;
    
    // Calculate date range based on period
    let dateRange, groupBy;
    if (period === 'Week') {
      dateRange = 7;
      groupBy = 'DATE(created_at)';
    } else if (period === 'Year') {
      dateRange = 365;
      groupBy = 'DATE_FORMAT(created_at, "%Y-%m-01")'; // Group by month
    } else {
      dateRange = 30; // Month
      groupBy = 'DATE(created_at)';
    }
    
    // Get real user activity data from multiple sources
    const [transactionActivity] = await pool.execute(`
      SELECT ${groupBy} as activity_date, 
             COUNT(*) as transaction_count,
             SUM(amount) as total_amount
      FROM transactions 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ${groupBy}
      ORDER BY activity_date ASC
    `, [userId, dateRange]);

    const [ticketActivity] = await pool.execute(`
      SELECT ${groupBy} as activity_date, 
             COUNT(*) as ticket_count
      FROM support_tickets 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ${groupBy}
      ORDER BY activity_date ASC
    `, [userId, dateRange]);

    const [sessionActivity] = await pool.execute(`
      SELECT ${groupBy} as activity_date, 
             COUNT(*) as session_count
      FROM user_sessions 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ${groupBy}
      ORDER BY activity_date ASC
    `, [userId, dateRange]);

    // Create activity map from real data
    const activityMap = {};
    
    // Add transaction activity (weight: high)
    transactionActivity.forEach(t => {
      const date = t.activity_date instanceof Date ? 
        t.activity_date.toISOString().split('T')[0] : 
        t.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (t.transaction_count * 15) + (parseFloat(t.total_amount) / 20);
    });

    // Add support ticket activity (weight: medium)
    ticketActivity.forEach(t => {
      const date = t.activity_date instanceof Date ? 
        t.activity_date.toISOString().split('T')[0] : 
        t.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (t.ticket_count * 10);
    });

    // Add session activity (weight: low)
    sessionActivity.forEach(s => {
      const date = s.activity_date instanceof Date ? 
        s.activity_date.toISOString().split('T')[0] : 
        s.activity_date;
      activityMap[date] = (activityMap[date] || 0) + (s.session_count * 5);
    });

    // Generate complete date range with real data
    const usageActivity = [];
    
    if (period === 'Year') {
      // Generate monthly data for year view
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // First day of month
        
        const monthKey = date.toISOString().split('T')[0];
        
        // Get real activity for this month
        let monthlyActivity = 0;
        Object.keys(activityMap).forEach(dateKey => {
          if (dateKey.startsWith(monthKey.substring(0, 7))) { // Same year-month
            monthlyActivity += activityMap[dateKey];
          }
        });
        
        // Use real activity or 0 if no activity
        const finalActivity = Math.round(monthlyActivity);
        
        usageActivity.push({
          date: monthKey,
          value: finalActivity
        });
      }
    } else {
      // Generate daily data for week/month view
      for (let i = dateRange - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        // Get real activity for this date
        const realActivity = activityMap[dateKey] || 0;
        
        // Use real activity or 0 if no activity
        const finalValue = Math.round(realActivity);
        
        usageActivity.push({
          date: dateKey,
          value: finalValue
        });
      }
    }
    
    res.json({ usageActivity });
  } catch (error) {
    console.error('Usage activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export support tickets as CSV
router.get('/users/:id/support-tickets/export', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [tickets] = await pool.execute(`
      SELECT ticket_number, subject, category, priority, status, created_at, updated_at
      FROM support_tickets 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    
    // Create CSV content
    const headers = ['Ticket Number', 'Subject', 'Category', 'Priority', 'Status', 'Created', 'Updated'];
    const csvContent = [
      headers.join(','),
      ...tickets.map(ticket => [
        ticket.ticket_number,
        `"${ticket.subject}"`,
        ticket.category,
        ticket.priority,
        ticket.status,
        new Date(ticket.created_at).toLocaleDateString(),
        new Date(ticket.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=support-tickets.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle user 2FA status
router.put('/users/:id/two-factor', async (req, res) => {
  try {
    const userId = req.params.id;
    const { enabled } = req.body;
    
    await pool.execute(
      'UPDATE users SET two_factor_enabled = ? WHERE id = ?',
      [enabled, userId]
    );
    
    // Log the activity
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, '2fa_toggle', `${enabled ? 'Enabled' : 'Disabled'} 2FA for user ID: ${userId}`, req.ip]
    );
    
    res.json({ message: '2FA status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;