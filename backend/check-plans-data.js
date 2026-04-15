const pool = require('./config/database');

async function checkPlansData() {
  try {
    console.log('🔍 Checking plans data...\n');
    
    // Check all plans
    const [plans] = await pool.query('SELECT * FROM plans');
    console.log('📋 All plans in database:');
    plans.forEach(plan => {
      console.log(`- ID: ${plan.id}, Name: "${plan.name}", Monthly: $${plan.monthly_price}, Yearly: $${plan.yearly_price}`);
    });
    
    // Check subscriptions by plan
    console.log('\n📊 Subscriptions by plan:');
    const [subsByPlan] = await pool.query(`
      SELECT p.name, COUNT(s.id) as count, s.status
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name, s.status
      ORDER BY p.name, s.status
    `);
    
    subsByPlan.forEach(row => {
      console.log(`- ${row.name}: ${row.count} ${row.status || 'total'} subscriptions`);
    });
    
    // Check active subscriptions only
    console.log('\n✅ Active subscriptions by plan:');
    const [activeSubs] = await pool.query(`
      SELECT p.name, COUNT(s.id) as count
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id, p.name
      HAVING COUNT(s.id) > 0
      ORDER BY count DESC
    `);
    
    activeSubs.forEach(row => {
      console.log(`- ${row.name}: ${row.count} active subscriptions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPlansData();