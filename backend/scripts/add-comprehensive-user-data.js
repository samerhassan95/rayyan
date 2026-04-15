const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addComprehensiveUserData() {
  console.log('🚀 Adding comprehensive data for all users...\n');

  try {
    // Get all users
    const [users] = await pool.execute('SELECT * FROM users WHERE role = "user"');
    console.log(`📊 Found ${users.length} users to enhance`);

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.username} (ID: ${user.id})`);

      // Add transactions for each user
      const transactionCount = Math.floor(Math.random() * 15) + 5; // 5-20 transactions
      console.log(`  💳 Adding ${transactionCount} transactions...`);
      
      for (let i = 0; i < transactionCount; i++) {
        const amount = (Math.random() * 500 + 50).toFixed(2); // $50-$550
        const statuses = ['successful', 'pending', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random date within last 6 months
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));
        
        await pool.execute(`
          INSERT INTO transactions (user_id, amount, status, transaction_date, description, payment_method)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          amount,
          status,
          date.toISOString().split('T')[0],
          `Payment for services - ${Math.random().toString(36).substring(7)}`,
          ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)]
        ]);
      }

      // Add subscriptions for each user
      const subscriptionCount = Math.floor(Math.random() * 4) + 1; // 1-4 subscriptions
      console.log(`  📋 Adding ${subscriptionCount} subscriptions...`);
      
      for (let i = 0; i < subscriptionCount; i++) {
        const planIds = [1, 2, 3]; // Basic, Professional, Enterprise
        const planId = planIds[Math.floor(Math.random() * planIds.length)];
        const statuses = ['active', 'past_due', 'cancelled'];
        const status = i === 0 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)];
        
        const amount = planId === 1 ? 29.00 : planId === 2 ? 79.00 : 199.00;
        
        // Random start date within last year
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 365));
        
        await pool.execute(`
          INSERT INTO subscriptions (user_id, plan_id, status, amount, billing_cycle, current_period_start, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          planId,
          status,
          amount,
          'monthly',
          startDate.toISOString().split('T')[0],
          startDate.toISOString().replace('T', ' ').replace('Z', '')
        ]);
      }

      // Add support tickets for each user
      const ticketCount = Math.floor(Math.random() * 8) + 2; // 2-10 tickets
      console.log(`  🎫 Adding ${ticketCount} support tickets...`);
      
      const subjects = [
        'Login Issues - Unable to Access Account',
        'Billing Discrepancy - Incorrect Charge',
        'Feature Request - API Enhancement',
        'Password Reset Problem',
        'Performance Issues - Slow Loading',
        'Integration Support Needed',
        'Account Upgrade Question',
        'Data Export Request',
        'Security Concern - Suspicious Activity',
        'Mobile App Bug Report',
        'Payment Method Update',
        'Subscription Cancellation',
        'Technical Documentation Request',
        'API Rate Limit Issue',
        'Dashboard Display Problem'
      ];
      
      const categories = ['Technical Support', 'Billing', 'General', 'Feature Request', 'Security', 'Financial'];
      const priorities = ['low', 'medium', 'high', 'critical'];
      const statuses = ['open', 'pending', 'resolved', 'closed'];
      
      for (let i = 0; i < ticketCount; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random date within last 3 months
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90));
        
        const updatedDate = new Date(createdDate);
        updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 30));
        
        const ticketNumber = `TIC-${Math.floor(Math.random() * 9000) + 1000}`;
        
        await pool.execute(`
          INSERT INTO support_tickets (user_id, ticket_number, subject, category, priority, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          ticketNumber,
          subject,
          category,
          priority,
          status,
          createdDate.toISOString().replace('T', ' ').replace('Z', ''),
          updatedDate.toISOString().replace('T', ' ').replace('Z', '')
        ]);
      }

      // Add user sessions for activity tracking
      const sessionCount = Math.floor(Math.random() * 10) + 5; // 5-15 sessions
      console.log(`  🔐 Adding ${sessionCount} user sessions...`);
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 30));
        
        const duration = Math.floor(Math.random() * 7200) + 300; // 5 minutes to 2 hours
        const ipAddresses = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.45'];
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ];
        
        await pool.execute(`
          INSERT INTO user_sessions (user_id, device_info, browser, ip_address, location, is_current, last_activity, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          userAgents[Math.floor(Math.random() * userAgents.length)],
          ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
          ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
          ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia'][Math.floor(Math.random() * 4)],
          i === 0 ? true : false, // First session is current
          sessionDate.toISOString().replace('T', ' ').replace('Z', ''),
          sessionDate.toISOString().replace('T', ' ').replace('Z', '')
        ]);
      }

      console.log(`  ✅ Completed data for ${user.username}`);
    }

    // Add some activity logs
    console.log('\n📝 Adding activity logs...');
    for (const user of users.slice(0, 10)) { // Add logs for first 10 users
      const logCount = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < logCount; i++) {
        const actions = ['login', 'profile_update', 'password_change', 'subscription_change', 'payment_made'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        const logDate = new Date();
        logDate.setDate(logDate.getDate() - Math.floor(Math.random() * 60));
        
        await pool.execute(`
          INSERT INTO activity_log (user_id, action, description, ip_address, created_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          user.id,
          action,
          `User performed ${action}`,
          '192.168.1.100',
          logDate.toISOString().replace('T', ' ').replace('Z', '')
        ]);
      }
    }

    console.log('\n🎉 Comprehensive user data added successfully!');
    console.log('\n📊 Summary:');
    
    // Get final counts
    const [transactionCount] = await pool.execute('SELECT COUNT(*) as count FROM transactions');
    const [subscriptionCount] = await pool.execute('SELECT COUNT(*) as count FROM subscriptions');
    const [ticketCount] = await pool.execute('SELECT COUNT(*) as count FROM support_tickets');
    const [sessionCount] = await pool.execute('SELECT COUNT(*) as count FROM user_sessions');
    
    console.log(`   - Total Transactions: ${transactionCount[0].count}`);
    console.log(`   - Total Subscriptions: ${subscriptionCount[0].count}`);
    console.log(`   - Total Support Tickets: ${ticketCount[0].count}`);
    console.log(`   - Total User Sessions: ${sessionCount[0].count}`);

  } catch (error) {
    console.error('❌ Error adding comprehensive user data:', error);
  } finally {
    await pool.end();
  }
}

addComprehensiveUserData();