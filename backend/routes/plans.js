const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all pricing plans
router.get('/', async (req, res) => {
  try {
    const [plans] = await pool.execute(`
      SELECT * FROM plans WHERE status = 'active' ORDER BY monthly_price ASC
    `);

    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      monthlyPrice: parseFloat(plan.monthly_price),
      yearlyPrice: parseFloat(plan.yearly_price),
      description: plan.description,
      features: plan.features ? JSON.parse(plan.features) : [],
      recommended: plan.recommended,
      buttonText: plan.recommended ? 'Upgrade to Pro' : 
                 plan.name === 'Enterprise' ? 'Contact Sales' : `Configure ${plan.name}`,
      buttonStyle: plan.recommended ? 'primary' : 'secondary'
    }));

    res.json(formattedPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get plan analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get total monthly revenue from active subscriptions
    const [monthlyRevenue] = await pool.execute(`
      SELECT SUM(
        CASE 
          WHEN s.billing_cycle = 'monthly' THEN s.amount
          WHEN s.billing_cycle = 'yearly' THEN s.amount / 12
          ELSE 0
        END
      ) as total
      FROM subscriptions s
      WHERE s.status = 'active'
    `);

    // Get active subscriptions count
    const [activeSubscriptions] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'
    `);

    // Get professional tier percentage
    const [professionalSubs] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active' AND p.name = 'Professional'
    `);

    const professionalPercentage = activeSubscriptions[0].count > 0 ? 
      Math.round((professionalSubs[0].count / activeSubscriptions[0].count) * 100) : 0;

    // Calculate churn rate (simplified)
    const [canceledThisMonth] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE status = 'cancelled' 
      AND MONTH(updated_at) = MONTH(NOW()) 
      AND YEAR(updated_at) = YEAR(NOW())
    `);

    const churnRate = activeSubscriptions[0].count > 0 ? 
      ((canceledThisMonth[0].count / activeSubscriptions[0].count) * 100).toFixed(1) : 0;

    const analytics = {
      totalMonthlyRevenue: parseFloat(monthlyRevenue[0].total) || 0,
      revenueGrowth: 12, // Mock for now
      activeSubscriptions: activeSubscriptions[0].count || 0,
      professionalTierPercentage: professionalPercentage,
      churnRate: parseFloat(churnRate),
      industryAverageChurn: 2.3
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new plan
router.post('/', async (req, res) => {
  try {
    const { name, tier, monthlyPrice, yearlyPrice, description, features } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO plans (name, tier, monthly_price, yearly_price, description, features) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, tier, monthlyPrice, yearlyPrice, description, JSON.stringify(features)]);

    const newPlan = {
      id: result.insertId,
      name,
      tier,
      monthlyPrice,
      yearlyPrice,
      description,
      features,
      recommended: false,
      created_at: new Date()
    };

    res.status(201).json({ 
      message: 'Plan created successfully',
      plan: newPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update plan
router.put('/:id', async (req, res) => {
  try {
    const planId = req.params.id;
    const { name, tier, monthlyPrice, yearlyPrice, description, features, recommended } = req.body;

    await pool.execute(`
      UPDATE plans 
      SET name = ?, tier = ?, monthly_price = ?, yearly_price = ?, description = ?, features = ?, recommended = ?
      WHERE id = ?
    `, [name, tier, monthlyPrice, yearlyPrice, description, JSON.stringify(features), recommended, planId]);

    res.json({ 
      message: 'Plan updated successfully',
      planId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete plan
router.delete('/:id', async (req, res) => {
  try {
    const planId = req.params.id;

    // Check if plan has active subscriptions
    const [activeSubscriptions] = await pool.execute(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = "active"', 
      [planId]
    );

    if (activeSubscriptions[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan with active subscriptions' 
      });
    }

    await pool.execute('UPDATE plans SET status = "inactive" WHERE id = ?', [planId]);

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get discount codes
router.get('/discount-codes', async (req, res) => {
  try {
    const [codes] = await pool.execute(`
      SELECT * FROM discount_codes ORDER BY created_at DESC
    `);

    const formattedCodes = codes.map(code => ({
      id: code.id,
      code: code.code,
      discount: parseFloat(code.discount_value),
      type: code.discount_type,
      active: code.active,
      usageCount: code.usage_count,
      maxUsage: code.max_usage,
      expiresAt: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : null
    }));

    res.json(formattedCodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create discount code
router.post('/discount-codes', async (req, res) => {
  try {
    const { code, discount, type, maxUsage, expiresAt } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO discount_codes (code, discount_value, discount_type, max_usage, expires_at) 
      VALUES (?, ?, ?, ?, ?)
    `, [code, discount, type, maxUsage, expiresAt]);

    const newCode = {
      id: result.insertId,
      code,
      discount,
      type,
      active: true,
      usageCount: 0,
      maxUsage,
      expiresAt,
      created_at: new Date()
    };

    res.status(201).json({ 
      message: 'Discount code created successfully',
      discountCode: newCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;