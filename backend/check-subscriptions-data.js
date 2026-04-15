const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'admin_dashboard'
    });

    console.log('=== SUBSCRIPTIONS DATA ===');
    
    // Check subscriptions count
    const [subs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions');
    console.log('Total subscriptions:', subs[0].count);

    // Check active subscriptions
    const [activeSubs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    console.log('Active subscriptions:', activeSubs[0].count);

    // Check plans
    const [plans] = await connection.execute('SELECT * FROM plans LIMIT 5');
    console.log('Plans available:', plans.length);
    plans.forEach(plan => console.log(`- ${plan.name}: $${plan.monthly_price}/mo, $${plan.yearly_price}/yr`));

    // Sample subscriptions
    const [subsSample] = await connection.execute(`
      SELECT s.*, u.username, p.name as plan_name 
      FROM subscriptions s 
      JOIN users u ON s.user_id = u.id 
      JOIN plans p ON s.plan_id = p.id 
      LIMIT 5
    `);
    console.log('Sample subscriptions:', subsSample.length);
    subsSample.forEach(sub => {
      console.log(`- ${sub.username} -> ${sub.plan_name} (${sub.status})`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();