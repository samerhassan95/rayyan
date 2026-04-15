const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function simpleSetup() {
  console.log('🚀 Simple Rayyan database setup...');
  
  // Create connection using callback style to avoid prepared statement issues
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    multipleStatements: true
  });
  
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
          console.log('💡 Make sure MySQL is running on port 3307');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          console.log('💡 Check your MySQL credentials');
        }
        reject(err);
        return;
      }
      
      console.log('✅ Connected to MySQL server');
      
      // SQL script to create everything
      const sql = `
        -- Create database
        CREATE DATABASE IF NOT EXISTS rayyan;
        USE rayyan;
        
        -- Users table with enhanced fields
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          profile_image VARCHAR(255),
          phone VARCHAR(20),
          address TEXT,
          job_title VARCHAR(100),
          bio TEXT,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Plans table
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

        -- Subscriptions table
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Transactions table
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Support tickets table
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
          resolved_at TIMESTAMP NULL
        );

        -- User sessions table
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          device_info VARCHAR(255),
          browser VARCHAR(100),
          ip_address VARCHAR(45),
          location VARCHAR(255),
          is_current BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Products table
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          category_id INT,
          image VARCHAR(255),
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          total_amount DECIMAL(10,2),
          status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          delivery_date DATE,
          notes TEXT
        );
        
        -- Order items table
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT,
          product_id INT,
          quantity INT DEFAULT 1,
          price DECIMAL(10,2)
        );
        
        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Insert default settings
        INSERT INTO settings (setting_key, setting_value, description) VALUES
        ('site_name', 'Rayyan Admin', 'Website name'),
        ('site_email', 'admin@rayyan.com', 'Contact email'),
        ('currency', 'USD', 'Default currency'),
        ('tax_rate', '10', 'Tax percentage')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
        
        -- Insert sample categories
        INSERT INTO categories (name, description) VALUES
        ('Electronics', 'Electronic devices and accessories'),
        ('Clothing', 'Fashion and apparel'),
        ('Books', 'Books and educational materials')
        ON DUPLICATE KEY UPDATE description = VALUES(description);

        -- Insert default plans
        INSERT INTO plans (name, tier, monthly_price, yearly_price, description, recommended) VALUES
        ('Basic', 'ENTRY TIER', 29.00, 290.00, 'Perfect for individuals and small experimental projects.', FALSE),
        ('Professional', 'PROFESSIONAL', 79.00, 790.00, 'Perfect for individuals and small experimental projects.', TRUE),
        ('Enterprise', 'HIGH VOLUME', 249.00, 2490.00, 'Bespoke infrastructure for large-scale operations.', FALSE)
        ON DUPLICATE KEY UPDATE name = VALUES(name);
      `;
      
      console.log('📋 Creating database and tables...');
      
      connection.query(sql, async (err, results) => {
        if (err) {
          console.error('❌ Database setup failed:', err.message);
          connection.end();
          reject(err);
          return;
        }
        
        console.log('✅ Database and tables created successfully');
        
        // Now create admin user
        try {
          console.log('👤 Creating admin user...');
          const hashedPassword = await bcrypt.hash('password', 10);
          
          const adminSql = `
            INSERT INTO users (username, email, password, role, status) 
            VALUES ('admin', 'admin@rayyan.com', ?, 'admin', 'active')
            ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin', status = 'active'
          `;
          
          connection.query(adminSql, [hashedPassword], (err, result) => {
            connection.end();
            
            if (err) {
              console.error('❌ Admin creation failed:', err.message);
              reject(err);
              return;
            }
            
            console.log('✅ Admin user created/updated successfully');
            console.log('');
            console.log('🎉 Setup completed successfully!');
            console.log('');
            console.log('🔐 Admin Credentials:');
            console.log('   📧 Email: admin@rayyan.com');
            console.log('   🔑 Password: password');
            console.log('');
            console.log('🌐 Access Points:');
            console.log('   👤 User App: http://localhost:3000');
            console.log('   🛠️  Admin Dashboard: http://localhost:3000/admin');
            console.log('');
            console.log('⚠️  Remember to change the admin password after first login!');
            
            resolve();
          });
          
        } catch (hashError) {
          console.error('❌ Password hashing failed:', hashError.message);
          connection.end();
          reject(hashError);
        }
      });
    });
  });
}

simpleSetup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));