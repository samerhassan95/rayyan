const pool = require('./backend/config/database');

async function addTransactionForUser27() {
  try {
    console.log('💰 Adding transaction for User ID 27...\n');

    // Check if user 27 exists
    const [users] = await pool.execute('SELECT * FROM users WHERE id = 27');
    if (users.length === 0) {
      console.log('❌ User ID 27 not found');
      return;
    }

    console.log(`✅ Found user: ${users[0].username} (${users[0].email})`);

    // Get user's subscription
    const [subscriptions] = await pool.execute('SELECT * FROM subscriptions WHERE user_id = 27 LIMIT 1');
    let subscriptionId = null;
    
    if (subscriptions.length > 0) {
      subscriptionId = subscriptions[0].id;
      console.log(`✅ Found subscription ID: ${subscriptionId}`);
    } else {
      console.log('⚠️  No subscription found, creating transaction without subscription');
    }

    // Add a transaction for this user
    const amount = 79.00; // Professional plan price
    const [result] = await pool.execute(`
      INSERT INTO transactions 
      (user_id, subscription_id, amount, status, transaction_date, description)
      VALUES (?, ?, ?, 'successful', NOW(), ?)
    `, [
      27, 
      subscriptionId, 
      amount, 
      'Payment for Professional plan'
    ]);

    console.log(`✅ Created transaction ID: ${result.insertId}`);
    console.log(`💰 Amount: $${amount}`);

    // Add another transaction from last month
    const [result2] = await pool.execute(`
      INSERT INTO transactions 
      (user_id, subscription_id, amount, status, transaction_date, description)
      VALUES (?, ?, ?, 'successful', DATE_SUB(NOW(), INTERVAL 1 MONTH), ?)
    `, [
      27, 
      subscriptionId, 
      amount, 
      'Previous month payment for Professional plan'
    ]);

    console.log(`✅ Created historical transaction ID: ${result2.insertId}`);

    // Add a support ticket for this user
    const ticketNumber = `TKT-${Date.now()}`;
    const [ticketResult] = await pool.execute(`
      INSERT INTO support_tickets 
      (user_id, ticket_number, subject, category, priority, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      27,
      ticketNumber,
      'Account access issue',
      'technical',
      'medium',
      'open',
      'User having trouble accessing dashboard features'
    ]);

    console.log(`✅ Created support ticket: ${ticketNumber}`);

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Added 2 transactions totaling $158.00');
    console.log('✅ Added 1 support ticket');
    console.log('✅ User 27 now has real activity data');
    console.log('\nRefresh the user detail page to see the updated statistics!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTransactionForUser27();