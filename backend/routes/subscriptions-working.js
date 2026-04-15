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
      WHERE status = "cancelled" 
      AND MONTH(updated_at) = MONTH(NOW()) 
      AND YEAR(updated_at) = YEAR(NOW())
    `);
    
    // Calculate churn rate
    const churnRate = totalSubs[0].count > 0 ? 
      ((canceledMTD[0].count / totalSubs[0].count) * 100).toFixed(1) : 0;

    // Get plan distribution
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

    // Get revenue growth data - include current month
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

    // Start with base query
    let baseQuery = `
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
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
    `;

    // Build WHERE conditions
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
    } else if (startDate) {
      whereConditions.push('DATE(s.created_at) >= ?');
      queryParams.push(startDate);
    } else if (endDate) {
      whereConditions.push('DATE(s.created_at) <= ?');
      queryParams.push(endDate);
    }

    // Build the complete query with parameters directly
    let finalQuery = baseQuery;
    let finalCountQuery = countQuery;
    
    // Add WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      finalQuery += whereClause;
      finalCountQuery += whereClause;
      
      // Replace placeholders with actual values
      let paramIndex = 0;
      for (const param of queryParams) {
        const escapedParam = pool.escape(param);
        finalQuery = finalQuery.replace('?', escapedParam);
        finalCountQuery = finalCountQuery.replace('?', escapedParam);
      }
    }

    // Add ORDER BY and LIMIT to main query
    finalQuery += ` ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    console.log('🔍 Final Query:', finalQuery);
    console.log('🔍 Final Count Query:', finalCountQuery);

    // Execute both queries
    const [subscriptions] = await pool.query(finalQuery);
    const [totalCount] = await pool.query(finalCountQuery);

    console.log(`📋 Found ${subscriptions.length} subscriptions after filtering`);
    console.log(`📊 Total count: ${totalCount[0].total}`);

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

// Create new subscription
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new subscription...');
    
    const { userEmail, planId, billingCycle } = req.body;
    
    // Validate required fields
    if (!userEmail || !planId || !billingCycle) {
      return res.status(400).json({ 
        error: 'Missing required fields: userEmail, planId, billingCycle' 
      });
    }
    
    // Check if user exists, if not create one
    let [users] = await pool.query('SELECT id FROM users WHERE email = ?', [userEmail]);
    let userId;
    
    if (users.length === 0) {
      // Create new user
      const username = userEmail.split('@')[0];
      const [newUser] = await pool.query(
        'INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [username, userEmail, 'defaultpassword', 'user']
      );
      userId = newUser.insertId;
      console.log(`✅ Created new user: ${userEmail}`);
    } else {
      userId = users[0].id;
      console.log(`✅ Found existing user: ${userEmail}`);
    }
    
    // Get plan details
    const [plans] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
    if (plans.length === 0) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }
    
    const plan = plans[0];
    const amount = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
    
    // Calculate dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }
    
    // Create subscription
    const [newSubscription] = await pool.query(`
      INSERT INTO subscriptions 
      (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, next_payment_date, amount, created_at, updated_at)
      VALUES (?, ?, 'active', ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      userId, planId, billingCycle, 
      currentPeriodStart, currentPeriodEnd, currentPeriodEnd, amount
    ]);
    
    console.log(`✅ Created subscription ID: ${newSubscription.insertId}`);
    
    // Create initial transaction for the new subscription
    await pool.query(`
      INSERT INTO transactions 
      (user_id, subscription_id, amount, status, transaction_date, description)
      VALUES (?, ?, ?, 'successful', NOW(), ?)
    `, [
      userId, newSubscription.insertId, amount, 
      `Initial payment for ${plan.name} (${billingCycle})`
    ]);
    
    console.log(`✅ Created initial transaction for subscription`);
    
    // Return the created subscription with user and plan details
    const [createdSub] = await pool.query(`
      SELECT 
        s.id, s.status, s.billing_cycle, s.next_payment_date, s.amount, s.created_at,
        u.username as user_name, u.email as user_email,
        p.name as plan_name, p.monthly_price, p.yearly_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [newSubscription.insertId]);
    
    const subscription = createdSub[0];
    const initials = subscription.user_name.split(' ').map(n => n[0]).join('').toUpperCase();
    const price = subscription.billing_cycle === 'monthly' ? 
      `$${subscription.monthly_price}/mo` : 
      `$${subscription.yearly_price}/yr`;
    
    const formattedSubscription = {
      id: subscription.id,
      user: { 
        name: subscription.user_name, 
        email: subscription.user_email, 
        initials 
      },
      plan: { 
        name: subscription.plan_name, 
        price 
      },
      status: subscription.status,
      billingCycle: subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1),
      nextPayment: subscription.next_payment_date ? 
        new Date(subscription.next_payment_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : 'N/A'
    };
    
    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: formattedSubscription
    });
    
  } catch (error) {
    console.error('❌ Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;