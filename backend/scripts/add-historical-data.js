const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function addHistoricalData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Add users from previous months for growth calculation
    const historicalUsers = [
      { username: 'user_march_1', email: 'user1@march.com', month: 3, year: 2026 },
      { username: 'user_march_2', email: 'user2@march.com', month: 3, year: 2026 },
      { username: 'user_march_3', email: 'user3@march.com', month: 3, year: 2026 },
      { username: 'user_feb_1', email: 'user1@feb.com', month: 2, year: 2026 },
      { username: 'user_feb_2', email: 'user2@feb.com', month: 2, year: 2026 },
      { username: 'user_jan_1', email: 'user1@jan.com', month: 1, year: 2026 }
    ];

    for (const user of historicalUsers) {
      try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const createdAt = new Date(user.year, user.month - 1, Math.floor(Math.random() * 28) + 1);
        
        await connection.execute(`
          INSERT INTO users (username, email, password, role, acquisition_source, status, created_at) 
          VALUES (?, ?, ?, 'user', 'direct', 'active', ?)
        `, [user.username, user.email, hashedPassword, createdAt]);
      } catch (err) {
        if (!err.message.includes('Duplicate entry')) {
          console.error('Error adding historical user:', err.message);
        }
      }
    }

    // Add historical transactions for revenue growth
    const [users] = await connection.execute('SELECT id FROM users WHERE role = "user" LIMIT 10');
    
    const historicalTransactions = [
      { month: 3, year: 2026, count: 5, avgAmount: 150 },
      { month: 2, year: 2026, count: 3, avgAmount: 120 },
      { month: 1, year: 2026, count: 2, avgAmount: 100 }
    ];

    for (const period of historicalTransactions) {
      for (let i = 0; i < period.count; i++) {
        const user = users[i % users.length];
        const amount = period.avgAmount + (Math.random() * 100 - 50); // ±50 variation
        const day = Math.floor(Math.random() * 28) + 1;
        const transactionDate = new Date(period.year, period.month - 1, day);
        
        await connection.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, created_at) 
          VALUES (?, ?, 'successful', ?, ?)
        `, [user.id, amount.toFixed(2), transactionDate, transactionDate]);
      }
    }

    // Add historical subscriptions
    const historicalSubs = [
      { month: 3, year: 2026, count: 1 },
      { month: 2, year: 2026, count: 1 },
      { month: 1, year: 2026, count: 0 }
    ];

    for (const period of historicalSubs) {
      for (let i = 0; i < period.count; i++) {
        const user = users[i % users.length];
        const day = Math.floor(Math.random() * 28) + 1;
        const createdAt = new Date(period.year, period.month - 1, day);
        
        try {
          await connection.execute(`
            INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, amount, created_at) 
            VALUES (?, 1, 'active', 'monthly', ?, DATE_ADD(?, INTERVAL 1 MONTH), 29.00, ?)
          `, [user.id, createdAt, createdAt, createdAt]);
        } catch (err) {
          // Skip if already exists
        }
      }
    }

    console.log('✅ Historical data added successfully!');

    // Show growth calculations
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    console.log('\n📊 Growth Calculations:');
    
    // Users
    const [currentUsers] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND role = 'user'
    `, [currentMonth, currentYear]);
    
    const [lastUsers] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND role = 'user'
    `, [lastMonth, lastMonthYear]);

    const userGrowth = lastUsers[0].count > 0 
      ? ((currentUsers[0].count - lastUsers[0].count) / lastUsers[0].count * 100).toFixed(1)
      : 100;

    console.log(`   Users: ${lastUsers[0].count} → ${currentUsers[0].count} (${userGrowth}%)`);

    // Revenue
    const [currentRevenue] = await connection.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions 
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND status = 'successful'
    `, [currentMonth, currentYear]);
    
    const [lastRevenue] = await connection.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions 
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND status = 'successful'
    `, [lastMonth, lastMonthYear]);

    const revenueGrowth = lastRevenue[0].revenue > 0 
      ? ((currentRevenue[0].revenue - lastRevenue[0].revenue) / lastRevenue[0].revenue * 100).toFixed(1)
      : 100;

    console.log(`   Revenue: $${lastRevenue[0].revenue} → $${currentRevenue[0].revenue} (${revenueGrowth}%)`);

  } catch (error) {
    console.error('❌ Error adding historical data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addHistoricalData();