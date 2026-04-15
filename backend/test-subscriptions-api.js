const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSubscriptionsAPI() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'samerhassan11',
      database: process.env.DB_NAME || 'rayyan'
    });

    console.log('🔍 Testing Subscriptions API Data...\n');

    // Test subscriptions count
    const [totalSubs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions');
    console.log('📊 Total subscriptions:', totalSubs[0].count);

    // Test active subscriptions
    const [activeSubs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    console.log('✅ Active subscriptions:', activeSubs[0].count);

    // Test cancelled subscriptions
    const [cancelledSubs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "cancelled"');
    console.log('❌ Cancelled subscriptions:', cancelledSubs[0].count);

    // Test past due subscriptions
    const [pastDueSubs] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "past_due"');
    console.log('⚠️ Past due subscriptions:', pastDueSubs[0].count);

    // Test plan distribution
    console.log('\n📈 Plan Distribution:');
    const [planDist] = await connection.execute(`
      SELECT p.name, COUNT(s.id) as count,
             ROUND((COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')), 0) as percentage
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id, p.name
      HAVING COUNT(s.id) > 0
      ORDER BY count DESC
    `);

    planDist.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.count} subscriptions (${plan.percentage}%)`);
    });

    // Test transactions for revenue
    console.log('\n💰 Revenue Data:');
    const [revenueData] = await connection.execute(`
      SELECT 
        DATE_FORMAT(transaction_date, '%b') as month,
        SUM(amount) as revenue,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE status = 'successful' 
      AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), DATE_FORMAT(transaction_date, '%b')
      ORDER BY DATE_FORMAT(transaction_date, '%Y-%m')
    `);

    revenueData.forEach(month => {
      console.log(`  - ${month.month.toUpperCase()}: $${parseFloat(month.revenue).toFixed(2)} (${month.transaction_count} transactions)`);
    });

    // Test sample subscriptions with user data
    console.log('\n👥 Sample Subscriptions:');
    const [sampleSubs] = await connection.execute(`
      SELECT 
        s.id,
        s.status,
        s.billing_cycle,
        s.next_payment_date,
        u.username as user_name,
        u.email as user_email,
        p.name as plan_name,
        p.monthly_price,
        p.yearly_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    sampleSubs.forEach(sub => {
      const price = sub.billing_cycle === 'monthly' ? 
        `$${sub.monthly_price}/mo` : 
        `$${sub.yearly_price}/yr`;
      console.log(`  - ${sub.user_name} (${sub.user_email}): ${sub.plan_name} ${price} - ${sub.status}`);
    });

    await connection.end();
    console.log('\n✅ Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testSubscriptionsAPI();