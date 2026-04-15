const pool = require('./config/database');

async function testRoute() {
  try {
    console.log('Testing route logic...');
    
    // Test the exact query from the route
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
      ORDER BY s.created_at DESC LIMIT ? OFFSET ?
    `;

    const limit = 10;
    const offset = 0;
    
    console.log('Query:', baseQuery);
    console.log('Params:', [limit, offset]);
    
    const [subscriptions] = await pool.execute(baseQuery, [limit, offset]);
    
    console.log('✅ Query successful!');
    console.log('Results:', subscriptions.length);
    console.log('First result:', subscriptions[0]);
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

testRoute();