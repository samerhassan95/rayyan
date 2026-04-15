const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function enhanceUsersData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Get all users
    const [users] = await connection.execute('SELECT id, username FROM users WHERE role = "user"');
    
    // Sample data for enhancement
    const jobTitles = [
      'Senior Portfolio Strategist',
      'Financial Analyst',
      'Investment Manager',
      'Risk Assessment Specialist',
      'Compliance Officer',
      'Data Scientist',
      'Product Manager',
      'Business Analyst',
      'Marketing Specialist',
      'Customer Success Manager'
    ];
    
    const addresses = [
      'New York, USA',
      'London, UK',
      'San Francisco, USA',
      'Toronto, Canada',
      'Sydney, Australia',
      'Berlin, Germany',
      'Tokyo, Japan',
      'Singapore',
      'Dubai, UAE',
      'Paris, France'
    ];
    
    const phoneNumbers = [
      '+1-555-0123',
      '+44-20-7946-0958',
      '+1-415-555-0199',
      '+1-647-555-0147',
      '+61-2-9876-5432',
      '+49-30-12345678',
      '+81-3-1234-5678',
      '+65-6123-4567',
      '+971-4-123-4567',
      '+33-1-23-45-67-89'
    ];

    // Update users with enhanced data
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const jobTitle = jobTitles[i % jobTitles.length];
      const address = addresses[i % addresses.length];
      const phone = phoneNumbers[i % phoneNumbers.length];
      const twoFactorEnabled = Math.random() > 0.5; // 50% chance
      
      await connection.execute(`
        UPDATE users 
        SET job_title = ?, address = ?, phone = ?, two_factor_enabled = ?
        WHERE id = ?
      `, [jobTitle, address, phone, twoFactorEnabled, user.id]);
    }

    // Add some transactions for users to make stats more realistic
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      const transactionCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < transactionCount; j++) {
        const amount = (Math.random() * 500 + 50).toFixed(2);
        const status = Math.random() > 0.2 ? 'successful' : 'pending';
        const daysAgo = Math.floor(Math.random() * 30);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - daysAgo);
        
        await connection.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [user.id, amount, status, transactionDate, transactionDate]);
      }
    }

    // Add some subscriptions
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      const planId = Math.floor(Math.random() * 3) + 1; // Assuming we have 3 plans
      const status = Math.random() > 0.3 ? 'active' : 'past_due';
      
      try {
        await connection.execute(`
          INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, amount) 
          VALUES (?, ?, ?, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 29.00)
        `, [user.id, planId, status]);
      } catch (err) {
        // Skip if subscription already exists
      }
    }

    // Add some support tickets
    const ticketSubjects = [
      'Billing Discrepancy - Q3 Report',
      'API Connection Timeout',
      'User Seat Expansion Request',
      'Password Reset Issue',
      'Feature Request - Dark Mode',
      'Performance Issues',
      'Data Export Problem',
      'Account Verification'
    ];
    
    const categories = ['Financial', 'Technical Support', 'Account Management', 'General'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['open', 'pending', 'resolved'];

    for (let i = 0; i < Math.min(8, users.length); i++) {
      const user = users[i];
      const ticketCount = Math.floor(Math.random() * 3);
      
      for (let j = 0; j < ticketCount; j++) {
        const subject = ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const ticketNumber = `TIC-${8800 + Math.floor(Math.random() * 100)}`;
        
        try {
          await connection.execute(`
            INSERT INTO support_tickets (ticket_number, user_id, subject, category, priority, status) 
            VALUES (?, ?, ?, ?, ?, ?)
          `, [ticketNumber, user.id, subject, category, priority, status]);
        } catch (err) {
          // Skip if ticket number already exists
        }
      }
    }

    console.log('✅ Users data enhanced successfully!');
    
    // Show summary
    const [enhancedUsers] = await connection.execute(`
      SELECT u.username, u.job_title, u.address, u.phone, u.two_factor_enabled,
             COUNT(DISTINCT t.id) as transaction_count,
             COUNT(DISTINCT s.id) as subscription_count,
             COUNT(DISTINCT st.id) as ticket_count
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN support_tickets st ON u.id = st.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      LIMIT 5
    `);

    console.log('\n📊 Enhanced Users Summary:');
    enhancedUsers.forEach(user => {
      console.log(`   ${user.username}:`);
      console.log(`     - Job: ${user.job_title}`);
      console.log(`     - Location: ${user.address}`);
      console.log(`     - 2FA: ${user.two_factor_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`     - Transactions: ${user.transaction_count}`);
      console.log(`     - Subscriptions: ${user.subscription_count}`);
      console.log(`     - Support Tickets: ${user.ticket_count}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error enhancing users data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

enhanceUsersData();