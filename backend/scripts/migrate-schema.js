const mysql = require('mysql2');
require('dotenv').config();

async function migrateSchema() {
  console.log('🚀 Migrating database schema...');
  
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    database: process.env.DB_NAME || 'rayyan',
    multipleStatements: true
  });
  
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Connection failed:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database');
      
      const migrations = `
        -- Add missing columns to users table (ignore errors if columns exist)
        SET sql_notes = 0;
        
        ALTER TABLE users ADD COLUMN profile_image VARCHAR(255);
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        ALTER TABLE users ADD COLUMN address TEXT;
        ALTER TABLE users ADD COLUMN job_title VARCHAR(100);
        ALTER TABLE users ADD COLUMN bio TEXT;
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;

        SET sql_notes = 1;

        -- Create plans table if not exists
        CREATE TABLE IF NOT EXISTS plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          tier VARCHAR(50),
          monthly_price DECIMAL(10,2),
          yearly_price DECIMAL(10,2),
          description TEXT,
          features JSON,
          recommended BOOLEAN DEFAULT FALSE,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Create subscriptions table if not exists
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          plan_id INT,
          status ENUM('active', 'past_due', 'cancelled', 'expired') DEFAULT 'active',
          billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
          current_period_start DATE,
          current_period_end DATE,
          next_payment_date DATE,
          amount DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (plan_id) REFERENCES plans(id)
        );

        -- Create transactions table if not exists
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          subscription_id INT,
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'pending',
          payment_method VARCHAR(100),
          payment_method_details JSON,
          description TEXT,
          fees DECIMAL(10,2) DEFAULT 0,
          net_amount DECIMAL(10,2),
          transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL,
          refunded_at TIMESTAMP NULL,
          refund_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
        );

        -- Create support_tickets table if not exists
        CREATE TABLE IF NOT EXISTS support_tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_number VARCHAR(20) UNIQUE NOT NULL,
          user_id INT,
          subject VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
          status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
          assigned_to INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        );

        -- Create user_sessions table if not exists
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          device_info VARCHAR(255),
          browser VARCHAR(100),
          ip_address VARCHAR(45),
          location VARCHAR(255),
          is_current BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Create discount_codes table if not exists
        CREATE TABLE IF NOT EXISTS discount_codes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          discount_value DECIMAL(10,2) NOT NULL,
          discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
          max_usage INT DEFAULT 0,
          usage_count INT DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          expires_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Insert default plans if not exists
        INSERT IGNORE INTO plans (name, tier, monthly_price, yearly_price, description, features, recommended) VALUES
        ('Basic', 'ENTRY TIER', 29.00, 290.00, 'Perfect for individuals and small experimental projects.', 
         JSON_ARRAY('Up to 3 active projects', 'Basic analytics dashboard'), FALSE),
        ('Professional', 'PROFESSIONAL', 79.00, 790.00, 'Perfect for individuals and small experimental projects.', 
         JSON_ARRAY('Up to 3 active projects', 'Basic analytics dashboard', 'Custom domain mapping', '24/7 priority support'), TRUE),
        ('Enterprise', 'HIGH VOLUME', 249.00, 2490.00, 'Bespoke infrastructure for large-scale operations.', 
         JSON_ARRAY('Everything in Professional', 'Dedicated account manager', 'White-label reporting', 'SLA Guarantees & SOC2'), FALSE);
      `;
      
      connection.query(migrations, (err, results) => {
        connection.end();
        
        if (err) {
          console.error('❌ Migration failed:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ Database migration completed successfully!');
        resolve();
      });
    });
  });
}

migrateSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));