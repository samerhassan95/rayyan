const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function addChartData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Generate realistic monthly revenue data for the past 12 months
    const months = [];
    const baseRevenue = 50000;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const month = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      
      // Generate realistic revenue with growth trend and seasonal variations
      const growthFactor = 1 + (11 - i) * 0.05; // 5% growth per month
      const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.2; // Seasonal variation
      const randomFactor = 0.8 + Math.random() * 0.4; // Random variation ±20%
      
      const revenue = Math.round(baseRevenue * growthFactor * seasonalFactor * randomFactor);
      const transactions = Math.round(revenue / 150 + Math.random() * 50); // Avg transaction ~$150
      
      months.push({
        month,
        monthName,
        revenue,
        transactions,
        subscriptions: Math.round(transactions * 0.3), // 30% are subscriptions
        date: date.toISOString().split('T')[0]
      });
    }

    // Clear existing transactions and add new ones with proper dates
    await connection.execute('DELETE FROM transactions WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)');

    // Add transactions for each month
    for (const monthData of months) {
      const transactionsToAdd = monthData.transactions;
      
      for (let i = 0; i < transactionsToAdd; i++) {
        // Random day within the month
        const day = Math.floor(Math.random() * 28) + 1;
        const transactionDate = `${monthData.month}-${day.toString().padStart(2, '0')}`;
        
        // Random amount based on month's average
        const avgAmount = monthData.revenue / monthData.transactions;
        const amount = Math.round(avgAmount * (0.5 + Math.random() * 1.5));
        
        // Random status (90% successful)
        const statuses = ['successful', 'successful', 'successful', 'successful', 'successful', 
                         'successful', 'successful', 'successful', 'successful', 'pending', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random user (assuming we have users 1-10)
        const userId = Math.floor(Math.random() * 9) + 1;
        
        await connection.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [userId, amount, status, transactionDate, transactionDate]);
      }
    }

    console.log('✅ Chart data added successfully!');
    console.log('📊 Generated data for months:');
    months.forEach(m => {
      console.log(`   ${m.monthName}: $${m.revenue.toLocaleString()} (${m.transactions} transactions)`);
    });

  } catch (error) {
    console.error('❌ Error adding chart data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addChartData();