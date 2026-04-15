const pool = require('../config/database');

async function addSampleAcquisitionData() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection first
    const [testResult] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    console.log('Adding acquisition_source column if not exists...');
    
    // Add acquisition_source column if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN acquisition_source ENUM('direct', 'referral', 'social', 'other') DEFAULT 'direct'
      `);
      console.log('✅ Added acquisition_source column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  acquisition_source column already exists');
      } else {
        throw error;
      }
    }

    console.log('Updating existing users with random acquisition sources...');
    
    // Update existing users with random acquisition sources
    const [users] = await pool.execute('SELECT id FROM users WHERE role = "user"');
    
    const sources = ['direct', 'referral', 'social', 'other'];
    const weights = [45, 32, 18, 5]; // Percentage weights
    
    for (const user of users) {
      // Weighted random selection
      const random = Math.random() * 100;
      let source = 'direct';
      
      if (random < weights[3]) source = 'other';
      else if (random < weights[3] + weights[2]) source = 'social';
      else if (random < weights[3] + weights[2] + weights[1]) source = 'referral';
      else source = 'direct';
      
      await pool.execute(
        'UPDATE users SET acquisition_source = ? WHERE id = ?',
        [source, user.id]
      );
    }

    console.log('Adding sample users with different acquisition sources...');
    
    // Add some sample users with different acquisition sources
    const sampleUsers = [
      { username: 'sarah_jenkins', email: 'sarah@example.com', source: 'direct' },
      { username: 'marcus_johnson', email: 'marcus@example.com', source: 'referral' },
      { username: 'alex_sterling', email: 'alex@example.com', source: 'social' },
      { username: 'emma_wilson', email: 'emma@example.com', source: 'direct' },
      { username: 'david_brown', email: 'david@example.com', source: 'other' },
      { username: 'lisa_davis', email: 'lisa@example.com', source: 'social' },
      { username: 'mike_taylor', email: 'mike@example.com', source: 'referral' },
      { username: 'anna_garcia', email: 'anna@example.com', source: 'direct' }
    ];

    for (const user of sampleUsers) {
      try {
        await pool.execute(`
          INSERT INTO users (username, email, password, acquisition_source, created_at) 
          VALUES (?, ?, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY))
        `, [user.username, user.email, user.source]);
      } catch (error) {
        // User might already exist, skip
        console.log(`User ${user.email} already exists, skipping...`);
      }
    }

    console.log('Adding sample transactions...');
    
    // Add sample transactions
    const [allUsers] = await pool.execute('SELECT id, username, email FROM users WHERE role = "user" LIMIT 10');
    
    for (const user of allUsers) {
      const transactionCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < transactionCount; i++) {
        const amount = Math.floor(Math.random() * 2000) + 50;
        const statuses = ['successful', 'pending', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const daysAgo = Math.floor(Math.random() * 60);
        
        await pool.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, description) 
          VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), 'Sample transaction')
        `, [user.id, amount, status, daysAgo]);
      }
    }

    console.log('✅ Sample acquisition data added successfully!');
    console.log('📊 Data includes:');
    console.log('- User acquisition sources (direct, referral, social, other)');
    console.log('- Sample transactions with various statuses');
    console.log('- Realistic date distributions');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    process.exit(0);
  }
}

addSampleAcquisitionData();