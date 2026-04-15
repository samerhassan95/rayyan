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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const billingCycle = req.query.billingCycle || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (billingCycle && billingCycle !== 'all' && billingCycle !== '') {
      whereClause += ' AND s.billing_cycle = ?';
      params.push(billingCycle.toLowerCase());
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status.toLowerCase());
    }

    if (startDate && endDate) {
      whereClause += ' AND s.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    }

    const [subscriptions] = await pool.execute(`
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
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Get total count
    const [totalCount] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ${whereClause}
    `);

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
    res.status(500).json({ error: error.message });
  }
});

// Create new subscription
router.post('/', async (req, res) => {
  try {
    const { userId, planId, billingCycle } = req.body;
    
    // Get plan details
    const [plans] = await pool.execute('SELECT * FROM plans WHERE id = ?', [planId]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = plans[0];
    const amount = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
    
    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    const nextPaymentDate = new Date();
    
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    const [result] = await pool.execute(`
      INSERT INTO subscriptions (user_id, plan_id, billing_cycle, current_period_start, current_period_end, next_payment_date, amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, planId, billingCycle, currentPeriodStart, currentPeriodEnd, nextPaymentDate, amount]);
    
    res.status(201).json({ 
      message: 'Subscription created successfully',
      subscriptionId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subscription status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const subscriptionId = req.params.id;

    await pool.execute(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      [status, subscriptionId]
    );

    res.json({ message: 'Subscription status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.delete('/:id', async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    await pool.execute(
      'UPDATE subscriptions SET status = "cancelled" WHERE id = ?',
      [subscriptionId]
    );

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;