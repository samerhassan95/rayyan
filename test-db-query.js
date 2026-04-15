const pool = require('./backend/config/database');

async function testQueries() {
  try {
    console.log('Testing basic database queries...');
    
    const [result1] = await pool.execute('SELECT COUNT(*) as count FROM subscriptions');
    console.log('✅ Basic count query works:', result1[0]);
    
    const [result2] = await pool.execute(`
      SELECT s.id, u.username, p.name 
      FROM subscriptions s 
      JOIN users u ON s.user_id = u.id 
      JOIN plans p ON s.plan_id = p.id 
      LIMIT 1
    `);
    console.log('✅ Join query works:', result2[0]);
    
    // Test the problematic query with parameters
    const [result3] = await pool.execute(`
      SELECT s.id, u.username, p.name 
      FROM subscriptions s 
      JOIN users u ON s.user_id = u.id 
      JOIN plans p ON s.plan_id = p.id 
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [10, 0]);
    console.log('✅ Parameterized query works:', result3.length, 'results');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  }
  process.exit(0);
}

testQueries();