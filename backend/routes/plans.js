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

    const formattedPlans = plans.map(plan => {
      let features = [];
      try {
        if (typeof plan.features === 'string') {
          features = JSON.parse(plan.features);
        } else if (Array.isArray(plan.features)) {
          features = plan.features;
        }
      } catch (e) {
        console.error('Error parsing features for plan', plan.id, e);
      }

      return {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        monthlyPrice: parseFloat(plan.monthly_price),
        yearlyPrice: parseFloat(plan.yearly_price),
        description: plan.description,
        features: features,
        recommended: plan.recommended,
        buttonText: plan.recommended ? 'Upgrade to Pro' : 
                   plan.name === 'Enterprise' ? 'Contact Sales' : `Configure ${plan.name}`,
        buttonStyle: plan.recommended ? 'primary' : 'secondary'
      };
    });

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
    console.log('Creating new plan. Body:', req.body);
    const { name, tier, monthlyPrice, yearlyPrice, description, features } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO plans (name, tier, monthly_price, yearly_price, description, features) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, tier, monthlyPrice, yearlyPrice, description, JSON.stringify(features)]);

    console.log('Plan created successfully. InsertId:', result.insertId);

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
    console.error('Error creating plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update plan
router.put('/:id', async (req, res) => {
  try {
    const planId = req.params.id;
    const { name, tier, monthlyPrice, yearlyPrice, description, features, recommended, status } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (tier !== undefined) { updates.push('tier = ?'); params.push(tier); }
    if (monthlyPrice !== undefined) { updates.push('monthly_price = ?'); params.push(monthlyPrice); }
    if (yearlyPrice !== undefined) { updates.push('yearly_price = ?'); params.push(yearlyPrice); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (features !== undefined) { updates.push('features = ?'); params.push(JSON.stringify(features)); }
    if (recommended !== undefined) { updates.push('recommended = ?'); params.push(recommended); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(planId);

    await pool.execute(`
      UPDATE plans 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, params);

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
      name: code.name || '',
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
    const { name, code, discount, type, maxUsage, expiresAt } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO discount_codes (name, code, discount_value, discount_type, max_usage, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, code, discount, type, maxUsage, expiresAt]);

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

// Update discount code
router.put('/discount-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, discount, type, maxUsage, expiresAt, active } = req.body;

    await pool.execute(`
      UPDATE discount_codes 
      SET name = ?, code = ?, discount_value = ?, discount_type = ?, max_usage = ?, expires_at = ?, active = ?
      WHERE id = ?
    `, [name, code, discount, type, maxUsage, expiresAt, active, id]);

    res.json({ message: 'Discount code updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete discount code
router.delete('/discount-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM discount_codes WHERE id = ?', [id]);
    res.json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;