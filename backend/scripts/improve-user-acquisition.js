const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function improveUserAcquisition() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Update existing users with more realistic acquisition sources
    const [users] = await connection.execute('SELECT id FROM users WHERE role = "user"');
    
    const sources = ['direct', 'referral', 'social', 'other'];
    const weights = [0.45, 0.25, 0.20, 0.10]; // More realistic distribution
    
    for (const user of users) {
      // Weighted random selection
      const random = Math.random();
      let source = 'direct';
      let cumulative = 0;
      
      for (let i = 0; i < sources.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          source = sources[i];
          break;
        }
      }
      
      await connection.execute(
        'UPDATE users SET acquisition_source = ? WHERE id = ?',
        [source, user.id]
      );
    }

    // Add some more users with varied acquisition sources
    const newUsers = [
      { username: 'alex_marketing', email: 'alex@marketing.com', source: 'social' },
      { username: 'sarah_referral', email: 'sarah@referral.com', source: 'referral' },
      { username: 'mike_direct', email: 'mike@direct.com', source: 'direct' },
      { username: 'lisa_social', email: 'lisa@social.com', source: 'social' },
      { username: 'john_other', email: 'john@other.com', source: 'other' },
      { username: 'emma_referral', email: 'emma@referral.com', source: 'referral' }
    ];

    for (const user of newUsers) {
      try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await connection.execute(`
          INSERT INTO users (username, email, password, role, acquisition_source, status) 
          VALUES (?, ?, ?, 'user', ?, 'active')
        `, [user.username, user.email, hashedPassword, user.source]);
      } catch (err) {
        // Skip if user already exists
        if (!err.message.includes('Duplicate entry')) {
          console.error('Error adding user:', err.message);
        }
      }
    }

    console.log('✅ User acquisition data improved!');

    // Show current distribution
    const [distribution] = await connection.execute(`
      SELECT 
        COALESCE(acquisition_source, 'direct') as source,
        COUNT(*) as count
      FROM users 
      WHERE role = 'user'
      GROUP BY acquisition_source
      ORDER BY count DESC
    `);

    console.log('\n📊 Current User Acquisition Distribution:');
    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    distribution.forEach(item => {
      const percentage = Math.round((item.count / total) * 100);
      console.log(`   ${item.source}: ${item.count} users (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error improving user acquisition:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

improveUserAcquisition();