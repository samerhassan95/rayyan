const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    database: process.env.DB_NAME || 'rayyan'
  });

  const [users] = await connection.execute(`
    SELECT u.id, u.username, 
           COUNT(DISTINCT t.id) as transactions,
           COUNT(DISTINCT s.id) as subscriptions,
           COUNT(DISTINCT st.id) as tickets
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id
    LEFT JOIN subscriptions s ON u.id = s.user_id  
    LEFT JOIN support_tickets st ON u.id = st.user_id
    WHERE u.role = 'user'
    GROUP BY u.id
    HAVING transactions > 0 OR subscriptions > 0 OR tickets > 0
    ORDER BY (transactions + subscriptions + tickets) DESC
    LIMIT 5
  `);

  console.log('Users with data:');
  users.forEach(user => {
    console.log(`  ${user.username} (ID: ${user.id}): ${user.transactions} transactions, ${user.subscriptions} subscriptions, ${user.tickets} tickets`);
  });

  await connection.end();
}

checkUserData().catch(console.error);