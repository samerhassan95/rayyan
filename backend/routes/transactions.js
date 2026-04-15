const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get transaction analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    console.log('📊 Analytics filters:', { period, startDate, endDate });

    // Build date filter for analytics
    let dateFilter = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND DATE(transaction_date) BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } else {
      // Default to current month if no dates provided
      dateFilter = 'AND MONTH(transaction_date) = MONTH(NOW()) AND YEAR(transaction_date) = YEAR(NOW())';
    }

    // Get total revenue
    const [totalRevenue] = await pool.execute(`
      SELECT SUM(amount) as total FROM transactions WHERE status = 'successful'
    `);
    
    // Get monthly volume (with date filter)
    const [monthlyVolume] = await pool.execute(`
      SELECT SUM(amount) as total FROM transactions 
      WHERE status = 'successful' ${dateFilter}
    `, dateParams);
    
    // Get failed transaction percentage
    const [totalTransactions] = await pool.execute('SELECT COUNT(*) as count FROM transactions');
    const [failedTransactions] = await pool.execute('SELECT COUNT(*) as count FROM transactions WHERE status = "failed"');
    
    const failureRate = totalTransactions[0].count > 0 ? 
      ((failedTransactions[0].count / totalTransactions[0].count) * 100).toFixed(1) : 0;

    // Get revenue growth (compare current month to previous month)
    const [currentMonthRevenue] = await pool.execute(`
      SELECT SUM(amount) as total FROM transactions 
      WHERE status = 'successful' 
      AND MONTH(transaction_date) = MONTH(NOW()) 
      AND YEAR(transaction_date) = YEAR(NOW())
    `);
    
    const [previousMonthRevenue] = await pool.execute(`
      SELECT SUM(amount) as total FROM transactions 
      WHERE status = 'successful' 
      AND MONTH(transaction_date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND YEAR(transaction_date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    const revenueGrowth = previousMonthRevenue[0].total > 0 ? 
      (((currentMonthRevenue[0].total - previousMonthRevenue[0].total) / previousMonthRevenue[0].total) * 100).toFixed(1) : 0;

    // Get revenue data based on period
    let groupBy, orderBy, dateFormat;
    let intervalFilter = '';
    
    switch (period.toLowerCase()) {
      case 'daily':
        groupBy = 'DATE(transaction_date)';
        orderBy = 'DATE(transaction_date)';
        dateFormat = 'DATE(transaction_date)';
        intervalFilter = startDate && endDate ? 
          `AND DATE(transaction_date) BETWEEN '${startDate}' AND '${endDate}'` :
          'AND transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'weekly':
        groupBy = 'YEARWEEK(transaction_date)';
        orderBy = 'YEARWEEK(transaction_date)';
        dateFormat = 'DATE(transaction_date)';
        intervalFilter = startDate && endDate ? 
          `AND DATE(transaction_date) BETWEEN '${startDate}' AND '${endDate}'` :
          'AND transaction_date >= DATE_SUB(NOW(), INTERVAL 4 WEEK)';
        break;
      case 'monthly':
        groupBy = 'DATE_FORMAT(transaction_date, "%Y-%m")';
        orderBy = 'DATE_FORMAT(transaction_date, "%Y-%m")';
        dateFormat = 'DATE(transaction_date)';
        intervalFilter = startDate && endDate ? 
          `AND DATE(transaction_date) BETWEEN '${startDate}' AND '${endDate}'` :
          'AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)';
        break;
      default:
        groupBy = 'DATE(transaction_date)';
        orderBy = 'DATE(transaction_date)';
        dateFormat = 'DATE(transaction_date)';
        intervalFilter = 'AND transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    const [revenueData] = await pool.execute(`
      SELECT 
        ${groupBy} as group_key,
        SUM(amount) as amount,
        MIN(${dateFormat}) as transaction_date
      FROM transactions 
      WHERE status = 'successful' ${intervalFilter}
      GROUP BY ${groupBy}
      ORDER BY MIN(${dateFormat}) DESC
      LIMIT 10
    `);

    // Format the revenue data
    const formattedRevenueData = revenueData.map(item => ({
      date: new Date(item.transaction_date).toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short' 
      }).toUpperCase(),
      amount: parseFloat(item.amount)
    }));

    const analytics = {
      totalRevenue: parseFloat(totalRevenue[0].total) || 0,
      monthlyVolume: parseFloat(monthlyVolume[0].total) || 0,
      failedTransactions: parseFloat(failureRate) || 0,
      revenueGrowth: parseFloat(revenueGrowth) || 0,
      volumeGrowth: 8.2, // Mock for now
      failureChange: -2.4, // Mock for now
      revenueData: formattedRevenueData.length > 0 ? formattedRevenueData : [
        { date: '01 APR', amount: 15000 },
        { date: '05 APR', amount: 22000 },
        { date: '10 APR', amount: 18000 },
        { date: '15 APR', amount: 35000 },
        { date: '20 APR', amount: 28000 },
        { date: '25 APR', amount: 31000 },
        { date: '28 APR', amount: 25000 }
      ]
    };

    console.log('✅ Analytics result:', {
      totalRevenue: analytics.totalRevenue,
      monthlyVolume: analytics.monthlyVolume,
      revenueDataPoints: analytics.revenueData.length
    });

    res.json(analytics);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transactions with filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const paymentMethod = req.query.paymentMethod || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    console.log('🔍 Transaction filters:', { paymentMethod, status, startDate, endDate, page });

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status.toLowerCase());
    }

    if (paymentMethod) {
      whereClause += ' AND t.payment_method LIKE ?';
      params.push(`%${paymentMethod}%`);
    }

    if (startDate && endDate) {
      whereClause += ' AND DATE(t.transaction_date) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause += ' AND DATE(t.transaction_date) >= ?';
      params.push(startDate);
    } else if (endDate) {
      whereClause += ' AND DATE(t.transaction_date) <= ?';
      params.push(endDate);
    }

    const [transactions] = await pool.execute(`
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.payment_method,
        t.transaction_date,
        u.username as user_name,
        u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.transaction_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Get total count
    const [totalCount] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
    `, params);

    console.log(`✅ Found ${transactions.length} transactions, ${totalCount[0].total} total`);

    // Format transactions data
    const formattedTransactions = transactions.map(txn => {
      const initials = txn.user_name.split(' ').map(n => n[0]).join('').toUpperCase();
      
      return {
        id: txn.id,
        user: { 
          name: txn.user_name, 
          email: txn.user_email, 
          initials 
        },
        amount: parseFloat(txn.amount),
        date: new Date(txn.transaction_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        paymentMethod: txn.payment_method || 'N/A',
        status: txn.status
      };
    });

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount[0].total,
        pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Transactions query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export transaction report
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const dateRange = req.query.dateRange || '';

    // In a real app, this would generate and return a file
    res.json({ 
      message: 'Export initiated',
      downloadUrl: '/downloads/transactions-export.csv',
      format
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction details
router.get('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const [transactions] = await pool.execute(`
      SELECT 
        t.*,
        u.username as user_name,
        u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [transactionId]);

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const txn = transactions[0];
    const transaction = {
      id: txn.id,
      user: { name: txn.user_name, email: txn.user_email },
      amount: parseFloat(txn.amount),
      date: new Date(txn.transaction_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      paymentMethod: txn.payment_method || 'N/A',
      status: txn.status,
      description: txn.description || 'Payment transaction',
      fees: parseFloat(txn.fees) || 0,
      netAmount: parseFloat(txn.net_amount) || parseFloat(txn.amount),
      refundable: txn.status === 'successful' && !txn.refunded_at
    };

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process refund
router.post('/:id/refund', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { amount, reason } = req.body;

    // Update transaction with refund information
    await pool.execute(`
      UPDATE transactions 
      SET status = 'refunded', refunded_at = NOW(), refund_reason = ?
      WHERE id = ? AND status = 'successful'
    `, [reason, transactionId]);

    res.json({ 
      message: 'Refund processed successfully',
      refundId: `REF-${Date.now()}`,
      amount: parseFloat(amount)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;