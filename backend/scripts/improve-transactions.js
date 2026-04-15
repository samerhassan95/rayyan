const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function improveTransactions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Update recent transactions with more realistic status distribution
    // Get the most recent 20 transactions
    const [recentTransactions] = await connection.execute(`
      SELECT id FROM transactions 
      ORDER BY transaction_date DESC 
      LIMIT 20
    `);

    const statuses = ['successful', 'pending', 'failed'];
    const statusWeights = [0.75, 0.15, 0.10]; // 75% successful, 15% pending, 10% failed

    for (const transaction of recentTransactions) {
      // Weighted random selection for status
      const random = Math.random();
      let status = 'successful';
      let cumulative = 0;
      
      for (let i = 0; i < statuses.length; i++) {
        cumulative += statusWeights[i];
        if (random <= cumulative) {
          status = statuses[i];
          break;
        }
      }
      
      await connection.execute(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, transaction.id]
      );
    }

    // Add some more recent transactions with varied data
    const [users] = await connection.execute('SELECT id FROM users WHERE role = "user" LIMIT 5');
    
    const newTransactions = [
      { amount: 299.99, status: 'successful' },
      { amount: 149.50, status: 'pending' },
      { amount: 89.99, status: 'successful' },
      { amount: 199.00, status: 'failed' },
      { amount: 399.99, status: 'successful' },
      { amount: 79.99, status: 'successful' },
      { amount: 249.50, status: 'pending' },
      { amount: 159.99, status: 'successful' }
    ];

    for (let i = 0; i < newTransactions.length && i < users.length; i++) {
      const transaction = newTransactions[i];
      const user = users[i % users.length];
      
      // Random date within last 7 days
      const daysAgo = Math.floor(Math.random() * 7);
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - daysAgo);
      
      await connection.execute(`
        INSERT INTO transactions (user_id, amount, status, transaction_date, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [user.id, transaction.amount, transaction.status, transactionDate, transactionDate]);
    }

    console.log('✅ Transaction data improved!');

    // Show current status distribution
    const [statusDistribution] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM transactions 
      WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 Recent Transaction Status Distribution (Last 30 days):');
    const total = statusDistribution.reduce((sum, item) => sum + item.count, 0);
    statusDistribution.forEach(item => {
      const percentage = Math.round((item.count / total) * 100);
      console.log(`   ${item.status}: ${item.count} transactions (${percentage}%)`);
    });

    // Show recent transactions sample
    const [recentSample] = await connection.execute(`
      SELECT t.id, t.amount, t.status, u.username, t.transaction_date
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.transaction_date DESC
      LIMIT 10
    `);

    console.log('\n📋 Recent Transactions Sample:');
    recentSample.forEach(t => {
      console.log(`   #${t.id}: $${t.amount} (${t.status}) - ${t.username} - ${t.transaction_date.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error improving transactions:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

improveTransactions();