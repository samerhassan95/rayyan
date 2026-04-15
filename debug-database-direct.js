const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'samerhassan11',
      database: 'rayyan'
    });
    
    console.log('✅ Database connected');
    
    // Test simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions');
    console.log('✅ Subscriptions count:', rows[0].count);
    
    // Test the problematic query
    const [subs] = await connection.execute(`
      SELECT 
        s.id,
        s.status,
        s.billing_cycle,
        u.username as user_name,
        u.email as user_email,
        p.name as plan_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    console.log('✅ Sample subscriptions:', subs.length);
    console.log('First subscription:', subs[0]);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabase();