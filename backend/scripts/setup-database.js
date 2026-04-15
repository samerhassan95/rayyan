const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Setting up Rayyan database...');
    
    // First connect without database to create it
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'rayyan',
      password: process.env.DB_PASSWORD || 'samerhassan11'
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log('🗄️  Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'rayyan_db'}`);
    console.log('✅ Database created/verified');
    
    // Close connection and reconnect to the specific database
    await connection.end();
    
    console.log('📋 Connecting to the database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'rayyan',
      password: process.env.DB_PASSWORD || 'samerhassan11',
      database: process.env.DB_NAME || 'rayyan_db'
    });
    
    // Create tables
    console.log('📋 Creating tables...');
    
    // Users table
    await connection.execute(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        category_id INT,
        image VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id)
      )
    `);
    
    // Orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10,2),
        status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_date DATE,
        notes TEXT,
        INDEX idx_user (user_id)
      )
    `);
    
    // Order items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        quantity INT DEFAULT 1,
        price DECIMAL(10,2),
        INDEX idx_order (order_id),
        INDEX idx_product (product_id)
      )
    `);
    
    // Settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables created successfully');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Check if admin exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@rayyan.com']
    );
    
    if (existingAdmin.length === 0) {
      await connection.execute(
        'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@rayyan.com', hashedPassword, 'admin', 'active']
      );
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Insert default settings
    console.log('⚙️  Setting up default configuration...');
    const defaultSettings = [
      ['site_name', 'Rayyan Admin', 'Website name'],
      ['site_email', 'admin@rayyan.com', 'Contact email'],
      ['currency', 'USD', 'Default currency'],
      ['tax_rate', '10', 'Tax percentage']
    ];
    
    for (const [key, value, desc] of defaultSettings) {
      await connection.execute(
        'INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, desc, value]
      );
    }
    
    // Insert sample categories
    console.log('📦 Adding sample categories...');
    const categories = [
      ['Electronics', 'Electronic devices and accessories'],
      ['Clothing', 'Fashion and apparel'],
      ['Books', 'Books and educational materials']
    ];
    
    for (const [name, desc] of categories) {
      await connection.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = ?',
        [name, desc, desc]
      );
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Setup Summary:');
    console.log('   ✅ Database created: rayyan_db');
    console.log('   ✅ Tables created: users, categories, products, orders, order_items, settings');
    console.log('   ✅ Admin user created');
    console.log('   ✅ Default settings configured');
    console.log('   ✅ Sample data inserted');
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
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MySQL is running on port 3307');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Database access denied. Check your credentials:');
      console.log('   Host:', process.env.DB_HOST || 'localhost');
      console.log('   Port:', process.env.DB_PORT || 3307);
      console.log('   User:', process.env.DB_USER || 'rayyan');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();