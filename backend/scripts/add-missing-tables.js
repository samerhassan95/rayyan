const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function addMissingTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Create notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create activity_log table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Missing tables created successfully!');

    // Now add sample data
    // Insert sample notifications
    const notifications = [
      [1, 'New User Registration', 'New user registration: john.doe@example.com', 'info', false],
      [1, 'Payment Failed', 'Payment failed for subscription #1234 - Card declined', 'error', false],
      [1, 'Monthly Report Ready', 'Your monthly analytics report is ready for download', 'success', true],
      [1, 'System Maintenance', 'Scheduled maintenance will occur tonight from 2-4 AM EST', 'warning', false],
      [1, 'New Feature Available', 'Advanced filtering is now available in the transactions page', 'info', true]
    ];

    for (const notification of notifications) {
      await connection.execute(`
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR))
      `, notification);
    }

    // Insert sample activity log
    const activities = [
      [1, 'login', 'Admin user logged in to dashboard', '192.168.1.1'],
      [1, 'user_update', 'Updated user profile for john.doe@example.com', '192.168.1.1'],
      [1, 'subscription_create', 'Created new subscription for Professional plan', '192.168.1.1'],
      [1, 'transaction_refund', 'Processed refund for transaction TXN-902341', '192.168.1.1'],
      [1, 'settings_update', 'Updated system settings - tax rate changed to 8.5%', '192.168.1.1'],
      [1, 'user_delete', 'Deleted inactive user account: inactive@example.com', '192.168.1.1']
    ];

    for (const activity of activities) {
      await connection.execute(`
        INSERT INTO activity_log (user_id, action, description, ip_address, created_at) 
        VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 72) HOUR))
      `, activity);
    }

    console.log('✅ Sample notifications and activity log data added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addMissingTables();