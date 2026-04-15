const pool = require('./config/database');

async function testRoute() {
  try {
    console.log('Testing route logic with query...');
    
    // Test with query instead of execute
    const baseQuery = `
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
      ORDER BY s.created_at DESC LIMIT 10 OFFSET 0
    `;
    
    console.log('Query:', baseQuery);
    
    const [subscriptions] = await pool.query(baseQuery);
    
    console.log('✅ Query successful!');
    console.log('Results:', subscriptions.length);
    console.log('First result:', subscriptions[0]);
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

testRoute();