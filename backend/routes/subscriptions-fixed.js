const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get subscription analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get total subscriptions
    const [totalSubs] = await pool.execute('SELECT COUNT(*) as count FROM subscriptions');
    
    // Get active subscriptions
    const [activeSubs] = await pool.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    
    // Get canceled subscriptions this month
    const [canceledMTD] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE status = "cancelled" AND MONTH(updated_at) = MONTH(NOW()) AND YEAR(updated_at) = YEAR(NOW())
    `);
    
    // Calculate churn rate (canceled / total active at start of month)
    const churnRate = totalSubs[0].count > 0 ? 
      ((canceledMTD[0].count / totalSubs[0].count) * 100).toFixed(1) : 0;

    // Get plan distribution with real percentages
    const [planDist] = await pool.execute(`
      SELECT p.name, COUNT(s.id) as count,
             ROUND((COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')), 0) as percentage
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id, p.name
      HAVING COUNT(s.id) > 0
      ORDER BY count DESC
    `);

    const planDistribution = {};
    planDist.forEach(plan => {
      planDistribution[plan.name] = plan.percentage || 0;
    });

    // Get revenue growth data (last 6 months) from real transactions
    const [revenueGrowth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(transaction_date, '%b') as month,
        SUM(amount) as revenue
      FROM transactions 
      WHERE status = 'successful' 
      AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), DATE_FORMAT(transaction_date, '%b')
      ORDER BY DATE_FORMAT(transaction_date, '%Y-%m')
    `);

    // Format revenue growth data
    const formattedRevenueGrowth = revenueGrowth.map(item => ({
      month: item.month.toUpperCase(),
      revenue: parseFloat(item.revenue)
    }));

    const analytics = {
      totalSubscriptions: totalSubs[0].count || 0,
      activePlans: activeSubs[0].count || 0,
      canceledMTD: canceledMTD[0].count || 0,
      churnRate: parseFloat(churnRate) || 0,
      planDistribution,
      revenueGrowth: formattedRevenueGrowth.length > 0 ? formattedRevenueGrowth : []
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscriptions with filters
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching subscriptions with filters...');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const billingCycle = req.query.billingCycle || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    console.log('🔍 Filters:', { billingCycle, status, startDate, endDate, page });

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (billingCycle && billingCycle !== '' && billingCycle !== 'all') {
      whereConditions.push('s.billing_cycle = ?');
      queryParams.push(billingCycle.toLowerCase());
    }

    if (status && status !== '') {
      whereConditions.push('s.status = ?');
      queryParams.push(status.toLowerCase());
    }

    if (startDate && endDate) {
      whereConditions.push('DATE(s.created_at) BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    }

    const whereClause = whereConditions.length > 0 ? 
      'WHERE ' + whereConditions.join(' AND ') : '';

    // Get filtered subscriptions
    const subscriptionsQuery = `
      SELECT 
        s.id,
        s.status,
        s.billing_cycle,
        s.next_payment_date,
        s.amount,
        s.created_at,
        u.username as user_name,
        u.email as user_email,
        p.name as plan_name,
        p.monthly_price,
        p.yearly_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 SQL Query:', subscriptionsQuery);
    console.log('🔍 Query Params:', [...queryParams, limit, offset]);

    console.log('🔍 SQL Query:', subscriptionsQuery);
    console.log('🔍 Query Params:', [...queryParams, limit, offset]);

    const [subscriptions] = await pool.execute(subscriptionsQuery, [...queryParams, limit, offset]);

    console.log(`📋 Found ${subscriptions.length} subscriptions after filtering`);

    // Get total count with same filters
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ${whereClause}
    `;

    const [totalCount] = await pool.execute(countQuery, queryParams);

    // Format subscriptions data
    const formattedSubscriptions = subscriptions.map(sub => {
      const initials = sub.user_name.split(' ').map(n => n[0]).join('').toUpperCase();
      const price = sub.billing_cycle === 'monthly' ? 
        `$${sub.monthly_price}/mo` : 
        `$${sub.yearly_price}/yr`;
      
      return {
        id: sub.id,
        user: { 
          name: sub.user_name, 
          email: sub.user_email, 
          initials 
        },
        plan: { 
          name: sub.plan_name, 
          price 
        },
        status: sub.status,
        billingCycle: sub.billing_cycle.charAt(0).toUpperCase() + sub.billing_cycle.slice(1),
        nextPayment: sub.next_payment_date ? 
          new Date(sub.next_payment_date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : 'N/A'
      };
    });

    console.log('✅ Subscriptions formatted successfully');

    res.json({
      subscriptions: formattedSubscriptions,
      pagination: {
        page,
        limit,
        total: totalCount[0].total,
        pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Subscriptions API error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;