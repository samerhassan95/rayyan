const mysql = require('mysql2/promise');

async function addSampleData() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'samerhassan11',
      database: 'rayyan'
    });
    
    console.log('✅ Connected to database');
    
    // Add acquisition_source column
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN acquisition_source ENUM('direct', 'referral', 'social', 'other') DEFAULT 'direct'
      `);
      console.log('✅ Added acquisition_source column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  acquisition_source column already exists');
      } else {
        console.log('⚠️  Column error:', error.message);
      }
    }
    
    // Add sample users with acquisition sources
    const sampleUsers = [
      { username: 'sarah_jenkins', email: 'sarah@example.com', source: 'direct' },
      { username: 'marcus_johnson', email: 'marcus@example.com', source: 'referral' },
      { username: 'alex_sterling', email: 'alex@example.com', source: 'social' },
      { username: 'emma_wilson', email: 'emma@example.com', source: 'direct' },
      { username: 'david_brown', email: 'david@example.com', source: 'other' }
    ];

    console.log('📝 Adding sample users...');
    
    for (const user of sampleUsers) {
      try {
        await connection.execute(`
          INSERT INTO users (username, email, password, acquisition_source, created_at) 
          VALUES (?, ?, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY))
        `, [user.username, user.email, user.source]);
        console.log(`✅ Added user: ${user.email}`);
      } catch (error) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`ℹ️  User ${user.email} already exists`);
        } else {
          console.log(`⚠️  Error adding ${user.email}:`, error.message);
        }
      }
    }
    
    // Add sample transactions
    console.log('💳 Adding sample transactions...');
    
    const [users] = await connection.execute('SELECT id FROM users WHERE role = "user" LIMIT 5');
    
    for (const user of users) {
      const transactionCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < transactionCount; i++) {
        const amount = Math.floor(Math.random() * 1500) + 50;
        const statuses = ['successful', 'pending', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        
        await connection.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, description) 
          VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), 'Sample transaction')
        `, [user.id, amount, status, daysAgo]);
      }
    }
    
    console.log('✅ Sample transactions added');
    
    // Verify data
    const [userStats] = await connection.execute(`
      SELECT 
        acquisition_source,
        COUNT(*) as count
      FROM users 
      WHERE role = 'user'
      GROUP BY acquisition_source
    `);
    
    console.log('📊 User acquisition stats:');
    userStats.forEach(stat => {
      console.log(`   ${stat.acquisition_source}: ${stat.count} users`);
    });
    
    const [transactionStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions 
      GROUP BY status
    `);
    
    console.log('💰 Transaction stats:');
    transactionStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count} transactions, $${stat.total_amount}`);
    });
    
    console.log('🎉 Sample data setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

addSampleData();