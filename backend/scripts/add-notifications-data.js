const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function addNotificationsData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Insert sample notifications
    const notifications = [
      {
        user_id: 1,
        title: 'New User Registration',
        message: 'New user registration: john.doe@example.com',
        type: 'info',
        is_read: false
      },
      {
        user_id: 1,
        title: 'Payment Failed',
        message: 'Payment failed for subscription #1234 - Card declined',
        type: 'error',
        is_read: false
      },
      {
        user_id: 1,
        title: 'Monthly Report Ready',
        message: 'Your monthly analytics report is ready for download',
        type: 'success',
        is_read: true
      },
      {
        user_id: 1,
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM EST',
        type: 'warning',
        is_read: false
      },
      {
        user_id: 1,
        title: 'New Feature Available',
        message: 'Advanced filtering is now available in the transactions page',
        type: 'info',
        is_read: true
      }
    ];

    for (const notification of notifications) {
      await connection.execute(`
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR))
        ON DUPLICATE KEY UPDATE message = VALUES(message)
      `, [notification.user_id, notification.title, notification.message, notification.type, notification.is_read]);
    }

    // Insert sample activity log
    const activities = [
      {
        user_id: 1,
        action: 'login',
        description: 'Admin user logged in to dashboard',
        ip_address: '192.168.1.1'
      },
      {
        user_id: 1,
        action: 'user_update',
        description: 'Updated user profile for john.doe@example.com',
        ip_address: '192.168.1.1'
      },
      {
        user_id: 1,
        action: 'subscription_create',
        description: 'Created new subscription for Professional plan',
        ip_address: '192.168.1.1'
      },
      {
        user_id: 1,
        action: 'transaction_refund',
        description: 'Processed refund for transaction TXN-902341',
        ip_address: '192.168.1.1'
      },
      {
        user_id: 1,
        action: 'settings_update',
        description: 'Updated system settings - tax rate changed to 8.5%',
        ip_address: '192.168.1.1'
      },
      {
        user_id: 1,
        action: 'user_delete',
        description: 'Deleted inactive user account: inactive@example.com',
        ip_address: '192.168.1.1'
      }
    ];

    for (const activity of activities) {
      await connection.execute(`
        INSERT INTO activity_log (user_id, action, description, ip_address, created_at) 
        VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 72) HOUR))
      `, [activity.user_id, activity.action, activity.description, activity.ip_address]);
    }

    console.log('✅ Sample notifications and activity log data added successfully!');

  } catch (error) {
    console.error('❌ Error adding notifications data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addNotificationsData();