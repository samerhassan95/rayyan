const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function populateSampleData() {
  console.log('🚀 Populating sample data...');
  
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    database: process.env.DB_NAME || 'rayyan',
    multipleStatements: true
  });
  
  return new Promise((resolve, reject) => {
    connection.connect(async (err) => {
      if (err) {
        console.error('❌ Connection failed:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database');
      
      try {
        // Hash password for sample users
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const sampleData = `
          -- Insert sample users
          INSERT INTO users (username, email, password, role, status, phone, job_title, bio, two_factor_enabled, last_login) VALUES
          ('Sarah Jenkins', 'sarah.j@architect.com', '${hashedPassword}', 'admin', 'active', '+1-555-0101', 'Lead Designer', 'Experienced UI/UX designer with 8+ years in SaaS platforms', true, NOW()),
          ('Alexander Sterling', 'alex.sterling@precisionledger.io', '${hashedPassword}', 'user', 'active', '+1-555-0102', 'Senior Portfolio Strategist', 'Financial strategist specializing in equity research and risk mitigation', true, DATE_SUB(NOW(), INTERVAL 2 DAY)),
          ('Marcus Johnson', 'marcus.j@techcorp.com', '${hashedPassword}', 'user', 'active', '+1-555-0103', 'Product Manager', 'Product management professional with focus on enterprise solutions', false, DATE_SUB(NOW(), INTERVAL 5 DAY)),
          ('Elena Rodriguez', 'elena.r@startup.io', '${hashedPassword}', 'user', 'inactive', '+1-555-0104', 'Data Analyst', 'Data science expert with background in machine learning', false, DATE_SUB(NOW(), INTERVAL 15 DAY)),
          ('David Chen', 'david.c@consulting.com', '${hashedPassword}', 'user', 'active', '+1-555-0105', 'Business Consultant', 'Strategic business consultant for Fortune 500 companies', true, DATE_SUB(NOW(), INTERVAL 1 DAY))
          ON DUPLICATE KEY UPDATE username = VALUES(username);

          -- Insert sample subscriptions
          INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, next_payment_date, amount) VALUES
          (2, 2, 'active', 'monthly', '2023-10-01', '2023-11-01', '2023-11-01', 79.00),
          (3, 1, 'active', 'yearly', '2023-01-01', '2024-01-01', '2024-01-01', 290.00),
          (4, 2, 'past_due', 'monthly', '2023-09-01', '2023-10-01', '2023-10-15', 79.00),
          (5, 3, 'active', 'monthly', '2023-10-01', '2023-11-01', '2023-11-01', 249.00)
          ON DUPLICATE KEY UPDATE status = VALUES(status);

          -- Insert sample transactions
          INSERT INTO transactions (user_id, subscription_id, amount, currency, status, payment_method, description, transaction_date, processed_at) VALUES
          (2, 1, 79.00, 'USD', 'successful', 'Visa •••• 4242', 'Monthly subscription payment', '2023-10-28 10:30:00', '2023-10-28 10:31:00'),
          (3, 2, 290.00, 'USD', 'successful', 'Bank Transfer', 'Annual subscription payment', '2023-10-27 14:15:00', '2023-10-27 14:20:00'),
          (4, 3, 79.00, 'USD', 'failed', 'Apple Pay', 'Monthly subscription payment', '2023-10-26 09:45:00', NULL),
          (5, 4, 249.00, 'USD', 'successful', 'Mastercard •••• 8012', 'Monthly subscription payment', '2023-10-26 16:20:00', '2023-10-26 16:21:00'),
          (2, 1, 79.00, 'USD', 'successful', 'Visa •••• 4242', 'Monthly subscription payment', '2023-09-28 10:30:00', '2023-09-28 10:31:00'),
          (3, 2, 79.00, 'USD', 'successful', 'Bank Transfer', 'Monthly subscription payment', '2023-09-27 14:15:00', '2023-09-27 14:20:00')
          ON DUPLICATE KEY UPDATE amount = VALUES(amount);

          -- Insert sample support tickets
          INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, created_at) VALUES
          ('TIC-8842', 2, 'Billing Discrepancy - Q3 Report', 'There seems to be an issue with the Q3 billing report calculations', 'Financial', 'critical', 'open', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
          ('TIC-8839', 2, 'API Connection Timeout', 'Experiencing timeout issues when connecting to the API endpoints', 'Technical Support', 'medium', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
          ('TIC-8831', 2, 'User Seat Expansion Request', 'Need to expand user seats for our growing team', 'Account Management', 'low', 'resolved', DATE_SUB(NOW(), INTERVAL 5 DAY)),
          ('TIC-8825', 3, 'Feature Request - Dashboard Export', 'Would like to export dashboard data to PDF format', 'Feature Request', 'medium', 'open', DATE_SUB(NOW(), INTERVAL 3 DAY)),
          ('TIC-8820', 4, 'Password Reset Issue', 'Unable to reset password through the standard flow', 'Technical Support', 'high', 'resolved', DATE_SUB(NOW(), INTERVAL 7 DAY))
          ON DUPLICATE KEY UPDATE subject = VALUES(subject);

          -- Insert sample user sessions
          INSERT INTO user_sessions (user_id, device_info, browser, ip_address, location, is_current, created_at, last_activity) VALUES
          (2, 'MacBook Pro 16"', 'Chrome', '192.168.1.1', 'San Francisco, United States', true, DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
          (2, 'iPhone 15 Pro', 'Safari', '192.168.1.2', 'London, United Kingdom', false, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
          (2, 'iPad Air', 'App', '192.168.1.3', 'Paris, France', false, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 11 HOUR)),
          (3, 'Windows Desktop', 'Edge', '192.168.1.4', 'New York, United States', true, DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),
          (5, 'MacBook Air', 'Firefox', '192.168.1.5', 'Toronto, Canada', true, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW())
          ON DUPLICATE KEY UPDATE device_info = VALUES(device_info);

          -- Insert discount codes
          INSERT INTO discount_codes (code, discount_value, discount_type, max_usage, usage_count, active, expires_at) VALUES
          ('WELCOME20', 20.00, 'percentage', 1000, 145, true, '2024-12-31 23:59:59'),
          ('STUDENT50', 50.00, 'percentage', 500, 67, true, '2024-06-30 23:59:59'),
          ('EARLY25', 25.00, 'percentage', 200, 89, true, '2024-03-31 23:59:59')
          ON DUPLICATE KEY UPDATE usage_count = VALUES(usage_count);
        `;

        connection.query(sampleData, (err, results) => {
          connection.end();
          
          if (err) {
            console.error('❌ Sample data insertion failed:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ Sample data inserted successfully!');
          console.log('');
          console.log('📋 Sample Data Summary:');
          console.log('   ✅ 5 sample users created');
          console.log('   ✅ 4 sample subscriptions created');
          console.log('   ✅ 6 sample transactions created');
          console.log('   ✅ 5 sample support tickets created');
          console.log('   ✅ 5 sample user sessions created');
          console.log('   ✅ 3 sample discount codes created');
          console.log('');
          console.log('🔐 Sample User Credentials:');
          console.log('   📧 sarah.j@architect.com / password123');
          console.log('   📧 alex.sterling@precisionledger.io / password123');
          console.log('   📧 marcus.j@techcorp.com / password123');
          console.log('');
          console.log('🌐 Admin Dashboard: http://localhost:3000/admin');
          console.log('   📧 admin@rayyan.com / password');
          
          resolve();
        });
        
      } catch (hashError) {
        console.error('❌ Password hashing failed:', hashError.message);
        connection.end();
        reject(hashError);
      }
    });
  });
}

populateSampleData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));